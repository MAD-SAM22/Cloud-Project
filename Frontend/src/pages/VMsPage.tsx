import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Play, 
  Square, 
  RefreshCw, 
  Trash2, 
  Pause, 
  Edit, 
  MoreVertical, 
  Plus, 
  Loader, 
  Camera, 
  Monitor,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { qemuService } from '@/services/qemuService';
import CreateVMForm from '@/components/vms/CreateVMForm';

interface VM {
  id: string;
  name: string;
  status: string;
  cpu: string;
  memory: string;
  storage: string;
  os: string;
  uptime?: string;
}

const VMsPage = () => {
  const [vms, setVMs] = useState<VM[]>([]);
  const [filteredVMs, setFilteredVMs] = useState<VM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ action: '', vmId: '' });
  const [consoleDialogOpen, setConsoleDialogOpen] = useState(false);
  const [selectedVM, setSelectedVM] = useState<VM | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);

  useEffect(() => {
    // Try to fetch QEMU VMs on page load
    qemuService.getVMs()
      .then((res) => {
        console.log('Fetched QEMU VMs:', res?.data);
      })
      .catch((err) => {
        console.warn('Error fetching QEMU VMs:', err);
      });
      
    // Fetch images
    fetchVMs();
  }, []);

  const fetchVMs = async () => {
    setIsLoading(true);
    try {
      setTimeout(() => {
        const mockVMs = [
          { 
            id: 'vm1', 
            name: 'ubuntu-server', 
            status: 'running', 
            cpu: '2 vCPUs', 
            memory: '2 GB', 
            storage: '20 GB',
            os: 'Ubuntu 22.04',
            uptime: '2 days, 5 hours'
          },
          { 
            id: 'vm2', 
            name: 'windows-test', 
            status: 'stopped', 
            cpu: '4 vCPUs', 
            memory: '8 GB', 
            storage: '50 GB',
            os: 'Windows Server 2019'
          },
          { 
            id: 'vm3', 
            name: 'centos-web', 
            status: 'running', 
            cpu: '1 vCPU', 
            memory: '1 GB', 
            storage: '10 GB',
            os: 'CentOS 8',
            uptime: '14 days, 12 hours'
          },
          { 
            id: 'vm4', 
            name: 'debian-db', 
            status: 'paused', 
            cpu: '2 vCPUs', 
            memory: '4 GB', 
            storage: '40 GB',
            os: 'Debian 11'
          },
          { 
            id: 'vm5', 
            name: 'alpine-test', 
            status: 'stopped', 
            cpu: '1 vCPU', 
            memory: '512 MB', 
            storage: '5 GB',
            os: 'Alpine Linux'
          },
        ];
        setVMs(mockVMs);
        setFilteredVMs(mockVMs);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching VMs:', error);
      toast.error('Failed to fetch VMs');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVMs();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredVMs(vms);
    } else {
      const filtered = vms.filter(
        vm => 
          vm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vm.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vm.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVMs(filtered);
    }
  }, [searchTerm, vms]);

  const handleVMAction = async (action: string, vmId: string) => {
    if (['delete'].includes(action)) {
      setConfirmAction({ action, vmId });
      setConfirmDialogOpen(true);
      return;
    }

    if (action === 'console') {
      const vm = vms.find(v => v.id === vmId);
      if (vm) {
        setSelectedVM(vm);
        const mockOutput = [
          'QEMU 6.2.0 monitor - type \'help\' for more information',
          '(qemu) info status',
          'VM status: running',
          '(qemu) info cpus',
          'CPU #0: thread_id=12345',
          'CPU #1: thread_id=12346',
          '(qemu) info block',
          'drive-virtio-disk0: /var/lib/qemu/images/disk.qcow2 (qcow2)',
          'drive-ide0-0-0: /var/lib/qemu/images/cd.iso (raw, read-only)',
          '(qemu) _'
        ];
        setConsoleOutput(mockOutput);
        setConsoleDialogOpen(true);
      }
      return;
    }

    try {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: `${action.charAt(0).toUpperCase() + action.slice(1)}ing VM...`,
          success: () => {
            if (action === 'start') {
              setVMs(vms.map(vm => 
                vm.id === vmId ? { ...vm, status: 'running', uptime: 'Just started' } : vm
              ));
            } else if (action === 'stop') {
              setVMs(vms.map(vm => 
                vm.id === vmId ? { ...vm, status: 'stopped', uptime: undefined } : vm
              ));
            } else if (action === 'pause') {
              setVMs(vms.map(vm => 
                vm.id === vmId ? { ...vm, status: 'paused' } : vm
              ));
            } else if (action === 'resume') {
              setVMs(vms.map(vm => 
                vm.id === vmId ? { ...vm, status: 'running', uptime: vm.uptime || 'Just resumed' } : vm
              ));
            } else if (action === 'restart') {
              setVMs(vms.map(vm => 
                vm.id === vmId ? { ...vm, status: 'running', uptime: 'Just restarted' } : vm
              ));
            } else if (action === 'snapshot') {
              toast.info('Snapshot created successfully', {
                description: 'VM snapshot has been saved'
              });
            }
            return `VM ${action}ed successfully`;
          },
          error: `Failed to ${action} VM`,
        }
      );
    } catch (error) {
      console.error(`Error ${action}ing VM:`, error);
      toast.error(`Failed to ${action} VM`);
    }
  };

  const confirmActionExecution = async () => {
    const { action, vmId } = confirmAction;
    setConfirmDialogOpen(false);
    
    try {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: `${action.charAt(0).toUpperCase() + action.slice(1)}ing VM...`,
          success: () => {
            if (action === 'delete') {
              setVMs(vms.filter(vm => vm.id !== vmId));
            }
            return `VM ${action}d successfully`;
          },
          error: `Failed to ${action} VM`,
        }
      );
    } catch (error) {
      console.error(`Error ${action}ing VM:`, error);
      toast.error(`Failed to ${action} VM`);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <span className="status-badge status-running">Running</span>;
      case 'paused':
        return <span className="status-badge status-paused">Paused</span>;
      case 'stopped':
        return <span className="status-badge status-stopped">Stopped</span>;
      default:
        return <span className="status-badge status-stopped">{status}</span>;
    }
  };

  const handleCreateVM = (formData: any) => {
    console.log('Creating VM with:', formData);

    const newVM = {
      id: `vm${vms.length + 1}`,
      name: formData.name,
      status: 'stopped',
      cpu: `${formData.cpus} vCPU${formData.cpus > 1 ? 's' : ''}`,
      memory: `${formData.memory} GB`,
      storage: `${formData.diskSize} GB`,
      os: formData.os || 'Custom OS'
    };

    setVMs([...vms, newVM]);
    setCreateDialogOpen(false);
    toast.success(`VM ${formData.name} created successfully`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64 md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search VMs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Create VM
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Virtual Machine</DialogTitle>
              <DialogDescription>
                Configure a new QEMU virtual machine
              </DialogDescription>
            </DialogHeader>
            <CreateVMForm onSubmit={handleCreateVM} onCancel={() => setCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QEMU Virtual Machines</CardTitle>
          <CardDescription>Manage your QEMU VMs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">OS</th>
                  <th className="text-left p-3 font-medium">vCPU / Memory</th>
                  <th className="text-left p-3 font-medium">Storage</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">Loading virtual machines...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredVMs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <p className="text-muted-foreground">No virtual machines found</p>
                      {searchTerm && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Try adjusting your search query
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredVMs.map((vm) => (
                    <tr key={vm.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{vm.name}</td>
                      <td className="p-3">
                        {renderStatusBadge(vm.status)}
                        {vm.uptime && (
                          <span className="block text-xs text-muted-foreground mt-1">
                            Uptime: {vm.uptime}
                          </span>
                        )}
                      </td>
                      <td className="p-3">{vm.os}</td>
                      <td className="p-3">{vm.cpu} / {vm.memory}</td>
                      <td className="p-3">{vm.storage}</td>
                      <td className="p-3 text-right space-x-1">
                        {vm.status === 'running' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleVMAction('pause', vm.id)}
                              title="Pause"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleVMAction('stop', vm.id)}
                              title="Stop"
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {vm.status === 'paused' && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleVMAction('resume', vm.id)}
                            title="Resume"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {vm.status === 'stopped' && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleVMAction('start', vm.id)}
                            title="Start"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleVMAction('restart', vm.id)}
                          title="Restart"
                          disabled={vm.status !== 'running'}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleVMAction('console', vm.id)}
                          title="Console"
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleVMAction('snapshot', vm.id)}
                              disabled={vm.status !== 'running' && vm.status !== 'paused'}
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              <span>Create Snapshot</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              toast.info('Edit dialog would open here');
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              toast.info('Migrate dialog would open here');
                            }}>
                              <ArrowRight className="mr-2 h-4 w-4" />
                              <span>Migrate</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleVMAction('delete', vm.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this virtual machine? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmActionExecution}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={consoleDialogOpen} onOpenChange={setConsoleDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {selectedVM?.name} Console
              {selectedVM?.status && (
                <span className="ml-2 text-sm font-normal">{renderStatusBadge(selectedVM.status)}</span>
              )}
            </DialogTitle>
            <DialogDescription>
              QEMU virtual machine console output
            </DialogDescription>
          </DialogHeader>
          <div className="bg-black rounded-md p-4 h-[400px] overflow-y-auto font-mono text-sm">
            <pre className="text-green-400 whitespace-pre-wrap">
              {consoleOutput.join('\n')}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsoleDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VMsPage;
