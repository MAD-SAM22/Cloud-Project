
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  FileText, 
  RefreshCw, 
  Search, 
  Download, 
  Copy, 
  XCircle, 
  Loader 
} from 'lucide-react';
import { containerService } from '@/services/dockerService';
import { qemuService } from '@/services/qemuService';

const LogsPage = () => {
  const [logSource, setLogSource] = useState('container');
  const [logId, setLogId] = useState('');
  const [logOptions, setLogOptions] = useState({
    follow: true,
    tail: '100',
    timestamps: true,
    since: '',
    until: '',
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<string[]>([]);
  const [sources, setSources] = useState({
    containers: [] as any[],
    vms: [] as any[]
  });

  const logsEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Mock fetch function for log sources
  const fetchLogSources = async () => {
    try {
      // In a real app, these would be API calls:
      // const containerRes = await containerService.getContainers();
      // const vmRes = await qemuService.getVMs();
      
      // Mock data for demo
      setTimeout(() => {
        setSources({
          containers: [
            { id: 'c1', name: 'nginx-proxy' },
            { id: 'c2', name: 'postgres-db' },
            { id: 'c3', name: 'redis-cache' },
          ],
          vms: [
            { id: 'vm1', name: 'ubuntu-server' },
            { id: 'vm2', name: 'windows-test' },
            { id: 'vm3', name: 'centos-web' },
          ]
        });
      }, 500);
    } catch (error) {
      console.error('Error fetching log sources:', error);
      toast.error('Failed to fetch log sources');
    }
  };

  // Fetch logs function
  const fetchLogs = async () => {
    if (!logId) {
      toast.error('Please select a log source');
      return;
    }

    setIsLoading(true);
    setLogs([]);

    try {
      // In a real app, this would be an API call:
      // if (logSource === 'container') {
      //   const response = await containerService.getContainerLogs(logId, logOptions.follow, logOptions.tail);
      //   // Process logs
      // } else {
      //   const response = await qemuService.getVMLogs(logId);
      //   // Process logs
      // }
      
      // Mock data for demo
      setTimeout(() => {
        const mockLogGenerator = () => {
          const logTypes = [
            'INFO: Connection established',
            'DEBUG: Processing request',
            'INFO: Request completed successfully',
            'WARN: Slow query detected',
            'ERROR: Failed to connect to database',
            'INFO: Cache hit ratio: 78%',
            'DEBUG: Setting up environment',
            'INFO: Service started successfully',
            'WARN: Resource usage approaching limit',
            'ERROR: Unable to write to file',
          ];
          
          const timestamp = new Date().toISOString();
          const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
          
          return logOptions.timestamps 
            ? `${timestamp} ${logType}`
            : logType;
        };

        // Generate initial logs
        const initialLogs = Array.from({ length: parseInt(logOptions.tail) }, mockLogGenerator);
        setLogs(initialLogs);
        setFilteredLogs(initialLogs);
        setIsLoading(false);
        
        // If follow is enabled, simulate streaming logs
        if (logOptions.follow) {
          setIsFollowing(true);
          const interval = setInterval(() => {
            if (shouldAutoScroll.current) {
              const newLog = mockLogGenerator();
              setLogs(prevLogs => {
                const newLogs = [...prevLogs, newLog];
                if (searchTerm) {
                  setFilteredLogs(newLogs.filter(log => 
                    log.toLowerCase().includes(searchTerm.toLowerCase())
                  ));
                } else {
                  setFilteredLogs(newLogs);
                }
                return newLogs;
              });
            }
          }, 2000);

          // Clean up interval on component unmount
          return () => clearInterval(interval);
        }
      }, 1000);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to fetch logs');
      setIsLoading(false);
      setIsFollowing(false);
    }
  };

  const stopFollowing = () => {
    setIsFollowing(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term) {
      setFilteredLogs(logs.filter(log => 
        log.toLowerCase().includes(term.toLowerCase())
      ));
    } else {
      setFilteredLogs(logs);
    }
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(filteredLogs.join('\n'));
    toast.success('Logs copied to clipboard');
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([filteredLogs.join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${logSource}_${logId}_logs.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Logs downloaded');
  };

  const handleClearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
    toast.info('Logs cleared');
  };

  useEffect(() => {
    fetchLogSources();
  }, []);

  useEffect(() => {
    if (logsEndRef.current && shouldAutoScroll.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs]);

  useEffect(() => {
    return () => {
      // Clean up when component unmounts - would cancel any subscription in a real app
      setIsFollowing(false);
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // If we're near the bottom, enable auto-scroll
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Log Viewer</CardTitle>
          <CardDescription>View and analyze logs from containers and VMs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="log-source">Source Type</Label>
              <Select
                value={logSource}
                onValueChange={(value) => {
                  setLogSource(value);
                  setLogId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="container">Docker Container</SelectItem>
                  <SelectItem value="vm">QEMU VM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logId">{logSource === 'container' ? 'Container' : 'VM'}</Label>
              <Select
                value={logId}
                onValueChange={setLogId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${logSource}`} />
                </SelectTrigger>
                <SelectContent>
                  {logSource === 'container' 
                    ? sources.containers.map(container => (
                        <SelectItem key={container.id} value={container.id}>
                          {container.name}
                        </SelectItem>
                      ))
                    : sources.vms.map(vm => (
                        <SelectItem key={vm.id} value={vm.id}>
                          {vm.name}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tail">Tail Lines</Label>
              <Select
                value={logOptions.tail}
                onValueChange={(value) => setLogOptions({...logOptions, tail: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Number of lines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">Last 50 lines</SelectItem>
                  <SelectItem value="100">Last 100 lines</SelectItem>
                  <SelectItem value="500">Last 500 lines</SelectItem>
                  <SelectItem value="1000">Last 1000 lines</SelectItem>
                  <SelectItem value="all">All available</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end space-x-2">
              <Button 
                onClick={fetchLogs} 
                disabled={!logId || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    {isFollowing ? 'Restart Stream' : 'Get Logs'}
                  </>
                )}
              </Button>
              {isFollowing && (
                <Button 
                  variant="outline" 
                  onClick={stopFollowing}
                >
                  Stop
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search logs..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="timestamps"
                checked={logOptions.timestamps}
                onCheckedChange={(checked) => setLogOptions({...logOptions, timestamps: !!checked})}
              />
              <Label htmlFor="timestamps">Show timestamps</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="follow"
                checked={logOptions.follow}
                onCheckedChange={(checked) => setLogOptions({...logOptions, follow: !!checked})}
              />
              <Label htmlFor="follow">Follow logs</Label>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyLogs}
              disabled={filteredLogs.length === 0}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadLogs}
              disabled={filteredLogs.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearLogs}
              disabled={filteredLogs.length === 0}
            >
              <XCircle className="mr-2 h-4 w-4" /> Clear
            </Button>
          </div>
          
          <div className="border rounded-md bg-black text-green-400 h-[500px] font-mono text-sm relative">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-white">Loading logs...</p>
                </div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex justify-center items-center h-full text-white">
                {logId ? 'No logs available or matching filter' : 'Select a log source and click "Get Logs"'}
              </div>
            ) : (
              <ScrollArea className="h-full p-4" onScrollCapture={handleScroll}>
                {filteredLogs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap break-all mb-1">
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </ScrollArea>
            )}
            {isFollowing && !isLoading && (
              <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs animate-pulse">
                Live streaming
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsPage;
