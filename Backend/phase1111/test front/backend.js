
const os = require('os');

const SUPPORTED_FORMATS = ['qcow2', 'vmdk', 'raw', 'vdi', 'vpc'];
const DYNAMIC_ONLY_FORMATS = ['vdi', 'vpc'];
const FIXED_UNSUPPORTED_ON_WINDOWS = ['qcow2'];

app.post('/create-disk', (req, res) => {
  let { name, size, format, type = 'dynamic' } = req.body;

  // Normalize case
  format = format.toLowerCase();
  type = type.toLowerCase();

  // Basic validation
  if (!name || !size || !format || !SUPPORTED_FORMATS.includes(format)) {
    return res.status(400).json({ error: `Invalid or missing disk parameters. Supported formats: ${SUPPORTED_FORMATS.join(', ')}` });
  }

  const filePath = path.join(DISK_DIR, `${name}.${format}`);
  const isWindows = os.platform() === 'win32';
  let options = '';

  // Format-specific handling
  switch (format) {
    case 'qcow2':
      if (type === 'fixed') {
        if (isWindows) {
          console.warn(`⚠️ Skipping preallocation=full on Windows`);
          options = '-o preallocation=metadata'; // fallback
        } else {
          options = '-o preallocation=full';
        }
      } else {
        options = '-o preallocation=metadata';
      }
      break;

    case 'vmdk':
      options = type === 'fixed' ? '-o subformat=monolithicFlat' : '-o subformat=streamOptimized';
      break;

    case 'raw':
      if (type === 'dynamic') {
        return res.status(400).json({
          error: `'raw' format does not support dynamic disks. Use 'fixed' or omit the type.`
        });
      }
      break;

    case 'vdi':
    case 'vpc':
      if (type === 'fixed') {
        return res.status(400).json({
          error: `'${format}' format does not support fixed disks. Only dynamic allocation is supported.`
        });
      }
      // no options needed
      break;
  }

  const command = `qemu-img create -f ${format} ${options} "${filePath}" ${size}G`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error creating disk: ${stderr}`);
      return res.status(500).json({ error: stderr });
    }
    console.log(`✅ Disk created: ${stdout}`);
    res.json({ message: `✅ Disk "${name}.${format}" created successfully` });
  });
});


app.post('/create-vm', (req, res) => {
    const { name, cpu, memory, diskName, format, iso } = req.body;
  
  
    if (!name || !cpu || !memory || !diskName || !format) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
  
    const diskPath = path.join(DISK_DIR, `${diskName}.${format}`);
    if (!fs.existsSync(diskPath)) {
      console.error(`❌ Disk not found: ${diskPath}`);
      return res.status(404).json({ error: 'Disk not found' });
    }
  
  
    let command = `qemu-system-x86_64 -name "${name}" -smp ${cpu} -m ${memory} -hda "${diskPath}"`;
  
   
    if (iso) {
      const isoPath = path.join(ISO_DIR, iso);
      if (!fs.existsSync(isoPath)) {
        console.error(`❌ ISO not found: ${isoPath}`);
        return res.status(404).json({ error: 'ISO not found' });
      }
      command += ` -cdrom "${isoPath}" -boot d`;
    }
  
  
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(`🔥 Error starting VM: ${stderr}`);
        return res.status(500).json({ error: stderr });
      }
      console.log(`✅ VM started: ${stdout}`);
      res.json({ message: `🖥️ VM started for disk "${diskName}"` });
    });
  });


