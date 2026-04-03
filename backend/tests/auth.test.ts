/**
 * tests/auth.test.ts
 * 
 * Integration tests for the auth module.
 * Uses finance_test PostgreSQL database via testPrisma (from setup.ts).
 * Tables are truncated before each test (beforeEach in setup.ts).
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { testPrisma } from './setup';

describe('Auth Module', () => {
  // ── Register ────────────────────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('first registered user gets ADMIN role', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'Password@123',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ADMIN');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('second registered user gets VIEWER role', async () => {
      // First user
      await request(app).post('/api/auth/register').send({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'Password@123',
      });

      // Second user
      const res = await request(app).post('/api/auth/register').send({
        name: 'Viewer User',
        email: 'viewer@test.com',
        password: 'Password@123',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('VIEWER');
    });

    it('returns 409 if email already exists', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'User',
        email: 'dup@test.com',
        password: 'Password@123',
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'User 2',
        email: 'dup@test.com',
        password: 'Password@123',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('returns 422 for invalid input', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: '',
        email: 'not-an-email',
        password: 'short',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeInstanceOf(Array);
    });

    it('returns 422 for weak password (no uppercase, no special char)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'weak@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeInstanceOf(Array);
    });
  });

  // ── Login ───────────────────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'user@test.com',
        password: 'Password@123',
      });
    });

    it('returns accessToken and refreshToken on valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'user@test.com',
        password: 'Password@123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(typeof res.body.data.refreshToken).toBe('string');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('returns 401 with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'user@test.com',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 for non-existent user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@test.com',
        password: 'Password@123',
      });

      expect(res.status).toBe(401);
    });

    it('returns 403 for INACTIVE user', async () => {
      // Deactivate the user directly in DB
      await testPrisma.user.update({
        where: { email: 'user@test.com' },
        data: { status: 'INACTIVE' },
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'user@test.com',
        password: 'Password@123',
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ── Refresh ─────────────────────────────────────────────────────────────────

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;
    let accessToken: string;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'user@test.com',
        password: 'Password@123',
      });

      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'user@test.com',
        password: 'Password@123',
      });

      refreshToken = loginRes.body.data.refreshToken;
      accessToken = loginRes.body.data.accessToken;
    });

    it('returns new token pair on valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(typeof res.body.data.refreshToken).toBe('string');
      // New tokens should be different from old
      expect(res.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('old refresh token is invalidated after rotation', async () => {
      // Use token once (rotation)
      await request(app).post('/api/auth/refresh').send({ refreshToken });

      // Try to use old token again
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 for invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'completely-invalid-token' });

      expect(res.status).toBe(401);
    });

    it('accessToken is usable for authenticated routes', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${accessToken}`);

      // Should not be 401 (might be 200 with empty list)
      expect(res.status).not.toBe(401);
    });
  });

  // ── Logout ──────────────────────────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'user@test.com',
        password: 'Password@123',
      });

      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'user@test.com',
        password: 'Password@123',
      });

      refreshToken = loginRes.body.data.refreshToken;
    });

    it('returns 204 on logout', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken });

      expect(res.status).toBe(204);
    });

    it('refresh fails after logout', async () => {
      await request(app).post('/api/auth/logout').send({ refreshToken });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(401);
    });
  });
});
