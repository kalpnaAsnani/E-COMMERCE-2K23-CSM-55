/**
 * Express Application Configuration
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security and standard middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets for interactive browser demo
app.use(express.static(path.join(__dirname, '../public')));

// Root route redirect or basic info
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'), (err) => {
    if (err) {
      res.status(200).json({
        project: 'TerraCraft Artisanal Ceramics',
        student: 'Kalpna Asnani',
        rollNo: '2k23/CSM/55',
        department: 'Computer Science / AI, University of Sindh',
        documentation: '/docs',
        apiDocs: '/api/v1/health'
      });
    }
  });
});

// API Routes
app.use('/api/v1', routes);

// 404 Handler for undefined API routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'EndpointNotFound',
    message: `The requested resource '${req.method} ${req.originalUrl}' does not exist on this server.`
  });
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
