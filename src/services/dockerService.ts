
import apiClient from './apiClient';
import { toast } from "sonner";

const mockContainers = [
  { id: 'c1', name: 'nginx-proxy', image: 'nginx:latest', status: 'running', created: '2 days ago', cpu: '0.5%', memory: '128MB' },
  { id: 'c2', name: 'postgres-db', image: 'postgres:13', status: 'running', created: '5 days ago', cpu: '1.2%', memory: '256MB' },
  { id: 'c3', name: 'redis-cache', image: 'redis:alpine', status: 'paused', created: '1 day ago', cpu: '0%', memory: '64MB' },
];

const mockImages = [
  {
    id: 'sha256:123456789abcdef',
    repository: 'nginx',
    tag: 'latest',
    size: '133MB',
    created: '2 weeks ago'
  },
  {
    id: 'sha256:987654321fedcba',
    repository: 'postgres',
    tag: '13',
    size: '314MB',
    created: '1 month ago'
  },
  {
    id: 'sha256:abcdef123456789',
    repository: 'redis',
    tag: 'alpine',
    size: '32MB',
    created: '3 weeks ago'
  },
  {
    id: 'sha256:fedcba987654321',
    repository: 'ubuntu',
    tag: '20.04',
    size: '72MB',
    created: '2 months ago'
  },
  {
    id: 'sha256:13579abcdef2468',
    repository: 'node',
    tag: '16-alpine',
    size: '117MB',
    created: '2 weeks ago'
  },
];

/** Ping the Docker daemon */
export function ping() {
  return apiClient.get('/_ping');
}

// Docker Containers API
export const containerService = {
  // Get all containers
  getContainers: async (all: boolean = true) => {
    try {
      const res = await apiClient.get(`/containers`, { params: { all } });
      return res;
    } catch (err) {
      console.warn('Failed to fetch containers, using mock data.');
      toast.info('Fetching Data Error: Using mock container data');
      return { data: mockContainers };
    }
  },

  // Get container details
  getContainer: async (id: string) => {
    try {
      const res = await apiClient.get(`/containers/${id}/json`);
      return res;
    } catch (err) {
      toast.info('Fetching Data Error: Using mock container data');
      return { data: mockContainers.find(c => c.id === id) || mockContainers[0] };
    }
  },

  // Create container
  createContainer: async (data: any) => {
    return apiClient.post('/containers/create', data);
  },

  // Start container
  startContainer: async (id: string) => {
    return apiClient.post(`/containers/${id}/start`);
  },

  // Stop container
  stopContainer: async (id: string) => {
    return apiClient.post(`/containers/${id}/stop`);
  },

  // Restart container
  restartContainer: async (id: string) => {
    return apiClient.post(`/containers/${id}/restart`);
  },

  // Kill container
  killContainer: async (id: string) => {
    return apiClient.post(`/containers/${id}/kill`);
  },

  // Pause container
  pauseContainer: async (id: string) => {
    return apiClient.post(`/containers/${id}/pause`);
  },

  // Unpause container
  unpauseContainer: async (id: string) => {
    return apiClient.post(`/containers/${id}/unpause`);
  },

  // Rename container
  renameContainer: async (id: string, name: string) => {
    return apiClient.post(`/containers/${id}/rename`, null, { params: { name } });
  },

  // Delete container
  deleteContainer: async (id: string, force: boolean = false, volumes: boolean = false) => {
    return apiClient.delete(`/containers/${id}`, { params: { force, v: volumes } });
  },

  // Get container logs
  getContainerLogs: async (id: string, follow: boolean = false, tail: string = 'all') => {
    return apiClient.get(`/containers/${id}/logs`, {
      params: { follow, tail, stdout: true, stderr: true },
      responseType: 'text'
    });
  },

  // Get container stats
  getContainerStats: async (id: string, stream: boolean = false) => {
    return apiClient.get(`/containers/${id}/stats`, { params: { stream } });
  }
};

// Docker Images API
export const imageService = {
  // Get all images
  getImages: async (all: boolean = true) => {
    try {
      const res = await apiClient.get(`/images/json`, { params: { all } });
      
      if (res && res.data && Array.isArray(res.data)) {
        // API call successful, transform the data to match our expected format
        const formattedImages = res.data.map(img => ({
          id: img.Id,
          repository: (img.RepoTags && img.RepoTags.length > 0) ? img.RepoTags[0].split(':')[0] : 'none',
          tag: (img.RepoTags && img.RepoTags.length > 0) ? img.RepoTags[0].split(':')[1] : 'none',
          size: `${Math.round(img.Size / (1024 * 1024))}MB`,
          created: new Date(img.Created * 1000).toLocaleDateString()
        }));
        
        return { data: formattedImages };
      } else {
        // Response exists but data format is unexpected
        console.warn('Unexpected image data format received, using mock data.');
        toast.info('Fetching Data Error: Using mock image data');
        return { data: mockImages };
      }
    } catch (err) {
      console.warn('Failed to fetch images, using mock data.', err);
      toast.info('Fetching Data Error: Using mock image data');
      return { data: mockImages };
    }
  },

  // Pull image
  pullImage: async (fromImage: string, tag: string = 'latest') => {
    return apiClient.post(`/images/create`, null, {
      params: { fromImage, tag },
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Tag image
  tagImage: async (id: string, repo: string, tag: string) => {
    return apiClient.post(`/images/${id}/tag`, null, { params: { repo, tag } });
  },

  // Push image
  pushImage: async (name: string, tag: string = 'latest') => {
    return apiClient.post(`/images/${name}/push`, null, {
      params: { tag },
      headers: { 'X-Registry-Auth': 'placeholder' } // This should be a proper auth token in production
    });
  },

  // Delete image
  deleteImage: async (id: string, force: boolean = false) => {
    return apiClient.delete(`/images/${id}`, { params: { force } });
  },

  // Search Docker Hub
  searchImages: async (term: string) => {
    return apiClient.get(`/images/search`, { params: { term } });
  },

  // Prune unused images
  pruneImages: async () => {
    return apiClient.post(`/images/prune`);
  }
};
