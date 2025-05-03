
# Virtual Dock Control Hub

A modern, responsive web application for managing Docker containers and QEMU virtual machines through a unified interface.

## Features

- **Docker Container Management**
  - View, create, start, stop, and manage Docker containers
  - Pull, push, tag, and delete Docker images
  - Search Docker Hub for images
  - Stream container logs in real-time

- **QEMU Virtual Machine Management**
  - Create, start, stop, and manage QEMU virtual machines
  - Take and restore VM snapshots
  - View VM console output
  - Configure VM resources (CPU, memory, storage)

- **Unified Dashboard**
  - Real-time resource usage monitoring
  - System metrics visualization
  - Quick access to all managed resources

- **Modern UI**
  - Clean, responsive design
  - Light and dark mode support
  - Intuitive navigation

## Prerequisites

- Node.js 18 or higher
- Docker Engine API accessible via REST
- QEMU installed and accessible via REST API

## Configuration

To configure the API base URL, add the following environment variable:

```bash
VITE_API_URL=http://localhost:3000
```

You can use a `.env` file in the project root or set the environment variable directly.

## Getting Started

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/MAD-SAM22/virtual-dock-control-hub.git
   cd virtual-dock-control-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to http://localhost:8080

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t virtual-dock-control-hub .
   ```

2. Run the container:
   ```bash
   docker run -p 8080:80 -e VITE_API_URL=http://api-host:3000 virtual-dock-control-hub
   ```

### docker-compose Setup

Create a `docker-compose.yml` file:

```yaml
version: '3'
services:
  # Frontend UI
  frontend:
    build: .
    ports:
      - "8080:80"
    environment:
      - VITE_API_URL=http://api:3000
    depends_on:
      - api
  
  # Docker API Gateway
  api:
    image: your-docker-api-gateway-image
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "3000:3000"
  
  # Mock QEMU API (for development/testing)
  qemu-api:
    image: your-qemu-api-image
    ports:
      - "3001:3001"
```

Start the services:
```bash
docker-compose up -d
```

## API Requirements

This frontend expects the following API endpoints to be available:

- Docker API: `/containers`, `/images`, etc. (following the Docker Engine API spec)
- QEMU API: `/qemu/vms`, `/qemu/vms/:id/start`, etc.

See the API services files in `src/services/` for details on the expected endpoints.

## Authentication

The application includes a simple authentication system with protected routes. 
For production, you should implement proper authentication in your API server
and update the `AuthContext.tsx` file accordingly.

## License

MIT
