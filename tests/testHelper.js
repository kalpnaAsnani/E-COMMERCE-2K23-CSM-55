/**
 * Test Helper Utility
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const jwt = require('jsonwebtoken');
const config = require('../src/config/env');
const { initializePool, resetPool } = require('../src/config/database');
const { seedDatabase } = require('../src/scripts/seed');

let tokens = null;

async function setupTestDb() {
  process.env.USE_IN_MEMORY_DB = 'true';
  resetPool();
  initializePool();
  await seedDatabase();

  const adminToken = jwt.sign(
    { id: 1, email: 'admin@terracraft.local', role: 'admin', firstName: 'Tariq', lastName: 'Merchant' },
    config.JWT_SECRET,
    { expiresIn: '2h' }
  );

  const customerToken = jwt.sign(
    { id: 2, email: 'buyer@terracraft.local', role: 'customer', firstName: 'Amara', lastName: 'Vance' },
    config.JWT_SECRET,
    { expiresIn: '2h' }
  );

  const expiredToken = jwt.sign(
    { id: 1, email: 'admin@terracraft.local', role: 'admin' },
    config.JWT_SECRET,
    { expiresIn: '-10s' } // Expired 10 seconds ago
  );

  const invalidSignatureToken = jwt.sign(
    { id: 1, email: 'admin@terracraft.local', role: 'admin' },
    'tampered_and_wrong_secret_key',
    { expiresIn: '2h' }
  );

  tokens = {
    admin: adminToken,
    customer: customerToken,
    expired: expiredToken,
    invalidSignature: invalidSignatureToken
  };

  return tokens;
}

function getTokens() {
  return tokens;
}

module.exports = {
  setupTestDb,
  getTokens
};
