
import apiClient from './apiClient';
import { toast } from "sonner";

// Types
export interface DiskInfo {
  name: string;
  size: string;
  format: string;
  type: 'dynamic' | 'fixed';
}

export interface CreateDiskParams {
  name: string;
  size: string;
  format: string;
  type?: 'dynamic' | 'fixed';
}

// Mock data for fallback
const mockDisks: DiskInfo[] = [
  { name: 'ubuntu-disk', size: '20', format: 'qcow2', type: 'dynamic' },
  { name: 'windows-disk', size: '50', format: 'raw', type: 'fixed' },
];

export const virtualDiskService = {
  // List all disks
  listDisks: async (): Promise<DiskInfo[]> => {
    try {
      console.log('Fetching disk list from API');
      const response = await apiClient.get('/qemu/list-disks');
      console.log('Disk list response:', response.data);
      return response.data;
    } catch (err) {
      console.warn('Failed to fetch disks, using mock data.', err);
      toast.info('Fetching Data: Using mock disk data');
      return mockDisks;
    }
  },

  // Create a new disk
  createDisk: async (params: CreateDiskParams): Promise<{ message: string }> => {
    try {
      console.log('Creating disk with params:', params);
      const response = await apiClient.post('/qemu/create-disk', params);
      toast.success('Virtual disk created successfully');
      return response.data;
    } catch (err: any) {
      console.error('Error creating disk:', err);
      const errorMessage = err.response?.data?.error || 'Failed to create virtual disk';
      toast.error(errorMessage);
      throw err;
    }
  },

  // Delete a disk
  deleteDisk: async (filename: string): Promise<{ message: string }> => {
    try {
      console.log(`Deleting disk: ${filename}`);
      const response = await apiClient.delete(`/qemu/delete-disk/${filename}`);
      toast.success(`Disk "${filename}" deleted successfully`);
      return response.data;
    } catch (err: any) {
      console.error(`Error deleting disk ${filename}:`, err);
      const errorMessage = err.response?.data?.error || 'Failed to delete virtual disk';
      toast.error(errorMessage);
      throw err;
    }
  },

  // Update a disk (rename or resize)
  updateDisk: async (filename: string, updates: { name?: string, size?: string }): Promise<{ message: string }> => {
    try {
      console.log(`Updating disk ${filename} with:`, updates);
      const response = await apiClient.put(`/qemu/update-disk/${filename}`, updates);
      toast.success('Virtual disk updated successfully');
      return response.data;
    } catch (err: any) {
      console.error(`Error updating disk ${filename}:`, err);
      const errorMessage = err.response?.data?.error || 'Failed to update virtual disk';
      toast.error(errorMessage);
      throw err;
    }
  }
};
