import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Image, Server, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { containerService } from '@/services/dockerService';
import { imageService } from '@/services/dockerService';
import { qemuService } from '@/services/qemuService';

const generateMockData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    name: `${i * 10}m`,
    cpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
    network: Math.floor(Math.random() * 100),
  }));
};

const DashboardPage = () => {
  const [containers, setContainers] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [vms, setVMs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemData] = useState(() => generateMockData(24));

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      setTimeout(() => {
        setContainers([
          { id: 'c1', name: 'nginx-proxy', image: 'nginx:latest', status: 'running', created: '2 days ago', cpu: '0.5%', memory: '128MB' },
          { id: 'c2', name: 'postgres-db', image: 'postgres:13', status: 'running', created: '5 days ago', cpu: '1.2%', memory: '256MB' },
          { id: 'c3', name: 'redis-cache', image: 'redis:alpine', status: 'paused', created: '1 day ago', cpu: '0%', memory: '64MB' },
        ]);
        
        setImages([
          { id: 'i1', repository: 'nginx', tag: 'latest', size: '133MB', created: '2 weeks ago' },
          { id: 'i2', repository: 'postgres', tag: '13', size: '314MB', created: '1 month ago' },
          { id: 'i3', repository: 'redis', tag: 'alpine', size: '32MB', created: '3 weeks ago' },
        ]);
        
        setVMs([
          { id: 'v1', name: 'ubuntu-server', status: 'running', memory: '2GB', cpu: '2 cores', storage: '20GB' },
          { id: 'v2', name: 'windows-test', status: 'stopped', memory: '4GB', cpu: '4 cores', storage: '50GB' },
        ]);
        
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    { 
      title: 'Containers', 
      value: containers.length, 
      running: containers.filter(c => c.status === 'running').length,
      icon: <Box className="h-5 w-5 text-docker-blue" /> 
    },
    { 
      title: 'Images', 
      value: images.length, 
      icon: <Image className="h-5 w-5 text-docker-navy" /> 
    },
    { 
      title: 'QEMU VMs', 
      value: vms.length, 
      running: vms.filter(vm => vm.status === 'running').length,
      icon: <Server className="h-5 w-5 text-qemu-purple" /> 
    },
    { 
      title: 'System Load', 
      value: '23%', 
      icon: <Activity className="h-5 w-5 text-primary" /> 
    },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={fetchDashboardData} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  {stat.running !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.running} running
                    </p>
                  )}
                </div>
                <div className="bg-secondary p-3 rounded-full">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
          <CardDescription>Resource utilization over the last 4 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={systemData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stackId="1" 
                  stroke="#1D63ED" 
                  fill="#1D63ED" 
                  fillOpacity={0.3} 
                />
                <Area 
                  type="monotone" 
                  dataKey="memory" 
                  stackId="2" 
                  stroke="#6F4E7C" 
                  fill="#6F4E7C" 
                  fillOpacity={0.3} 
                />
                <Area 
                  type="monotone" 
                  dataKey="network" 
                  stackId="3" 
                  stroke="#0DB7ED" 
                  fill="#0DB7ED" 
                  fillOpacity={0.3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Containers</CardTitle>
            <CardDescription>Latest container activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left py-3 px-4 font-medium">Name</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">Image</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">Status</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">CPU/Mem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-4 text-center">
                        <Box className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    containers.slice(0, 3).map((container) => (
                      <TableRow key={container.id} className="border-b last:border-b-0">
                        <TableCell className="py-3 px-4">{container.name}</TableCell>
                        <TableCell className="py-3 px-4 text-sm">{container.image}</TableCell>
                        <TableCell className="py-3 px-4">
                          <span className={`status-badge ${
                            container.status === 'running' ? 'status-running' :
                            container.status === 'paused' ? 'status-paused' : 'status-stopped'
                          }`}>
                            {container.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm text-muted-foreground">
                          {container.cpu} / {container.memory}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QEMU VMs</CardTitle>
            <CardDescription>Virtual machine status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left py-3 px-4 font-medium">Name</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">Status</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">Memory</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">CPU</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-4 text-center">
                        <Server className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    vms.map((vm) => (
                      <TableRow key={vm.id} className="border-b last:border-b-0">
                        <TableCell className="py-3 px-4">{vm.name}</TableCell>
                        <TableCell className="py-3 px-4">
                          <span className={`status-badge ${
                            vm.status === 'running' ? 'status-running' : 'status-stopped'
                          }`}>
                            {vm.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4">{vm.memory}</TableCell>
                        <TableCell className="py-3 px-4">{vm.cpu}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current status of all services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Docker Engine', status: 'healthy', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
              { name: 'QEMU/KVM Service', status: 'healthy', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
              { name: 'API Gateway', status: 'healthy', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
              { name: 'Authentication Service', status: 'healthy', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
              { name: 'Monitoring Service', status: 'warning', icon: <AlertTriangle className="h-5 w-5 text-amber-500" /> },
              { name: 'Backup Service', status: 'healthy', icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="font-medium">{service.name}</span>
                <div className="flex items-center">
                  <span className="text-sm mr-2 text-muted-foreground">{service.status}</span>
                  {service.icon}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
