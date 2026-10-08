/**
 * Product Identity & Lifecycle Test Suite (CAT-02)
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 * Engine: In-Memory PostgreSQL Engine (pg-mem)
 */

const request = require('supertest');
const app = require('../src/app');
const { setupTestDb, getTokens } = require('./testHelper');

describe('Product Identity & Lifecycle Tests (CAT-02)', () => {
  let tokens;

  beforeAll(async () => {
    tokens = await setupTestDb();
  });

  describe('Product Creation (POST /api/v1/admin/products)', () => {
    it('creates a new draft product with specifications (201)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          category_id: 1,
          name: 'Fluted Ceramic Espresso Cup',
          slug: 'fluted-ceramic-espresso-cup',
          description: 'Handcrafted 3oz demitasse cup for specialty espresso.',
          status: 'draft',
          specifications: {
            clay_body: 'Porcelain Stoneware',
            capacity_oz: 3,
            dishwasher_safe: true,
            microwave_safe: true
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.slug).toBe('fluted-ceramic-espresso-cup');
      expect(res.body.data.product.status).toBe('draft');
      expect(res.body.data.product.specifications.capacity_oz).toBe(3);
    });

    it('rejects duplicate product slug with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          category_id: 1,
          name: 'Duplicate Planter',
          slug: 'solstice-ceramic-planter' // already seeded
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('ConflictDuplicateResource');
    });

    it('rejects product creation when category_id does not exist (400)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          category_id: 88888,
          name: 'Orphaned Vessel',
          slug: 'orphaned-vessel'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ForeignKeyViolation');
    });

    it('rejects product creation when required fields are missing (400)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ name: 'Incomplete Ceramic' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationFailed');
    });

    it('rejects creating a product directly as published without SKUs (400)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          category_id: 1,
          name: 'Direct Publish Vessel',
          slug: 'direct-publish-vessel',
          status: 'published'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('InvalidLifecycleTransition');
    });
  });

  describe('Product Retrieval (GET /api/v1/admin/products)', () => {
    it('returns administrative products list with inventory aggregates (200)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.products.length).toBeGreaterThanOrEqual(3);

      const solstice = res.body.data.products.find(p => p.slug === 'solstice-ceramic-planter');
      expect(solstice).toBeDefined();
      expect(solstice.sku_count).toBeGreaterThanOrEqual(4);
      expect(solstice.total_stock).toBeGreaterThan(0);
    });

    it('returns single product details with variants, SKUs, and assets (200)', async () => {
      // Solstice planter has ID 1
      const res = await request(app)
        .get('/api/v1/admin/products/1')
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.product).toBeDefined();
      expect(res.body.data.product.variants).toBeDefined();
      expect(res.body.data.product.skus).toBeDefined();
      expect(res.body.data.product.variants.length).toBe(2);
      expect(res.body.data.product.skus.length).toBe(4);
    });

    it('returns 404 for non-existent product ID', async () => {
      const res = await request(app)
        .get('/api/v1/admin/products/99999')
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ResourceNotFound');
    });
  });

  describe('Product Publication & Business Rules', () => {
    it('enforces Business Rule 1: A draft product without SKUs cannot be published (400)', async () => {
      // Product 3 (Wabi-Sabi Fluted Vase) is seeded as draft with 0 SKUs
      const res = await request(app)
        .patch('/api/v1/admin/products/3')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ status: 'published' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('InvalidPublicationState');
      expect(res.body.message).toMatch(/must have at least one sellable active SKU/i);
    });

    it('allows updating product content while maintaining draft status (200)', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/products/3')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          description: 'Updated artisan notes: single batch clay formulation from local riverbed.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.product.description).toMatch(/single batch clay/i);
    });

    it('defines a variant dimension on a product successfully (201)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products/3/variants')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          name: 'Clay Body',
          options: ['Dark Terracotta', 'Buff Stoneware']
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.variant.name).toBe('Clay Body');
    });
  });
});
