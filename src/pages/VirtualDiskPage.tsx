import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { HardDrive, Plus, Trash2, PencilLine, RefreshCcw } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { virtualDiskService, DiskInfo, CreateDiskParams } from "@/services/virtualDiskService";

// Define the schema for creating a virtual disk
const formSchema = z.object({
  name: z.string().min(1, "Disk name is required"),
  size: z.string().min(1, "Size is required"),
  format: z.string().min(1, "Format is required"),
  type: z.enum(["dynamic", "fixed"]).optional(),
});

// Define form values type based on the schema
type FormValues = z.infer<typeof formSchema>;

const VirtualDiskPage = () => {
  const [disks, setDisks] = useState<DiskInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showTypeField, setShowTypeField] = useState(true);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      size: "20",
      format: "qcow2",
      type: "dynamic",
    },
  });

  const fetchDisks = async () => {
    setIsLoading(true);
    try {
      const diskList = await virtualDiskService.listDisks();
      setDisks(diskList);
    } catch (error) {
      console.error("Failed to fetch disks:", error);
      toast.error("Failed to fetch disk list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisks();
  }, []);

  // Handle format change to show/hide type field
  const handleFormatChange = (format: string) => {
    if (format === 'raw') {
      form.setValue('type', 'fixed');
      setShowTypeField(false);
    } else if (format === 'vdi' || format === 'vpc') {
      form.setValue('type', 'dynamic');
      setShowTypeField(false);
    } else {
      setShowTypeField(true);
    }
  };

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsCreating(true);
    try {
      // Ensure values match CreateDiskParams type
      const diskParams: CreateDiskParams = {
        name: values.name,
        size: values.size,
        format: values.format,
        type: values.type as 'dynamic' | 'fixed'
      };
      
      await virtualDiskService.createDisk(diskParams);
      // Reset the form
      form.reset({
        name: "",
        size: "20",
        format: "qcow2",
        type: "dynamic",
      });
      // Refresh disk list
      fetchDisks();
    } catch (error) {
      // Error is handled in the service
      console.error("Error during disk creation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle disk deletion
  const handleDeleteDisk = async (diskName: string, format: string) => {
    try {
      await virtualDiskService.deleteDisk(`${diskName}.${format}`);
      fetchDisks();
    } catch (error) {
      // Error is handled in the service
      console.error("Error deleting disk:", error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">QEMU Virtual Disks</h2>
          <p className="text-muted-foreground">
            Create and manage virtual disk images for your QEMU virtual machines
          </p>
        </div>
        <Button variant="outline" onClick={fetchDisks} disabled={isLoading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Disk Card */}
        <Card>
          <CardHeader>
            <CardTitle>Create Virtual Disk</CardTitle>
            <CardDescription>
              Create a new virtual disk image for use with QEMU virtual machines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disk Name</FormLabel>
                      <FormControl>
                        <Input placeholder="my-disk" {...field} />
                      </FormControl>
                      <FormDescription>
                        A unique name for your virtual disk
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size (GB)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        Size of the disk in gigabytes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disk Format</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleFormatChange(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="qcow2">qcow2 (QEMU Copy-On-Write)</SelectItem>
                          <SelectItem value="raw">raw (Raw Disk Image)</SelectItem>
                          <SelectItem value="vdi">vdi (VirtualBox Disk Image)</SelectItem>
                          <SelectItem value="vmdk">vmdk (VMware Disk)</SelectItem>
                          <SelectItem value="vpc">vpc (Virtual Hard Disk)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The format of the disk image file
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {showTypeField && (
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allocation Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dynamic">Dynamic (thin provisioning)</SelectItem>
                            <SelectItem value="fixed">Fixed (pre-allocated)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Dynamic allocation saves space, fixed allocation improves performance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <CardFooter className="px-0 pt-4">
                  <Button type="submit" className="w-full" disabled={isCreating}>
                    {isCreating ? (
                      <>Creating Disk...</>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Disk
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Disk Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Virtual Disk Management</CardTitle>
            <CardDescription>
              View and manage existing virtual disk images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size (GB)</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Loading disks...
                    </TableCell>
                  </TableRow>
                ) : disks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      No virtual disks found
                    </TableCell>
                  </TableRow>
                ) : (
                  disks.map((disk) => (
                    <TableRow key={`${disk.name}-${disk.format}`}>
                      <TableCell className="font-medium flex items-center">
                        <HardDrive className="h-4 w-4 mr-2 text-muted-foreground" />
                        {disk.name}
                      </TableCell>
                      <TableCell>{disk.size}</TableCell>
                      <TableCell>{disk.format}</TableCell>
                      <TableCell>{disk.type}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete the disk "{disk.name}.{disk.format}"?
                                  This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button 
                                  variant="destructive" 
                                  onClick={() => handleDeleteDisk(disk.name, disk.format)}
                                >
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VirtualDiskPage;
