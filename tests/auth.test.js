/**
 * Authentication & Authorization Test Suite
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 * Engine: In-Memory PostgreSQL Engine (pg-mem)
 */

const request = require('supertest');
const app = require('../src/app');
const { setupTestDb, getTokens } = require('./testHelper');

describe('Authentication & Authorization Tests (CAT-06)', () => {
  let tokens;

  beforeAll(async () => {
    tokens = await setupTestDb();
  });

  describe('JWT Verification & RBAC Guards', () => {
    it('rejects administrative requests when Authorization header is missing (401)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .send({ name: 'Unauthorized Category', slug: 'unauth-cat' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('AuthenticationRequired');
    });

    it('rejects malformed Authorization header (401)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', 'InvalidFormatHeader')
        .send({ name: 'Malformed Category', slug: 'malformed-cat' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('InvalidTokenFormat');
    });

    it('rejects token with invalid cryptographic signature (401)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${tokens.invalidSignature}`)
        .send({ name: 'Tampered Category', slug: 'tampered-cat' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('InvalidToken');
    });

    it('rejects expired JWT token (401)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${tokens.expired}`)
        .send({ name: 'Expired Category', slug: 'expired-cat' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('TokenExpired');
    });

    it('rejects authenticated regular customer from admin operations (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${tokens.customer}`)
        .send({ name: 'Customer Attempt Category', slug: 'customer-cat' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('ForbiddenAdminOnly');
    });

    it('allows authenticated administrator to access admin endpoint (200/201)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Authentication Flow (/api/v1/auth)', () => {
    it('authenticates valid admin credentials and returns JWT token (200)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@terracraft.local',
          password: 'StudioAdmin2026!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('admin');
    });

    it('rejects incorrect password credentials (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@terracraft.local',
          password: 'WrongPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('AuthenticationFailed');
    });

    it('rejects non-existent email address (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@terracraft.local',
          password: 'SomePassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('AuthenticationFailed');
    });

    it('rejects login with missing email or password (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@terracraft.local' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationFailed');
    });

    it('registers a new customer account successfully (201)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@terracraft.local',
          password: 'SecurePassword123!',
          firstName: 'Elena',
          lastName: 'Rostova'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('newuser@terracraft.local');
      expect(res.body.data.user.role).toBe('customer');
    });

    it('rejects duplicate email during registration (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'admin@terracraft.local',
          password: 'SecurePassword123!',
          firstName: 'Duplicate',
          lastName: 'User'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ConflictDuplicateResource');
    });
  });
});
