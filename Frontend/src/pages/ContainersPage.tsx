
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Trash2, 
  Pause, 
  Edit, 
  MoreVertical, 
  Search, 
  Plus, 
  Loader 
} from 'lucide-react';
import { containerService } from '@/services/dockerService';
import CreateContainerForm from '@/components/containers/CreateContainerForm';

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  created: string;
  ports: string;
}

const ContainersPage = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [filteredContainers, setFilteredContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ action: '', containerId: '' });

  // Fetch containers via service API, fallback to mock on error and show info toast if so
  const fetchContainers = async () => {
    setIsLoading(true);
    try {
      const response = await containerService.getContainers(true);
      if (
        response && 
        response.data && 
        Array.isArray(response.data) && 
        response.data.length > 0 &&
        response.data[0].id // expects lowercase 'id' like 'c1'
      ) {
        setContainers(response.data);
        setFilteredContainers(response.data);
      } else if (
        response && 
        response.data && 
        Array.isArray(response.data) && 
        (response.data[0]?.Id || response.data[0]?.Names) // raw Docker API format
      ) {
        // Format Docker API data for local table
        const formatted = response.data.map((c: any, idx: number) => ({
          id: c.Id || `c-fallback-${idx}`,
          name: c.Names ? (Array.isArray(c.Names) ? c.Names[0].replace(/^\//, '') : c.Names) : c.name || `container-${idx}`,
          image: c.Image || c.image || '',
          status: c.Status || c.status || '',
          state: c.State || c.state || '',
          created: c.Created ? new Date(c.Created * 1000).toISOString().slice(0, 19).replace('T', ' ') : '',
          ports: c.Ports && Array.isArray(c.Ports)
            ? c.Ports.map((p: any) => p.PrivatePort ? `${p.PrivatePort}/${p.Type}` : '').join(', ')
            : '',
        }));
        setContainers(formatted);
        setFilteredContainers(formatted);
      } else {
        // Unexpected data shape, fallback to mock
        toast.info('Fetching Data Error: Using mock container data');
        setContainers([
          { 
            id: 'c1', 
            name: 'nginx-proxy', 
            image: 'nginx:latest', 
            status: 'Up 2 days',
            state: 'running',
            created: '2023-04-20 14:32:15',
            ports: '80/tcp, 443/tcp'
          },
          { 
            id: 'c2', 
            name: 'postgres-db', 
            image: 'postgres:13', 
            status: 'Up 5 days',
            state: 'running',
            created: '2023-04-15 09:12:44',
            ports: '5432/tcp'
          },
          { 
            id: 'c3', 
            name: 'redis-cache', 
            image: 'redis:alpine', 
            status: 'Paused',
            state: 'paused',
            created: '2023-04-21 11:45:30',
            ports: '6379/tcp'
          },
          { 
            id: 'c4', 
            name: 'backend-api', 
            image: 'node:16-alpine', 
            status: 'Exited (1) 3 hours ago',
            state: 'exited',
            created: '2023-04-19 18:22:10',
            ports: '3000/tcp, 3001/tcp'
          },
          { 
            id: 'c5', 
            name: 'mongodb', 
            image: 'mongo:latest', 
            status: 'Up 1 day',
            state: 'running',
            created: '2023-04-20 10:15:22',
            ports: '27017/tcp'
          },
        ]);
        setFilteredContainers([
          { 
            id: 'c1', 
            name: 'nginx-proxy', 
            image: 'nginx:latest', 
            status: 'Up 2 days',
            state: 'running',
            created: '2023-04-20 14:32:15',
            ports: '80/tcp, 443/tcp'
          },
          { 
            id: 'c2', 
            name: 'postgres-db', 
            image: 'postgres:13', 
            status: 'Up 5 days',
            state: 'running',
            created: '2023-04-15 09:12:44',
            ports: '5432/tcp'
          },
          { 
            id: 'c3', 
            name: 'redis-cache', 
            image: 'redis:alpine', 
            status: 'Paused',
            state: 'paused',
            created: '2023-04-21 11:45:30',
            ports: '6379/tcp'
          },
          { 
            id: 'c4', 
            name: 'backend-api', 
            image: 'node:16-alpine', 
            status: 'Exited (1) 3 hours ago',
            state: 'exited',
            created: '2023-04-19 18:22:10',
            ports: '3000/tcp, 3001/tcp'
          },
          { 
            id: 'c5', 
            name: 'mongodb', 
            image: 'mongo:latest', 
            status: 'Up 1 day',
            state: 'running',
            created: '2023-04-20 10:15:22',
            ports: '27017/tcp'
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching containers:', error);
      toast.info('Fetching Data Error: Using mock container data');
      setContainers([
        { 
          id: 'c1', 
          name: 'nginx-proxy', 
          image: 'nginx:latest', 
          status: 'Up 2 days',
          state: 'running',
          created: '2023-04-20 14:32:15',
          ports: '80/tcp, 443/tcp'
        },
        { 
          id: 'c2', 
          name: 'postgres-db', 
          image: 'postgres:13', 
          status: 'Up 5 days',
          state: 'running',
          created: '2023-04-15 09:12:44',
          ports: '5432/tcp'
        },
        { 
          id: 'c3', 
          name: 'redis-cache', 
          image: 'redis:alpine', 
          status: 'Paused',
          state: 'paused',
          created: '2023-04-21 11:45:30',
          ports: '6379/tcp'
        },
        { 
          id: 'c4', 
          name: 'backend-api', 
          image: 'node:16-alpine', 
          status: 'Exited (1) 3 hours ago',
          state: 'exited',
          created: '2023-04-19 18:22:10',
          ports: '3000/tcp, 3001/tcp'
        },
        { 
          id: 'c5', 
          name: 'mongodb', 
          image: 'mongo:latest', 
          status: 'Up 1 day',
          state: 'running',
          created: '2023-04-20 10:15:22',
          ports: '27017/tcp'
        },
      ]);
      setFilteredContainers([
        { 
          id: 'c1', 
          name: 'nginx-proxy', 
          image: 'nginx:latest', 
          status: 'Up 2 days',
          state: 'running',
          created: '2023-04-20 14:32:15',
          ports: '80/tcp, 443/tcp'
        },
        { 
          id: 'c2', 
          name: 'postgres-db', 
          image: 'postgres:13', 
          status: 'Up 5 days',
          state: 'running',
          created: '2023-04-15 09:12:44',
          ports: '5432/tcp'
        },
        { 
          id: 'c3', 
          name: 'redis-cache', 
          image: 'redis:alpine', 
          status: 'Paused',
          state: 'paused',
          created: '2023-04-21 11:45:30',
          ports: '6379/tcp'
        },
        { 
          id: 'c4', 
          name: 'backend-api', 
          image: 'node:16-alpine', 
          status: 'Exited (1) 3 hours ago',
          state: 'exited',
          created: '2023-04-19 18:22:10',
          ports: '3000/tcp, 3001/tcp'
        },
        { 
          id: 'c5', 
          name: 'mongodb', 
          image: 'mongo:latest', 
          status: 'Up 1 day',
          state: 'running',
          created: '2023-04-20 10:15:22',
          ports: '27017/tcp'
        },
      ]);
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContainers(containers);
    } else {
      const filtered = containers.filter(
        container => 
          container.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          container.image.toLowerCase().includes(searchTerm.toLowerCase()) ||
          container.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContainers(filtered);
    }
  }, [searchTerm, containers]);

  const handleContainerAction = async (action: string, containerId: string) => {
    // Actions that need confirmation
    if (['delete', 'kill'].includes(action)) {
      setConfirmAction({ action, containerId });
      setConfirmDialogOpen(true);
      return;
    }

    try {
      // Simulate API call
      toast.promise(
        // This would be the actual API call in a real app
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: `${action.charAt(0).toUpperCase() + action.slice(1)}ing container...`,
          success: () => {
            // Update container state in the UI for demo
            if (action === 'start') {
              setContainers(containers.map(c => 
                c.id === containerId ? { ...c, state: 'running', status: 'Up 1 second' } : c
              ));
            } else if (action === 'stop') {
              setContainers(containers.map(c => 
                c.id === containerId ? { ...c, state: 'exited', status: 'Exited (0) 1 second ago' } : c
              ));
            } else if (action === 'pause') {
              setContainers(containers.map(c => 
                c.id === containerId ? { ...c, state: 'paused', status: 'Paused' } : c
              ));
            } else if (action === 'unpause') {
              setContainers(containers.map(c => 
                c.id === containerId ? { ...c, state: 'running', status: 'Up 1 second (was paused)' } : c
              ));
            } else if (action === 'restart') {
              setContainers(containers.map(c => 
                c.id === containerId ? { ...c, state: 'running', status: 'Up 1 second (restarted)' } : c
              ));
            }
            
            return `Container ${action}ed successfully`;
          },
          error: `Failed to ${action} container`,
        }
      );
    } catch (error) {
      console.error(`Error ${action}ing container:`, error);
      toast.error(`Failed to ${action} container`);
    }
  };

  const confirmActionExecution = async () => {
    const { action, containerId } = confirmAction;
    setConfirmDialogOpen(false);
    
    try {
      toast.promise(
        // This would be the actual API call in a real app
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: `${action.charAt(0).toUpperCase() + action.slice(1)}ing container...`,
          success: () => {
            if (action === 'delete') {
              // Remove container from state
              setContainers(containers.filter(c => c.id !== containerId));
            } else if (action === 'kill') {
              setContainers(containers.map(c => 
                c.id === containerId ? { ...c, state: 'exited', status: 'Exited (137) 1 second ago' } : c
              ));
            }
            return `Container ${action}d successfully`;
          },
          error: `Failed to ${action} container`,
        }
      );
    } catch (error) {
      console.error(`Error ${action}ing container:`, error);
      toast.error(`Failed to ${action} container`);
    }
  };

  const renderStatusBadge = (state: string) => {
    switch (state) {
      case 'running':
        return <span className="status-badge status-running">Running</span>;
      case 'paused':
        return <span className="status-badge status-paused">Paused</span>;
      case 'exited':
        return <span className="status-badge status-stopped">Stopped</span>;
      default:
        return <span className="status-badge status-stopped">{state}</span>;
    }
  };

  const handleCreateContainer = (formData: any) => {
    // This would submit the form data to the API in a real app
    console.log('Creating container with:', formData);

    // For demo, add a mock container
    const newContainer = {
      id: `c${containers.length + 1}`,
      name: formData.name,
      image: formData.image,
      status: 'Created',
      state: 'created',
      created: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ports: formData.ports ? formData.ports.join(', ') : ''
    };

    setContainers([...containers, newContainer]);
    setCreateDialogOpen(false);
    toast.success(`Container ${formData.name} created successfully`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64 md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search containers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Create Container
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Container</DialogTitle>
              <DialogDescription>
                Configure a new container to deploy
              </DialogDescription>
            </DialogHeader>
            <CreateContainerForm onSubmit={handleCreateContainer} onCancel={() => setCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Containers</CardTitle>
          <CardDescription>Manage your Docker containers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Image</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Created</th>
                  <th className="text-left p-3 font-medium">Ports</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">Loading containers...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredContainers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <p className="text-muted-foreground">No containers found</p>
                      {searchTerm && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Try adjusting your search query
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredContainers.map((container) => (
                    <tr key={container.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{container.name}</td>
                      <td className="p-3 text-sm">{container.image}</td>
                      <td className="p-3">
                        {renderStatusBadge(container.state)}
                        <span className="block text-xs text-muted-foreground mt-1">{container.status}</span>
                      </td>
                      <td className="p-3 text-sm">{container.created}</td>
                      <td className="p-3 text-sm">{container.ports}</td>
                      <td className="p-3 text-right space-x-1">
                        {container.state === 'running' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleContainerAction('pause', container.id)}
                              title="Pause"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleContainerAction('stop', container.id)}
                              title="Stop"
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {container.state === 'paused' && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleContainerAction('unpause', container.id)}
                            title="Unpause"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {container.state === 'exited' && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleContainerAction('start', container.id)}
                            title="Start"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleContainerAction('restart', container.id)}
                          title="Restart"
                        >
                          <RefreshCw className="h-4 w-4" />
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
                            <DropdownMenuItem onClick={() => {
                              setSelectedContainer(container);
                              // This would open rename dialog in a real app
                              toast.info('Rename dialog would open here');
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleContainerAction('kill', container.id)}>
                              <Square className="mr-2 h-4 w-4" />
                              <span>Kill</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleContainerAction('delete', container.id)}
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

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {confirmAction.action === 'delete' 
                ? 'Are you sure you want to delete this container? This action cannot be undone.'
                : 'Are you sure you want to kill this container? This may cause data loss.'}
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
              {confirmAction.action === 'delete' ? 'Delete' : 'Kill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContainersPage;
