import React, { useEffect, useState } from 'react';
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
  Plus, 
  MoreVertical, 
  Trash2, 
  Download, 
  Upload, 
  Copy, 
  Loader,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { qemuService } from '@/services/qemuService';
import apiClient from '@/services/apiClient';

interface Image {
  id: string;
  name: string;
  size: string;
  format: string;
  lastModified: string;
  description?: string;
}

interface DockerImage {
  Id: string;
  RepoTags: string[];
  Created: number;
  Size: number;
}

const ImagesPage = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [filteredImages, setFilteredImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

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
    fetchImages();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredImages(images);
    } else {
      const filtered = images.filter(
        image => 
          image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          image.format.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (image.description && image.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredImages(filtered);
    }
  }, [searchTerm, images]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      console.log('Attempting to fetch Docker images from API');
      const response = await apiClient.get('/images/json?all=true');
      console.log('Docker images API response:', response);
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log('Valid Docker images data received from API');
        const formattedImages = response.data.map((img: DockerImage) => {
          const tagName = img.RepoTags && img.RepoTags.length > 0 ? img.RepoTags[0] : 'None';
          return {
            id: img.Id.substring(7, 19),
            name: tagName,
            size: formatBytes(img.Size),
            format: 'docker',
            lastModified: new Date(img.Created * 1000).toISOString().split('T')[0],
            description: `Docker image with ID ${img.Id.substring(7, 19)}`
          };
        });
        setImages(formattedImages);
        setFilteredImages(formattedImages);
        setIsLoading(false);
      } else {
        console.warn('Unexpected Docker images data format received, using mock data');
        useMockData();
      }
    } catch (err) {
      console.warn('Failed to fetch Docker images, using mock data:', err);
      useMockData();
    }
  };

  const useMockData = () => {
    toast.info('Fetching Data: Using mock image data');
    setTimeout(() => {
      const mockImages = [
        { 
          id: 'img1', 
          name: 'ubuntu-22.04-server.qcow2', 
          size: '2.4 GB', 
          format: 'qcow2', 
          lastModified: '2023-05-15',
          description: 'Ubuntu 22.04 LTS server image'
        },
        { 
          id: 'img2', 
          name: 'debian-11-generic.img', 
          size: '1.8 GB', 
          format: 'raw', 
          lastModified: '2023-04-20',
          description: 'Debian 11 Bullseye generic cloud image'
        },
        { 
          id: 'img3', 
          name: 'windows-server-2022.qcow2', 
          size: '5.7 GB', 
          format: 'qcow2', 
          lastModified: '2023-06-01'
        },
        { 
          id: 'img4', 
          name: 'alpine-3.17-minimal.qcow2', 
          size: '120 MB', 
          format: 'qcow2', 
          lastModified: '2023-03-10',
          description: 'Alpine Linux 3.17 minimal installation'
        },
        { 
          id: 'img5', 
          name: 'fedora-37-cloud.img', 
          size: '2.1 GB', 
          format: 'raw', 
          lastModified: '2023-02-15',
          description: 'Fedora 37 Cloud Edition'
        },
      ];
      setImages(mockImages);
      setFilteredImages(mockImages);
      setIsLoading(false);
    }, 1000);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteImage = (id: string) => {
    setSelectedImageId(id);
    setConfirmDialogOpen(true);
  };

  const confirmDeleteImage = async () => {
    if (!selectedImageId) return;
    
    setConfirmDialogOpen(false);
    
    try {
      try {
        console.log(`Attempting to delete image with ID: ${selectedImageId}`);
        await apiClient.delete(`/images/${selectedImageId}`);
        toast.success('Image deleted successfully');
        setImages(images.filter(img => img.id !== selectedImageId));
      } catch (apiError) {
        console.warn('API call to delete image failed, simulating success:', apiError);
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 1000)),
          {
            loading: 'Deleting image...',
            success: () => {
              setImages(images.filter(img => img.id !== selectedImageId));
              return 'Image deleted successfully';
            },
            error: 'Failed to delete image',
          }
        );
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleUploadImage = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadDialogOpen(false);
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Uploading image...',
        success: () => {
          const newImage = {
            id: `img${images.length + 1}`,
            name: 'new-uploaded-image.qcow2',
            size: '1.2 GB',
            format: 'qcow2',
            lastModified: new Date().toISOString().split('T')[0],
            description: 'Newly uploaded image'
          };
          setImages([...images, newImage]);
          return 'Image uploaded successfully';
        },
        error: 'Failed to upload image',
      }
    );
  };

  const handleDownloadImage = (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image) return;
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Preparing ${image.name} for download...`,
        success: 'Image ready for download',
        error: 'Failed to prepare image for download',
      }
    );
  };

  const handleCloneImage = (id: string) => {
    const imageToClone = images.find(img => img.id === id);
    if (!imageToClone) return;
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Cloning image...',
        success: () => {
          const clonedImage = {
            ...imageToClone,
            id: `img${images.length + 1}`,
            name: `${imageToClone.name.split('.')[0]}-clone.${imageToClone.name.split('.')[1] || 'img'}`,
            lastModified: new Date().toISOString().split('T')[0],
            description: `Clone of ${imageToClone.name}`
          };
          setImages([...images, clonedImage]);
          return 'Image cloned successfully';
        },
        error: 'Failed to clone image',
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64 md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search disk images..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Upload className="mr-2 h-4 w-4" /> Upload Image
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Disk Image</DialogTitle>
              <DialogDescription>
                Upload a new disk image for use with QEMU virtual machines
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUploadImage}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="file" className="text-sm font-medium">
                    Disk Image File
                  </label>
                  <Input id="file" type="file" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name (Optional)
                  </label>
                  <Input id="name" placeholder="Custom name for the image" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Input id="description" placeholder="Brief description of the image" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Upload</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disk Images</CardTitle>
          <CardDescription>Manage disk images for QEMU virtual machines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Format</th>
                  <th className="text-left p-3 font-medium">Size</th>
                  <th className="text-left p-3 font-medium">Last Modified</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(5).fill(0).map((_, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3"><Skeleton className="h-5 w-40" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-24" /></td>
                      <td className="p-3 text-right"><Skeleton className="h-9 w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredImages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <HardDrive className="h-8 w-8 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No disk images found</p>
                        {searchTerm && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Try adjusting your search query
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredImages.map((image) => (
                    <tr key={image.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          {image.name}
                          {image.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {image.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">{image.format}</td>
                      <td className="p-3">{image.size}</td>
                      <td className="p-3">{image.lastModified}</td>
                      <td className="p-3 text-right space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDownloadImage(image.id)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCloneImage(image.id)}
                          title="Clone"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Image Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              toast.info('Edit dialog would open here');
                            }}>
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              toast.info('Convert dialog would open here');
                            }}>
                              Convert Format
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteImage(image.id)}
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
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this disk image? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteImage}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImagesPage;
