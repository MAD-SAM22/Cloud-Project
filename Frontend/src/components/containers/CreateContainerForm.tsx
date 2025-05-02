
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, MinusCircle } from 'lucide-react';

interface CreateContainerFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const CreateContainerForm = ({ onSubmit, onCancel }: CreateContainerFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    command: '',
    ports: [{ hostPort: '', containerPort: '', protocol: 'tcp' }],
    volumes: [{ hostPath: '', containerPath: '', readOnly: false }],
    environment: [{ key: '', value: '' }],
    restartPolicy: 'no',
    networkMode: 'bridge',
    memory: '',
    cpus: '',
    privileged: false,
    pullPolicy: 'ifnotpresent',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format the data as needed
    const formattedData = {
      ...formData,
      ports: formData.ports
        .filter(p => p.hostPort && p.containerPort)
        .map(p => `${p.hostPort}:${p.containerPort}/${p.protocol}`),
      volumes: formData.volumes
        .filter(v => v.hostPath && v.containerPath)
        .map(v => `${v.hostPath}:${v.containerPath}${v.readOnly ? ':ro' : ''}`),
      environment: formData.environment
        .filter(e => e.key)
        .reduce((acc, curr) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {} as Record<string, string>),
    };
    
    onSubmit(formattedData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  // Port mappings
  const addPort = () => {
    setFormData({
      ...formData,
      ports: [...formData.ports, { hostPort: '', containerPort: '', protocol: 'tcp' }],
    });
  };

  const removePort = (index: number) => {
    const updatedPorts = formData.ports.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      ports: updatedPorts,
    });
  };

  const updatePort = (index: number, field: string, value: string) => {
    const updatedPorts = formData.ports.map((port, i) => {
      if (i === index) {
        return { ...port, [field]: value };
      }
      return port;
    });
    setFormData({
      ...formData,
      ports: updatedPorts,
    });
  };

  // Volume mappings
  const addVolume = () => {
    setFormData({
      ...formData,
      volumes: [...formData.volumes, { hostPath: '', containerPath: '', readOnly: false }],
    });
  };

  const removeVolume = (index: number) => {
    const updatedVolumes = formData.volumes.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      volumes: updatedVolumes,
    });
  };

  const updateVolume = (index: number, field: string, value: any) => {
    const updatedVolumes = formData.volumes.map((volume, i) => {
      if (i === index) {
        return { ...volume, [field]: value };
      }
      return volume;
    });
    setFormData({
      ...formData,
      volumes: updatedVolumes,
    });
  };

  // Environment variables
  const addEnv = () => {
    setFormData({
      ...formData,
      environment: [...formData.environment, { key: '', value: '' }],
    });
  };

  const removeEnv = (index: number) => {
    const updatedEnv = formData.environment.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      environment: updatedEnv,
    });
  };

  const updateEnv = (index: number, field: string, value: string) => {
    const updatedEnv = formData.environment.map((env, i) => {
      if (i === index) {
        return { ...env, [field]: value };
      }
      return env;
    });
    setFormData({
      ...formData,
      environment: updatedEnv,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="basic">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="networking">Networking</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Container Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="my-container"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <Input
              id="image"
              name="image"
              placeholder="nginx:latest"
              value={formData.image}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="command">Command (optional)</Label>
            <Input
              id="command"
              name="command"
              placeholder="sh -c 'echo hello world'"
              value={formData.command}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pullPolicy">Image Pull Policy</Label>
            <Select
              value={formData.pullPolicy}
              onValueChange={(value) => handleSelectChange('pullPolicy', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pull policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Always pull</SelectItem>
                <SelectItem value="ifnotpresent">Pull if not present</SelectItem>
                <SelectItem value="never">Never pull</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Environment Variables</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEnv}>
                <PlusCircle className="h-4 w-4 mr-1" /> Add Variable
              </Button>
            </div>
            <div className="space-y-2">
              {formData.environment.map((env, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="KEY"
                    value={env.key}
                    onChange={(e) => updateEnv(index, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="value"
                    value={env.value}
                    onChange={(e) => updateEnv(index, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEnv(index)}
                    className="shrink-0"
                  >
                    <MinusCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="networking" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="networkMode">Network Mode</Label>
            <Select
              value={formData.networkMode}
              onValueChange={(value) => handleSelectChange('networkMode', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select network mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bridge">Bridge</SelectItem>
                <SelectItem value="host">Host</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Port Mappings</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPort}>
                <PlusCircle className="h-4 w-4 mr-1" /> Add Port
              </Button>
            </div>
            <div className="space-y-2">
              {formData.ports.map((port, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Host Port"
                    value={port.hostPort}
                    onChange={(e) => updatePort(index, 'hostPort', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Container Port"
                    value={port.containerPort}
                    onChange={(e) => updatePort(index, 'containerPort', e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    value={port.protocol}
                    onValueChange={(value) => updatePort(index, 'protocol', value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePort(index)}
                    className="shrink-0"
                  >
                    <MinusCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="restartPolicy">Restart Policy</Label>
            <Select
              value={formData.restartPolicy}
              onValueChange={(value) => handleSelectChange('restartPolicy', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select restart policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="always">Always</SelectItem>
                <SelectItem value="on-failure">On Failure</SelectItem>
                <SelectItem value="unless-stopped">Unless Stopped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="memory">Memory Limit (MB)</Label>
              <Input
                id="memory"
                name="memory"
                placeholder="512"
                value={formData.memory}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpus">CPU Limit</Label>
              <Input
                id="cpus"
                name="cpus"
                placeholder="0.5"
                value={formData.cpus}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Volume Mappings</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVolume}>
                <PlusCircle className="h-4 w-4 mr-1" /> Add Volume
              </Button>
            </div>
            <div className="space-y-2">
              {formData.volumes.map((volume, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Host Path"
                    value={volume.hostPath}
                    onChange={(e) => updateVolume(index, 'hostPath', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Container Path"
                    value={volume.containerPath}
                    onChange={(e) => updateVolume(index, 'containerPath', e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center space-x-1 shrink-0">
                    <Checkbox
                      id={`readonly-${index}`}
                      checked={volume.readOnly}
                      onCheckedChange={(checked) => updateVolume(index, 'readOnly', checked)}
                    />
                    <Label htmlFor={`readonly-${index}`} className="text-xs">Read Only</Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVolume(index)}
                    className="shrink-0"
                  >
                    <MinusCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="privileged"
              checked={formData.privileged}
              onCheckedChange={(checked) => handleCheckboxChange('privileged', !!checked)}
            />
            <Label htmlFor="privileged">Run container in privileged mode</Label>
          </div>
        </TabsContent>
      </Tabs>
      
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Container</Button>
      </DialogFooter>
    </form>
  );
};

export default CreateContainerForm;
