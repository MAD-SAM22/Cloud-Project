
// This is an example configuration for your Express backend
// THIS FILE IS FOR REFERENCE ONLY - it should be implemented in your separate backend project

const express = require('express');
const cors = require('cors');
const app = express();

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export app for testing
module.exports = app;
