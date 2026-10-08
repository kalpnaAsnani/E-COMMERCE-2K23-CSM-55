/**
 * Central API Router
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const publicRoutes = require('./publicRoutes');
const { getEngineType } = require('../config/database');

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    project: 'TerraCraft Artisanal Ceramics',
    student: 'Kalpna Asnani (2k23/CSM/55)',
    dbEngine: getEngineType(),
    timestamp: new Date().toISOString()
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/', publicRoutes);

module.exports = router;
