/**
 * Variants & SKU Combination Test Suite (CAT-03 & CAT-04)
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 * Engine: In-Memory PostgreSQL Engine (pg-mem)
 */

const request = require('supertest');
const app = require('../src/app');
const { setupTestDb, getTokens } = require('./testHelper');

describe('Variants & SKU Combination Tests (CAT-03 & CAT-04)', () => {
  let tokens;

  beforeAll(async () => {
    tokens = await setupTestDb();
  });

  describe('Adding Valid SKUs (POST /api/v1/admin/products/:id/skus)', () => {
    it('adds a valid SKU matching defined product variants (201)', async () => {
      // Solstice Planter (id: 1) has variants:
      // Vessel Size: [Small, Medium, Large]
      // Glaze Finish: [Matte Obsidian, Speckled Sand, Sage Gloss]
      // Add: Medium x Matte Obsidian
      const res = await request(app)
        .post('/api/v1/admin/products/1/skus')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          sku_code: 'TC-SOL-MD-OBS',
          attributes: {
            'Vessel Size': 'Medium',
            'Glaze Finish': 'Matte Obsidian'
          },
          price: 49.50,
          stock_quantity: 14,
          is_active: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sku.sku_code).toBe('TC-SOL-MD-OBS');
      expect(res.body.data.sku.price).toBe('49.50');
      expect(res.body.data.sku.stock_quantity).toBe(14);
    });

    it('rejects duplicate SKU code with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products/1/skus')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          sku_code: 'TC-SOL-MD-OBS', // already inserted above
          attributes: {
            'Vessel Size': 'Small',
            'Glaze Finish': 'Speckled Sand'
          },
          price: 34.00,
          stock_quantity: 5
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ConflictDuplicateResource');
    });

    it('rejects adding SKU to non-existent product (404)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products/99999/skus')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          sku_code: 'GHOST-SKU',
          price: 10.00
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ResourceNotFound');
    });
  });

  describe('Variant Combination Enforcement (CAT-04)', () => {
    it('rejects SKU when a required variant dimension is missing (400)', async () => {
      // Missing 'Glaze Finish'
      const res = await request(app)
        .post('/api/v1/admin/products/1/skus')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          sku_code: 'TC-SOL-FAIL-MISSING',
          attributes: {
            'Vessel Size': 'Small'
          },
          price: 35.00,
          stock_quantity: 10
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('InvalidVariantCombination');
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.stringMatching(/Missing attribute value for variant dimension 'Glaze Finish'/i)])
      );
    });

    it('rejects SKU when an invalid variant option value is submitted (400)', async () => {
      // 'Neon Pink' is not a permitted option for Glaze Finish
      const res = await request(app)
        .post('/api/v1/admin/products/1/skus')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          sku_code: 'TC-SOL-FAIL-GLAZE',
          attributes: {
            'Vessel Size': 'Medium',
            'Glaze Finish': 'Neon Pink Glaze'
          },
          price: 45.00,
          stock_quantity: 10
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('InvalidVariantCombination');
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.stringMatching(/Invalid value 'Neon Pink Glaze'/i)])
      );
    });

    it('rejects SKU when an extraneous unknown variant dimension is submitted (400)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products/1/skus')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          sku_code: 'TC-SOL-FAIL-EXTRA',
          attributes: {
            'Vessel Size': 'Large',
            'Glaze Finish': 'Speckled Sand',
            'Bluetooth Enabled': 'Yes' // invalid dimension
          },
          price: 70.00,
          stock_quantity: 5
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('InvalidVariantCombination');
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.stringMatching(/not a defined variant dimension/i)])
      );
    });

    it('rejects duplicate attribute combinations for the same product (400)', async () => {
      // Small x Matte Obsidian (TC-SOL-SM-OBS) is already seeded
      const res = await request(app)
        .post('/api/v1/admin/products/1/skus')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          sku_code: 'TC-SOL-SM-OBS-DUP',
          attributes: {
            'Vessel Size': 'Small',
            'Glaze Finish': 'Matte Obsidian'
          },
          price: 34.00,
          stock_quantity: 10
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('InvalidVariantCombination');
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.stringMatching(/exact variant attribute combination already exists/i)])
      );
    });
  });

  describe('Numeric Constraints & Inventory Updates (CAT-05)', () => {
    it('rejects SKU creation with negative stock quantity (400)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products/1/skus')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          sku_code: 'TC-SOL-NEG-STK',
          attributes: {
            'Vessel Size': 'Medium',
            'Glaze Finish': 'Sage Gloss'
          },
          price: 52.00,
          stock_quantity: -5
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationFailed');
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.stringMatching(/Stock quantity must be a non-negative integer/i)])
      );
    });

    it('rejects SKU creation with negative price (400)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products/1/skus')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          sku_code: 'TC-SOL-NEG-PRC',
          attributes: {
            'Vessel Size': 'Medium',
            'Glaze Finish': 'Sage Gloss'
          },
          price: -25.00,
          stock_quantity: 10
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationFailed');
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.stringMatching(/Price must be a valid non-negative decimal/i)])
      );
    });

    it('updates price and stock on an existing SKU (200)', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/skus/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          price: 36.50,
          stock_quantity: 20
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sku.price).toBe('36.50');
      expect(res.body.data.sku.stock_quantity).toBe(20);
    });

    it('rejects updating an existing SKU with negative stock (400)', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/skus/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ stock_quantity: -10 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationFailed');
    });

    it('rejects updating an existing SKU with negative price (400)', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/skus/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ price: -5.00 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationFailed');
    });
  });
});
