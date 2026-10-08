/**
 * Database-Level Integrity & Constraint Test Suite (CAT-05)
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 * Engine: In-Memory PostgreSQL Engine (pg-mem)
 */

const { query } = require('../src/config/database');
const { setupTestDb } = require('./testHelper');

describe('Database Engine Schema & Constraint Integrity (CAT-05)', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  describe('Mathematical CHECK Constraints', () => {
    it('enforces CHECK (stock_quantity >= 0) at the raw SQL engine level', async () => {
      let rejected = false;
      try {
        await query(
          'INSERT INTO skus (product_id, sku_code, price, stock_quantity) VALUES ($1, $2, $3, $4)',
          [1, 'SQL-NEG-STOCK', 15.00, -99]
        );
      } catch (err) {
        rejected = true;
        expect(err.message).toMatch(/check constraint/i);
      }
      expect(rejected).toBe(true);
    });

    it('enforces CHECK (price >= 0) at the raw SQL engine level', async () => {
      let rejected = false;
      try {
        await query(
          'INSERT INTO skus (product_id, sku_code, price, stock_quantity) VALUES ($1, $2, $3, $4)',
          [1, 'SQL-NEG-PRICE', -49.99, 10]
        );
      } catch (err) {
        rejected = true;
        expect(err.message).toMatch(/check constraint/i);
      }
      expect(rejected).toBe(true);
    });
  });

  describe('Uniqueness Constraints', () => {
    it('enforces UNIQUE (slug) on categories', async () => {
      let rejected = false;
      try {
        await query(
          'INSERT INTO categories (name, slug) VALUES ($1, $2)',
          ['Duplicate Tableware', 'tableware']
        );
      } catch (err) {
        rejected = true;
        expect(err.message).toMatch(/unique/i);
      }
      expect(rejected).toBe(true);
    });

    it('enforces UNIQUE (slug) on products', async () => {
      let rejected = false;
      try {
        await query(
          'INSERT INTO products (category_id, name, slug) VALUES ($1, $2, $3)',
          [1, 'Duplicate Planter', 'solstice-ceramic-planter']
        );
      } catch (err) {
        rejected = true;
        expect(err.message).toMatch(/unique/i);
      }
      expect(rejected).toBe(true);
    });

    it('enforces UNIQUE (sku_code) on skus', async () => {
      let rejected = false;
      try {
        await query(
          'INSERT INTO skus (product_id, sku_code, price, stock_quantity) VALUES ($1, $2, $3, $4)',
          [1, 'TC-SOL-SM-OBS', 34.00, 5]
        );
      } catch (err) {
        rejected = true;
        expect(err.message).toMatch(/unique/i);
      }
      expect(rejected).toBe(true);
    });
  });

  describe('Foreign Key Behavior & Referential Policies', () => {
    it('enforces ON DELETE RESTRICT on categories when active products exist', async () => {
      // Category 5 (Indoor Planters) has products linked to it
      let rejected = false;
      try {
        await query('DELETE FROM categories WHERE id = $1', [5]);
      } catch (err) {
        rejected = true;
        expect(err.message).toMatch(/foreign key/i);
      }
      expect(rejected).toBe(true);
    });

    it('enforces ON DELETE CASCADE on products to delete variants and SKUs cleanly', async () => {
      // Create a temporary product with a variant and a SKU
      const pRes = await query(
        'INSERT INTO products (category_id, name, slug) VALUES ($1, $2, $3) RETURNING id',
        [1, 'Temp Cascade Product', 'temp-cascade-product']
      );
      const tempProdId = pRes.rows[0].id;

      await query(
        'INSERT INTO variants (product_id, name, options) VALUES ($1, $2, $3)',
        [tempProdId, 'Color', JSON.stringify(['White'])]
      );

      await query(
        'INSERT INTO skus (product_id, sku_code, price, stock_quantity) VALUES ($1, $2, $3, $4)',
        [tempProdId, 'TEMP-CAS-SKU', 19.99, 5]
      );

      // Verify records exist
      const vBefore = await query('SELECT COUNT(*) FROM variants WHERE product_id = $1', [tempProdId]);
      const sBefore = await query('SELECT COUNT(*) FROM skus WHERE product_id = $1', [tempProdId]);
      expect(parseInt(vBefore.rows[0].count, 10)).toBe(1);
      expect(parseInt(sBefore.rows[0].count, 10)).toBe(1);

      // Delete product
      await query('DELETE FROM products WHERE id = $1', [tempProdId]);

      // Verify cascading deletion of variants and skus
      const vAfter = await query('SELECT COUNT(*) FROM variants WHERE product_id = $1', [tempProdId]);
      const sAfter = await query('SELECT COUNT(*) FROM skus WHERE product_id = $1', [tempProdId]);
      expect(parseInt(vAfter.rows[0].count, 10)).toBe(0);
      expect(parseInt(sAfter.rows[0].count, 10)).toBe(0);
    });
  });
});
