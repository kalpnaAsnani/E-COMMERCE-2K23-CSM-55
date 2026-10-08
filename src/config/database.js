/**
 * Unified Database Configuration & Pool Manager
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const { Pool } = require('pg');
const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');
const config = require('./env');

let activePool = null;
let activeMemDb = null;
let activeEngine = 'uninitialized';

function createInMemoryInstance() {
  const memDb = newDb();

  // Mock PostgreSQL built-ins
  memDb.public.registerFunction({
    name: 'current_database',
    implementation: () => config.PGDATABASE || 'terracraft_db'
  });

  const migrationsDir = path.resolve(__dirname, '../../migrations');
  const migrationFiles = [
    '001_create_users.sql',
    '002_create_categories.sql',
    '003_create_products_and_variants.sql',
    '004_create_skus_and_assets.sql',
    '005_create_orders_and_carts.sql'
  ];

  for (const file of migrationFiles) {
    const fullPath = path.join(migrationsDir, file);
    if (fs.existsSync(fullPath)) {
      const sql = fs.readFileSync(fullPath, 'utf8');
      memDb.public.none(sql);
    }
  }

  const pgAdapter = memDb.adapters.createPg();
  const pool = new pgAdapter.Pool();

  return { memDb, pool };
}

function initializePool() {
  if (activePool) return activePool;

  if (config.USE_IN_MEMORY_DB) {
    const { memDb, pool } = createInMemoryInstance();
    activeMemDb = memDb;
    activePool = pool;
    activeEngine = 'In-Memory PostgreSQL Engine (pg-mem)';
    return activePool;
  }

  const poolConfig = config.DATABASE_URL
    ? { connectionString: config.DATABASE_URL }
    : {
        host: config.PGHOST,
        port: config.PGPORT,
        user: config.PGUSER,
        password: config.PGPASSWORD,
        database: config.PGDATABASE
      };

  activePool = new Pool(poolConfig);
  activeEngine = 'Real PostgreSQL Server';
  return activePool;
}

async function query(text, params) {
  const p = initializePool();
  return p.query(text, params);
}

async function getClient() {
  const p = initializePool();
  return p.connect();
}

function getEngineType() {
  if (!activePool) initializePool();
  return activeEngine;
}

function resetPool() {
  if (activePool) {
    try {
      activePool.end();
    } catch (e) {
      // ignore
    }
    activePool = null;
    activeMemDb = null;
    activeEngine = 'uninitialized';
  }
}

module.exports = {
  initializePool,
  query,
  getClient,
  getEngineType,
  resetPool,
  createInMemoryInstance
};
