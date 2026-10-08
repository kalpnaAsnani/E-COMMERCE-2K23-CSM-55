/**
 * Category Hierarchy & Management Test Suite (CAT-01)
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 * Engine: In-Memory PostgreSQL Engine (pg-mem)
 */

const request = require('supertest');
const app = require('../src/app');
const { setupTestDb, getTokens } = require('./testHelper');

describe('Category Hierarchy & Management Tests (CAT-01)', () => {
  let tokens;

  beforeAll(async () => {
    tokens = await setupTestDb();
  });

  describe('Category Creation (POST /api/v1/admin/categories)', () => {
    it('creates a new root category successfully (201)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          name: 'Sculptural Vessels',
          slug: 'sculptural-vessels',
          description: 'Contemporary one-of-a-kind art pieces and pedestals'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category.slug).toBe('sculptural-vessels');
      expect(res.body.data.category.parent_id).toBeNull();
      expect(res.body.data.category.is_active).toBe(true);
    });

    it('creates a child subcategory with valid parent_id (201)', async () => {
      // Find Tableware root category (id: 1)
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          name: 'Serving Platters',
          slug: 'serving-platters',
          description: 'Large ceramic hosting platters',
          parent_id: 1
        });

      expect(res.status).toBe(201);
      expect(res.body.data.category.parent_id).toBe(1);
    });

    it('rejects duplicate category slug with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          name: 'Duplicate Tableware',
          slug: 'tableware' // already seeded
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('ConflictDuplicateResource');
    });

    it('rejects category creation with missing name or slug (400)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ description: 'No name provided' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationFailed');
    });

    it('rejects creation with non-existent parent_id (400)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({
          name: 'Ghost Child',
          slug: 'ghost-child',
          parent_id: 99999
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Category Tree Listing (GET /api/v1/admin/categories)', () => {
    it('returns the category tree with nested children hierarchy (200)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.categories)).toBe(true);

      // Verify root categories contain nested children arrays
      const tableware = res.body.data.categories.find(c => c.slug === 'tableware');
      expect(tableware).toBeDefined();
      expect(Array.isArray(tableware.children)).toBe(true);
      expect(tableware.children.length).toBeGreaterThanOrEqual(2);
    });

    it('supports flat format parameter (format=flat)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/categories?format=flat')
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.categories)).toBe(true);
      expect(res.body.data.categories[0].children).toBeUndefined();
    });
  });

  describe('Category Hierarchy Cycle Prevention (CAT-01)', () => {
    it('rejects self-parenting cycle where category sets itself as parent (400)', async () => {
      // Tableware has ID 1
      const res = await request(app)
        .patch('/api/v1/admin/categories/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ parent_id: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('HierarchyCycleDetected');
      expect(res.body.message).toMatch(/cannot be its own parent/i);
    });

    it('rejects transitive cycle where category sets a descendant as its parent (400)', async () => {
      // In seed: Tableware (id: 1) is parent of Plates & Bowls (id: 2).
      // Setting Tableware's parent_id = 2 would create a cycle (1 -> 2 -> 1).
      const res = await request(app)
        .patch('/api/v1/admin/categories/1')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ parent_id: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('HierarchyCycleDetected');
      expect(res.body.message).toMatch(/descendant/i);
    });

    it('allows valid parent_id update without cycles (200)', async () => {
      // Move drinkware (id: 3) to horticultural stoneware (id: 4)
      const res = await request(app)
        .patch('/api/v1/admin/categories/3')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ parent_id: 4 });

      expect(res.status).toBe(200);
      expect(res.body.data.category.parent_id).toBe(4);

      // Revert parent back to 1
      await request(app)
        .patch('/api/v1/admin/categories/3')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ parent_id: 1 });
    });

    it('allows deactivating a category (200)', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/categories/3')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ is_active: false });

      expect(res.status).toBe(200);
      expect(res.body.data.category.is_active).toBe(false);
    });
  });
});
