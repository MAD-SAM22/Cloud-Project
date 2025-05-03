
# QEMU Backend Server

This directory contains a Node.js Express server that provides API endpoints for managing QEMU virtual disks and virtual machines.

## Running the Backend

To run the backend server:

1. Navigate to the project root directory
2. Run the following command:

```bash
node src/server/index.js
```

The server will start on port 3000 by default.

## Available Endpoints

### Virtual Disks

- `GET /qemu/list-disks` - List all virtual disks
- `POST /qemu/create-disk` - Create a new virtual disk
- `DELETE /qemu/delete-disk/:filename` - Delete a virtual disk
- `PUT /qemu/update-disk/:filename` - Update a disk (rename or resize)

### Virtual Machines

- `GET /qemu/list-vms` - List all VMs
- `POST /qemu/create-vm` - Create and start a new VM
- `DELETE /qemu/delete-vm/:name` - Delete a VM

## Note

This server requires QEMU to be installed on your system with `qemu-img` and `qemu-system-x86_64` available in your PATH.

If you encounter permission errors when creating or modifying disk files, make sure the directories specified in the server code have the appropriate write permissions.
