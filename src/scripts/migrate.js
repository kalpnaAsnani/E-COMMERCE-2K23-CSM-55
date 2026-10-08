/**
 * Deterministic Migration Runner Script
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const fs = require('fs');
const path = require('path');
const { query, initializePool, getEngineType } = require('../config/database');

async function runMigrations() {
  console.log('--- Starting Database Migrations ---');
  initializePool();
  console.log(`Active DB Engine: ${getEngineType()}`);

  const migrationsDir = path.resolve(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration file(s) in ${migrationsDir}:`);

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    process.stdout.write(`Applying ${file}... `);
    try {
      await query(sql);
      console.log('DONE');
    } catch (err) {
      console.log('FAILED');
      console.error(`Error applying migration ${file}:`, err.message);
      throw err;
    }
  }

  console.log('--- All Migrations Successfully Executed ---');
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration aborted:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
