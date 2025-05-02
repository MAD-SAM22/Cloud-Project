
import apiClient from '../services/apiClient';
import { ping } from '../services/dockerService';
import { toast } from 'sonner';

export const testApiConnection = async () => {
  try {
    console.log('Testing API connection to:', import.meta.env.VITE_API_URL);
    console.log('Making request to: /_ping');
    
    // Try the request with different configurations if needed
    console.log('Attempting direct request with apiClient...');
    const directResponse = await apiClient.get('/_ping', {
      // Try with different timeout
      timeout: 10000,
      // Log the raw response
      transformResponse: [(data) => data],
    });
    console.log('Direct API response:', directResponse);
    
    console.log('Attempting request through dockerService.ping()...');
    const response = await ping();
    console.log('API response through service:', response);
    
    toast.success('API connection successful!');
    return response.data;
  } catch (error) {
    console.error('API connection failed:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    if (error.response) {
      console.log('Server responded with status:', error.response.status);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      console.log('No response received. Request details:', error.request);
    }
    
    toast.error('API connection failed. Check console for details.');
    throw error;
  }
};
