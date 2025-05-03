import express from 'express';
import cors from 'cors';
import qemuRouter from './qemuServer.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/qemu', qemuRouter);

// Health check endpoint
app.get('/_ping', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Mock endpoints for Docker (can be replaced with real implementation later)
app.get('/containers', (req, res) => {
    res.json([
        { id: '123', name: 'container1', status: 'running' },
        { id: '456', name: 'container2', status: 'stopped' }
    ]);
});

app.get('/images', (req, res) => {
    res.json([
        { id: '789', name: 'ubuntu:latest', size: '120MB' },
        { id: '012', name: 'nginx:latest', size: '80MB' }
    ]);
});

// Start the server if this file is run directly
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});


export default app;