/**
 * Database Schema and Integrity Validation Script
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const { query, initializePool, getEngineType } = require('../config/database');
const { seedDatabase } = require('./seed');

async function validateDatabase() {
  console.log('========================================================');
  console.log(' TerraCraft Database Schema & Constraint Audit');
  console.log(' Student: Kalpna Asnani (Roll No: 2k23/CSM/55)');
  console.log('========================================================');

  initializePool();
  const engine = getEngineType();
  console.log(`Active Database Engine: ${engine}`);

  if (engine.includes('In-Memory')) {
    console.log('Note: Running in zero-dependency in-memory mode. Populating initial seed fixtures...');
    await seedDatabase();
  }

  const requiredTables = [
    'users',
    'categories',
    'products',
    'variants',
    'skus',
    'assets',
    'carts',
    'cart_items',
    'orders',
    'order_items'
  ];

  console.log('\n1. Verifying Table Existence & Row Counts:');
  for (const table of requiredTables) {
    try {
      const res = await query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   [PASS] Table '${table}' exists (row count: ${res.rows[0].count})`);
    } catch (err) {
      console.error(`   [FAIL] Table '${table}' missing or inaccessible:`, err.message);
      throw err;
    }
  }

  console.log('\n2. Testing Relational & Mathematical Constraints:');

  // Test CHECK (stock_quantity >= 0)
  try {
    await query(`INSERT INTO skus (product_id, sku_code, price, stock_quantity) VALUES (1, 'FAIL-NEG-STOCK', 25.00, -5)`);
    console.error('   [FAIL] CHECK constraint failed to block negative stock.');
    process.exit(1);
  } catch (err) {
    console.log('   [PASS] CHECK constraint successfully blocked negative stock (stock_quantity >= 0).');
  }

  // Test CHECK (price >= 0)
  try {
    await query(`INSERT INTO skus (product_id, sku_code, price, stock_quantity) VALUES (1, 'FAIL-NEG-PRICE', -15.00, 10)`);
    console.error('   [FAIL] CHECK constraint failed to block negative price.');
    process.exit(1);
  } catch (err) {
    console.log('   [PASS] CHECK constraint successfully blocked negative monetary price (price >= 0).');
  }

  // Test UNIQUE slug constraint
  try {
    await query(`INSERT INTO categories (name, slug) VALUES ('Duplicate Tableware', 'tableware')`);
    console.error('   [FAIL] UNIQUE constraint failed to block duplicate category slug.');
    process.exit(1);
  } catch (err) {
    console.log('   [PASS] UNIQUE constraint successfully blocked duplicate category slug.');
  }

  // Test UNIQUE SKU code constraint
  try {
    await query(`INSERT INTO skus (product_id, sku_code, price, stock_quantity) VALUES (1, 'TC-SOL-SM-OBS', 34.00, 5)`);
    console.error('   [FAIL] UNIQUE constraint failed to block duplicate SKU code.');
    process.exit(1);
  } catch (err) {
    console.log('   [PASS] UNIQUE constraint successfully blocked duplicate SKU code.');
  }

  console.log('\n========================================================');
  console.log(' Database Audit Result: ALL CONSTRAINTS AND SCHEMAS VALID');
  console.log('========================================================\n');
}

if (require.main === module) {
  validateDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Validation failed:', err);
      process.exit(1);
    });
}

module.exports = { validateDatabase };
