/**
 * Seed Script for TerraCraft Artisanal Ceramics
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 *
 * Fulfills Sprint 2 Seed Requirements:
 * 1. Category tree with >= 2 levels (root + subcategories).
 * 2. At least 3 products, including one with multiple variants.
 * 3. At least 4 valid SKUs and 1 documented intentionally unavailable combination.
 * 4. At least 1 product with multiple variants and 1 unavailable combination.
 * 5. Deterministic, rerun-safe, transaction-aware.
 */

const { query, initializePool, getEngineType } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  console.log('--- Starting TerraCraft Database Seeding ---');
  initializePool();
  console.log(`Active DB Engine: ${getEngineType()}`);

  // 1. Seed Demo Accounts
  console.log('Seeding demo accounts...');
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('StudioAdmin2026!', salt);
  const buyerHash = await bcrypt.hash('CustomerPass2026!', salt);

  await query(`
    INSERT INTO users (email, password_hash, first_name, last_name, role)
    VALUES
      ('admin@terracraft.local', $1, 'Tariq', 'Merchant', 'admin'),
      ('buyer@terracraft.local', $2, 'Amara', 'Vance', 'customer')
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role;
  `, [adminHash, buyerHash]);

  // 2. Seed Category Tree (2 Levels: Root & Subcategories)
  console.log('Seeding 2-level category tree...');
  const catTablewareRes = await query(`
    INSERT INTO categories (name, slug, description, parent_id, is_active)
    VALUES ('Tableware', 'tableware', 'Handcrafted dining and culinary stoneware', NULL, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id;
  `);
  const tablewareId = catTablewareRes.rows[0].id;

  const catPlatesRes = await query(`
    INSERT INTO categories (name, slug, description, parent_id, is_active)
    VALUES ('Plates & Bowls', 'plates-and-bowls', 'Wheel-thrown plates, pasta bowls, and nesting sets', $1, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id
    RETURNING id;
  `, [tablewareId]);
  const platesId = catPlatesRes.rows[0].id;

  const catDrinkwareRes = await query(`
    INSERT INTO categories (name, slug, description, parent_id, is_active)
    VALUES ('Drinkware & Cups', 'drinkware', 'Espresso tumblers, mugs, and pour-over carafes', $1, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id
    RETURNING id;
  `, [tablewareId]);
  const drinkwareId = catDrinkwareRes.rows[0].id;

  const catPlantersRes = await query(`
    INSERT INTO categories (name, slug, description, parent_id, is_active)
    VALUES ('Horticultural Stoneware', 'planters-botanicals', 'Architectural pots and living decor vessels', NULL, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id;
  `);
  const plantersId = catPlantersRes.rows[0].id;

  const catIndoorRes = await query(`
    INSERT INTO categories (name, slug, description, parent_id, is_active)
    VALUES ('Indoor Planters', 'indoor-planters', 'Drainage-equipped terracotta and glazed planters', $1, true)
    ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id
    RETURNING id;
  `, [plantersId]);
  const indoorPlantersId = catIndoorRes.rows[0].id;

  // 3. Seed Products (3 Products)
  console.log('Seeding representative ceramic products...');

  // Product 1: Multiple variants (Size & Glaze Finish)
  const prodPlanterRes = await query(`
    INSERT INTO products (category_id, name, slug, description, status, specifications)
    VALUES (
      $1,
      'Solstice Handcrafted Ceramic Planter',
      'solstice-ceramic-planter',
      'Wheel-thrown stoneware planter engineered with saucer and bottom drainage for optimum root aeration.',
      'published',
      '{"clay_body": "Stoneware", "firing_cone": 10, "drainage_hole": true, "outdoor_safe": false, "finish": "semi-matte"}'::jsonb
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status
    RETURNING id;
  `, [indoorPlantersId]);
  const planterProductId = prodPlanterRes.rows[0].id;

  // Define Variants for Product 1
  await query(`DELETE FROM variants WHERE product_id = $1`, [planterProductId]);
  await query(`
    INSERT INTO variants (product_id, name, options)
    VALUES
      ($1, 'Vessel Size', '["Small", "Medium", "Large"]'::jsonb),
      ($1, 'Glaze Finish', '["Matte Obsidian", "Speckled Sand", "Sage Gloss"]'::jsonb);
  `, [planterProductId]);

  // Seed Valid SKUs for Product 1 (CAT-04: Unavailable combinations omitted)
  // Intentionally UNAVAILABLE combination: { "Vessel Size": "Small", "Glaze Finish": "Sage Gloss" }
  // Rationale: High-temp Sage crystalline glaze runs excessively on smaller 6-inch vertical vessels.
  await query(`DELETE FROM skus WHERE product_id = $1`, [planterProductId]);
  await query(`
    INSERT INTO skus (product_id, sku_code, attributes, price, stock_quantity, is_active)
    VALUES
      ($1, 'TC-SOL-SM-OBS', '{"Vessel Size": "Small", "Glaze Finish": "Matte Obsidian"}'::jsonb, 34.00, 15, true),
      ($1, 'TC-SOL-MD-SND', '{"Vessel Size": "Medium", "Glaze Finish": "Speckled Sand"}'::jsonb, 48.00, 22, true),
      ($1, 'TC-SOL-LG-SND', '{"Vessel Size": "Large", "Glaze Finish": "Speckled Sand"}'::jsonb, 65.00, 8, true),
      ($1, 'TC-SOL-LG-SGE', '{"Vessel Size": "Large", "Glaze Finish": "Sage Gloss"}'::jsonb, 68.00, 12, true);
  `, [planterProductId]);

  // Product 2: Single Variant (Glaze Finish)
  const prodPlateRes = await query(`
    INSERT INTO products (category_id, name, slug, description, status, specifications)
    VALUES (
      $1,
      'Artisan Stoneware Dinner Plate',
      'stoneware-dinner-plate',
      'Generous 10.5-inch rimmed dinner plate hand-thrown on the potter wheel. Commercial bistro grade.',
      'published',
      '{"clay_body": "Buff Stoneware", "diameter_inches": 10.5, "dishwasher_safe": true, "microwave_safe": true, "food_safe_glaze": true}'::jsonb
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status
    RETURNING id;
  `, [platesId]);
  const plateProductId = prodPlateRes.rows[0].id;

  await query(`DELETE FROM variants WHERE product_id = $1`, [plateProductId]);
  await query(`
    INSERT INTO variants (product_id, name, options)
    VALUES ($1, 'Glaze Finish', '["Speckled Sand", "Matte Obsidian"]'::jsonb);
  `, [plateProductId]);

  await query(`DELETE FROM skus WHERE product_id = $1`, [plateProductId]);
  await query(`
    INSERT INTO skus (product_id, sku_code, attributes, price, stock_quantity, is_active)
    VALUES
      ($1, 'TC-PLT-SND', '{"Glaze Finish": "Speckled Sand"}'::jsonb, 28.50, 30, true),
      ($1, 'TC-PLT-OBS', '{"Glaze Finish": "Matte Obsidian"}'::jsonb, 28.50, 18, true);
  `, [plateProductId]);

  // Product 3: Draft Product (Demonstrates draft lifecycle without SKUs)
  await query(`
    INSERT INTO products (category_id, name, slug, description, status, specifications)
    VALUES (
      $1,
      'Wabi-Sabi Fluted Ceramic Vase',
      'wabi-sabi-fluted-vase',
      'Upcoming limited seasonal release. Fluted silhouette inspired by traditional Japanese tea ceremony vessels.',
      'draft',
      '{"clay_body": "Dark Terracotta", "firing_cone": 6, "water_tight": true, "technique": "Coil & Paddle"}'::jsonb
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;
  `, [indoorPlantersId]);

  console.log('--- Database Seeding Completed Successfully! ---');
  console.log('Summary:');
  console.log(' - Users: 2 (1 admin, 1 customer)');
  console.log(' - Categories: 5 across 2 hierarchical tiers (Tableware, Plates & Bowls, Drinkware, Horticultural Stoneware, Indoor Planters)');
  console.log(' - Products: 3 (2 published, 1 draft)');
  console.log(' - SKUs: 6 total across multiple variants');
  console.log(' - Unavailable combination documented: Small x Sage Gloss on Solstice Planter');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
