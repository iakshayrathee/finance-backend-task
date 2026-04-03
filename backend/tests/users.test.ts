/**
 * tests/users.test.ts
 * 
 * Integration tests for the users module.
 * RBAC enforcement: only ADMIN can access /api/users.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { testPrisma } from './setup';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function registerAndLogin(
  email: string,
  password: string,
  name = 'Test User'
) {
  await request(app).post('/api/auth/register').send({ name, email, password });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.data as { accessToken: string; refreshToken: string; user: { id: string; role: string } };
}

async function makeAdmin(email: string) {
  return testPrisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });
}

async function makeAnalyst(email: string) {
  return testPrisma.user.update({
    where: { email },
    data: { role: 'ANALYST' },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Users Module', () => {
  let adminToken: string;
  let viewerToken: string;
  let analystToken: string;
  let targetUserId: string;

  beforeEach(async () => {
    // First user = ADMIN
    const admin = await registerAndLogin('admin@test.com', 'Password@123', 'Admin User');
    adminToken = admin.accessToken;

    // Second user = VIEWER
    const viewer = await registerAndLogin('viewer@test.com', 'Password@123', 'Viewer User');
    viewerToken = viewer.accessToken;

    // Third user = ANALYST (promote manually)
    const analyst = await registerAndLogin('analyst@test.com', 'Password@123', 'Analyst User');
    await makeAnalyst('analyst@test.com');
    // Re-login to get token with ANALYST role
    const analystLoginRes = await request(app).post('/api/auth/login').send({
      email: 'analyst@test.com',
      password: 'Password@123',
    });
    analystToken = analystLoginRes.body.data.accessToken;
    targetUserId = viewer.user.id ?? analystLoginRes.body.data.user.id;

    // Get the viewer's actual ID
    const viewerUser = await testPrisma.user.findUnique({ where: { email: 'viewer@test.com' } });
    targetUserId = viewerUser!.id;
  });

  // ── RBAC: GET /users ───────────────────────────────────────────────────────

  describe('GET /api/users', () => {
    it('VIEWER cannot list users → 403', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, message: 'Insufficient permissions' });
    });

    it('ANALYST cannot list users → 403', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, message: 'Insufficient permissions' });
    });

    it('ADMIN can list users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeInstanceOf(Array);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('ADMIN list does not include password field', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      res.body.data.users.forEach((u: Record<string, unknown>) => {
        expect(u.password).toBeUndefined();
      });
    });

    it('unauthenticated request → 401', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });
  });

  // ── RBAC: GET /users/:id ──────────────────────────────────────────────────

  describe('GET /api/users/:id', () => {
    it('VIEWER cannot get user by id → 403', async () => {
      const res = await request(app)
        .get(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('ADMIN can get user by id', async () => {
      const res = await request(app)
        .get(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(targetUserId);
    });

    it('returns 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── RBAC: PATCH /users/:id ────────────────────────────────────────────────

  describe('PATCH /api/users/:id', () => {
    it('VIEWER cannot update user → 403', async () => {
      const res = await request(app)
        .patch(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(403);
    });

    it('ADMIN can update user name, role, status', async () => {
      const res = await request(app)
        .patch(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name', role: 'ANALYST' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Updated Name');
      expect(res.body.data.user.role).toBe('ANALYST');
    });

    it('returns 422 for invalid role value', async () => {
      const res = await request(app)
        .patch(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'SUPERUSER' });

      expect(res.status).toBe(422);
    });
  });

  // ── RBAC: DELETE /users/:id ───────────────────────────────────────────────

  describe('DELETE /api/users/:id', () => {
    it('VIEWER cannot delete user → 403', async () => {
      const res = await request(app)
        .delete(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('ANALYST cannot delete user → 403', async () => {
      const res = await request(app)
        .delete(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(403);
    });

    it('ADMIN can soft-delete (deactivate) a user', async () => {
      const res = await request(app)
        .delete(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.status).toBe('INACTIVE');
    });
  });

  // ── POST /users ────────────────────────────────────────────────────────────

  describe('POST /api/users', () => {
    it('VIEWER cannot create user → 403', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'New User', email: 'new@test.com', password: 'Password@123' });

      expect(res.status).toBe(403);
    });

    it('ADMIN can create a user with default VIEWER role', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Viewer', email: 'newviewer@test.com', password: 'Password@123' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('VIEWER');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('ADMIN can create a user with explicit ANALYST role', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Analyst', email: 'newanalyst@test.com', password: 'Password@123', role: 'ANALYST' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('ANALYST');
    });

    it('returns 409 when email is already taken', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Dup', email: 'viewer@test.com', password: 'Password@123' });

      expect(res.status).toBe(409);
    });

    it('returns 422 for weak password (no special character)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Weak', email: 'weak@test.com', password: 'Password123' });

      expect(res.status).toBe(422);
      expect(res.body.errors).toBeInstanceOf(Array);
    });

    it('returns 422 for invalid email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bad', email: 'not-an-email', password: 'Password@123' });

      expect(res.status).toBe(422);
    });
  });
});
