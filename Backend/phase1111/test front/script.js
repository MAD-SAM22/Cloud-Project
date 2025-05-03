// Global variables
let disks = [];
let vms = [];
let diskToDelete = null;
let vmToAction = null;

// Initialize Bootstrap toasts
const successToast = new bootstrap.Toast(document.getElementById('successToast'));
const errorToast = new bootstrap.Toast(document.getElementById('errorToast'));

// Load disks and VMs when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadDisks();
  loadVMs();
  loadISOs();
});

// Load available disks for VM creation
async function loadDisks() {
  try {
    const response = await fetch('http://localhost:3000/list-disks');
    if (!response.ok) throw new Error('Failed to load disks');
    
    const diskFiles = await response.json();
    disks = diskFiles.map(file => {
      const [name, format] = file.split('.');
      return { name, format };
    });
    
    // Update disks table
    updateDisksTable();
    
    // Update disk select in VM creation modal
    const diskSelect = document.getElementById('vmDisk');
    diskSelect.innerHTML = disks.map(disk => 
      `<option value="${disk.name}.${disk.format}">${disk.name} (${disk.format})</option>`
    ).join('');
  } catch (error) {
    showError('Failed to load disks: ' + error.message);
  }
}

// Load available ISOs for VM creation
async function loadISOs() {
  try {
    const response = await fetch('http://localhost:3000/isos');
    if (!response.ok) throw new Error('Failed to load ISOs');
    
    const isos = await response.json();
    const isoSelect = document.getElementById('vmISO');
    isoSelect.innerHTML = '<option value="">No ISO (boot existing)</option>' +
      isos.map(iso => `<option value="${iso}">${iso}</option>`).join('');
  } catch (error) {
    showError('Failed to load ISOs: ' + error.message);
  }
}

// Load VMs
async function loadVMs() {
  try {
    const response = await fetch('http://localhost:3000/list-vms');
    if (!response.ok) throw new Error('Failed to load VMs');
    
    vms = await response.json();
    updateVMsTable();
  } catch (error) {
    showError('Failed to load VMs: ' + error.message);
  }
}

// Update disks table
function updateDisksTable() {
  const tbody = document.getElementById('disksTableBody');
  tbody.innerHTML = disks.map(disk => `
    <tr id="disk-row-${disk.name}">
      <td class="disk-name">${disk.name}</td>
      <td class="disk-format">${disk.format}</td>
      <td id="disk-size-${disk.name}">Loading...</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-danger btn-sm btn-action" onclick="showDeleteModal('${disk.name}.${disk.format}')">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  // Fetch and update size for each disk
  disks.forEach(disk => fetchAndSetDiskSize(disk.name));
}

async function fetchAndSetDiskSize(diskName) {
  try {
    const response = await fetch(`http://localhost:3000/disk-info/${diskName}`);
    if (!response.ok) throw new Error('Failed to fetch disk info');
    const info = await response.json();
    const sizeCell = document.getElementById(`disk-size-${diskName}`);
    if (sizeCell) {
      sizeCell.textContent = formatSize(info.virtual_size);
    }
  } catch (error) {
    const sizeCell = document.getElementById(`disk-size-${diskName}`);
    if (sizeCell) {
      sizeCell.textContent = 'N/A';
    }
  }
}

function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return 'N/A';
  if (bytes >= 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  } else if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else if (bytes >= 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return bytes + ' B';
  }
}

// Update VMs table
function updateVMsTable() {
  const tbody = document.getElementById('vmsTableBody');
  tbody.innerHTML = vms.map(vm => `
    <tr>
      <td class="vm-name">${vm.name}</td>
      <td>${vm.cpu} cores</td>
      <td>${vm.memory} MB</td>
      <td>${vm.disk}</td>
      <td class="vm-status ${vm.status === 'running' ? 'vm-running' : 'vm-stopped'}">
        ${vm.status === 'running' ? 'Running' : 'Stopped'}
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-primary btn-sm btn-action" onclick="showVMActions('${vm.name}')">
            <i class="bi bi-gear"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Create new disk
async function createDisk() {
  const name = document.getElementById('diskName').value;
  const size = document.getElementById('diskSize').value;
  const format = document.getElementById('diskFormat').value;

  if (!name || !size || !format) {
    showError('Please fill in all fields');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/create-disk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, size, format })
    });

    if (!response.ok) throw new Error('Failed to create disk');
    
    const result = await response.text();
    showSuccess(result);
    bootstrap.Modal.getInstance(document.getElementById('createDiskModal')).hide();
    loadDisks();
  } catch (error) {
    showError('Failed to create disk: ' + error.message);
  }
}

// Create new VM
async function createVM() {
  const name = document.getElementById('vmName').value;
  const cpu = document.getElementById('vmCPU').value;
  const memory = document.getElementById('vmMemory').value;
  const selectedDisk = document.getElementById('vmDisk').value;
  const iso = document.getElementById('vmISO').value;

  let diskName, format;
  if (selectedDisk.includes('.')) {
    [diskName, format] = selectedDisk.split('.');
  } else {
    diskName = selectedDisk;
    format = 'qcow2'; // default if not present
  }

  if (!name || !cpu || !memory || !diskName || !format) {
    showError('Please fill in all required fields');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/create-vm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, cpu, memory, diskName, format, iso })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create VM');
    }

    showSuccess(result.message);
    bootstrap.Modal.getInstance(document.getElementById('createVMModal')).hide();
    loadVMs(); // Refresh VM table immediately
  } catch (error) {
    showError('Failed to create VM: ' + error.message);
  }
}

// Show delete confirmation modal
function showDeleteModal(filename) {
  diskToDelete = filename;
  document.getElementById('deleteDiskName').textContent = filename;
  new bootstrap.Modal(document.getElementById('deleteDiskModal')).show();
}

// Show VM actions modal
function showVMActions(vmName) {
  vmToAction = vmName;
  document.getElementById('vmActionName').textContent = vmName;
  new bootstrap.Modal(document.getElementById('vmActionsModal')).show();
}

async function confirmDelete() {
  if (!diskToDelete) return;

  try {
    const response = await fetch(`http://localhost:3000/delete-disk/${diskToDelete}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to delete disk');

    showSuccess(result.message);
    bootstrap.Modal.getInstance(document.getElementById('deleteDiskModal')).hide();
    loadDisks();
  } catch (error) {
    showError('Failed to delete disk: ' + error.message);
  }
}


// Start VM
async function startVM() {
  if (!vmToAction) return;

  try {
    const response = await fetch(`http://localhost:3000/start-vm/${vmToAction}`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to start VM');
    
    const result = await response.text();
    showSuccess(result);
    bootstrap.Modal.getInstance(document.getElementById('vmActionsModal')).hide();
    loadVMs();
  } catch (error) {
    showError('Failed to start VM: ' + error.message);
  }
}

// Stop VM
async function stopVM() {
  if (!vmToAction) return;

  try {
    const response = await fetch(`http://localhost:3000/stop-vm/${vmToAction}`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Failed to stop VM');
    
    const result = await response.text();
    showSuccess(result);
    bootstrap.Modal.getInstance(document.getElementById('vmActionsModal')).hide();
    loadVMs();
  } catch (error) {
    showError('Failed to stop VM: ' + error.message);
  }
}

// Delete VM
async function deleteVM() {
  if (!vmToAction) return;

  try {
    const response = await fetch(`http://localhost:3000/delete-vm/${vmToAction}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete VM');
    
    const result = await response.text();
    showSuccess(result);
    bootstrap.Modal.getInstance(document.getElementById('vmActionsModal')).hide();
    loadVMs();
  } catch (error) {
    showError('Failed to delete VM: ' + error.message);
  }
}

// Show success toast
function showSuccess(message) {
  document.getElementById('successToastMessage').textContent = message;
  successToast.show();
}

// Show error toast
function showError(message) {
  document.getElementById('errorToastMessage').textContent = message;
  errorToast.show();
}
