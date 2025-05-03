
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { HardDrive, Plus } from "lucide-react";

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

// Define the schema for creating a virtual disk
const formSchema = z.object({
  name: z.string().min(1, "Disk name is required"),
  size: z.string().min(1, "Size is required"),
  format: z.string().min(1, "Format is required"),
  path: z.string().optional(),
});

// Mock disk data (would come from an API in a real implementation)
const mockDisks = [
  { id: "disk1", name: "ubuntu-disk", size: "20GB", format: "qcow2", path: "/var/lib/qemu/disks/ubuntu-disk.qcow2", created: "2025-04-30" },
  { id: "disk2", name: "windows-disk", size: "50GB", format: "raw", path: "/var/lib/qemu/disks/windows-disk.raw", created: "2025-05-01" },
];

const VirtualDiskPage = () => {
  const [disks, setDisks] = useState(mockDisks);
  const [isCreating, setIsCreating] = useState(false);
  
  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      size: "20",
      format: "qcow2",
      path: "/var/lib/qemu/disks/",
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsCreating(true);
    
    // In a real implementation, this would be an API call
    setTimeout(() => {
      // Create a new disk object
      const newDisk = {
        id: `disk${Date.now()}`,
        name: values.name,
        size: `${values.size}GB`,
        format: values.format,
        path: `${values.path || "/var/lib/qemu/disks/"}${values.name}.${values.format}`,
        created: new Date().toISOString().split('T')[0],
      };
      
      // Add the new disk to the list
      setDisks([...disks, newDisk]);
      
      // Reset the form
      form.reset({
        name: "",
        size: "20",
        format: "qcow2",
        path: "/var/lib/qemu/disks/",
      });
      
      toast.success(`Virtual disk ${values.name} created successfully`);
      setIsCreating(false);
    }, 1000);
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
                        onValueChange={field.onChange} 
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
                          <SelectItem value="vhd">vhd (Virtual Hard Disk)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The format of the disk image file
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="path"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Path (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="/var/lib/qemu/disks/" {...field} />
                      </FormControl>
                      <FormDescription>
                        Directory where the disk will be stored
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                  <TableHead>Size</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      No virtual disks found
                    </TableCell>
                  </TableRow>
                ) : (
                  disks.map((disk) => (
                    <TableRow key={disk.id}>
                      <TableCell className="font-medium flex items-center">
                        <HardDrive className="h-4 w-4 mr-2 text-muted-foreground" />
                        {disk.name}
                      </TableCell>
                      <TableCell>{disk.size}</TableCell>
                      <TableCell>{disk.format}</TableCell>
                      <TableCell>{disk.created}</TableCell>
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
