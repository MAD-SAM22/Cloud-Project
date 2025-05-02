
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
import { PlusCircle, MinusCircle, Upload } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface CreateVMFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const CreateVMForm = ({ onSubmit, onCancel }: CreateVMFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    cpus: 1,
    memory: 1,
    diskSize: 10,
    os: '',
    iso: '',
    networkType: 'bridge',
    networkBridge: 'br0',
    bootOrder: ['cdrom', 'disk', 'network'],
    enableKVM: true,
    enableNestedVirt: false,
    enableEFI: false,
    diskFormat: 'qcow2',
    diskBus: 'virtio',
    networkModel: 'virtio-net',
    displayType: 'vnc',
    vncPort: '',
    keyboardLayout: 'en-us',
    customArgs: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  const handleSliderChange = (field: string, value: number[]) => {
    setFormData({
      ...formData,
      [field]: value[0],
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

  // Boot order management
  const moveBootOption = (index: number, direction: 'up' | 'down') => {
    const newBootOrder = [...formData.bootOrder];
    if (direction === 'up' && index > 0) {
      [newBootOrder[index], newBootOrder[index - 1]] = [newBootOrder[index - 1], newBootOrder[index]];
    } else if (direction === 'down' && index < newBootOrder.length - 1) {
      [newBootOrder[index], newBootOrder[index + 1]] = [newBootOrder[index + 1], newBootOrder[index]];
    }
    
    setFormData({
      ...formData,
      bootOrder: newBootOrder,
    });
  };

  const renderBootDeviceName = (device: string) => {
    switch (device) {
      case 'cdrom': return 'CD/DVD';
      case 'disk': return 'Hard Disk';
      case 'network': return 'Network';
      default: return device;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="basic">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="storage">Storage & Network</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">VM Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="my-virtual-machine"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="os">Operating System</Label>
            <Select
              value={formData.os}
              onValueChange={(value) => handleSelectChange('os', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select OS type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="windows">Windows</SelectItem>
                <SelectItem value="ubuntu">Ubuntu</SelectItem>
                <SelectItem value="debian">Debian</SelectItem>
                <SelectItem value="centos">CentOS</SelectItem>
                <SelectItem value="fedora">Fedora</SelectItem>
                <SelectItem value="arch">Arch Linux</SelectItem>
                <SelectItem value="freebsd">FreeBSD</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="iso">ISO Image</Label>
            <div className="flex gap-2">
              <Input
                id="iso"
                name="iso"
                placeholder="/path/to/image.iso or http://..."
                value={formData.iso}
                onChange={handleChange}
                className="flex-1"
              />
              <Button type="button" variant="outline" className="shrink-0">
                <Upload className="h-4 w-4 mr-1" /> Browse
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Path to ISO image or URL for remote install
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cpus">CPU Cores: {formData.cpus}</Label>
            <Slider
              value={[formData.cpus]}
              min={1}
              max={16}
              step={1}
              onValueChange={(value) => handleSliderChange('cpus', value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="memory">Memory (GB): {formData.memory}</Label>
            <Slider
              value={[formData.memory]}
              min={0.5}
              max={64}
              step={0.5}
              onValueChange={(value) => handleSliderChange('memory', value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="diskSize">Disk Size (GB): {formData.diskSize}</Label>
            <Slider
              value={[formData.diskSize]}
              min={5}
              max={500}
              step={5}
              onValueChange={(value) => handleSliderChange('diskSize', value)}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="storage" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="diskFormat">Disk Format</Label>
            <Select
              value={formData.diskFormat}
              onValueChange={(value) => handleSelectChange('diskFormat', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select disk format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qcow2">QCOW2 (Recommended)</SelectItem>
                <SelectItem value="raw">Raw</SelectItem>
                <SelectItem value="vdi">VDI</SelectItem>
                <SelectItem value="vmdk">VMDK</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="diskBus">Disk Interface</Label>
            <Select
              value={formData.diskBus}
              onValueChange={(value) => handleSelectChange('diskBus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select disk interface" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virtio">VirtIO (Recommended)</SelectItem>
                <SelectItem value="sata">SATA</SelectItem>
                <SelectItem value="scsi">SCSI</SelectItem>
                <SelectItem value="ide">IDE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="networkType">Network Type</Label>
            <Select
              value={formData.networkType}
              onValueChange={(value) => handleSelectChange('networkType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select network type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bridge">Bridged</SelectItem>
                <SelectItem value="user">User (NAT)</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.networkType === 'bridge' && (
            <div className="space-y-2">
              <Label htmlFor="networkBridge">Network Bridge</Label>
              <Input
                id="networkBridge"
                name="networkBridge"
                placeholder="br0"
                value={formData.networkBridge}
                onChange={handleChange}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="networkModel">Network Adapter Model</Label>
            <Select
              value={formData.networkModel}
              onValueChange={(value) => handleSelectChange('networkModel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select network adapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virtio-net">VirtIO (Recommended)</SelectItem>
                <SelectItem value="e1000">Intel E1000</SelectItem>
                <SelectItem value="rtl8139">Realtek RTL8139</SelectItem>
                <SelectItem value="vmxnet3">VMware vmxnet3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Boot Order</Label>
            <div className="space-y-2 border rounded-md p-2">
              {formData.bootOrder.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">
                    {index + 1}. {renderBootDeviceName(device)}
                  </span>
                  <div className="space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBootOption(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBootOption(index, 'down')}
                      disabled={index === formData.bootOrder.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="displayType">Display Type</Label>
            <Select
              value={formData.displayType}
              onValueChange={(value) => handleSelectChange('displayType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select display type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vnc">VNC</SelectItem>
                <SelectItem value="spice">SPICE</SelectItem>
                <SelectItem value="none">None (Headless)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.displayType === 'vnc' && (
            <div className="space-y-2">
              <Label htmlFor="vncPort">VNC Port (optional)</Label>
              <Input
                id="vncPort"
                name="vncPort"
                placeholder="5900"
                value={formData.vncPort}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for automatic port assignment
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="keyboardLayout">Keyboard Layout</Label>
            <Select
              value={formData.keyboardLayout}
              onValueChange={(value) => handleSelectChange('keyboardLayout', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select keyboard layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-us">English (US)</SelectItem>
                <SelectItem value="en-gb">English (UK)</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableKVM"
                checked={formData.enableKVM}
                onCheckedChange={(checked) => handleCheckboxChange('enableKVM', !!checked)}
              />
              <Label htmlFor="enableKVM">Enable KVM hardware acceleration</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Improves performance, recommended for most use cases
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableNestedVirt"
                checked={formData.enableNestedVirt}
                onCheckedChange={(checked) => handleCheckboxChange('enableNestedVirt', !!checked)}
              />
              <Label htmlFor="enableNestedVirt">Enable nested virtualization</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Allows running VMs inside this VM
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableEFI"
                checked={formData.enableEFI}
                onCheckedChange={(checked) => handleCheckboxChange('enableEFI', !!checked)}
              />
              <Label htmlFor="enableEFI">Use UEFI firmware</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Required for some modern operating systems
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customArgs">Custom QEMU Arguments (advanced)</Label>
            <Textarea
              id="customArgs"
              name="customArgs"
              placeholder="-cpu host,+vmx -usb -device usb-tablet"
              value={formData.customArgs}
              onChange={handleChange}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Additional arguments to pass to QEMU. Only use if you know what you're doing.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create VM</Button>
      </DialogFooter>
    </form>
  );
};

export default CreateVMForm;
