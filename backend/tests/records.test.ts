/**
 * tests/records.test.ts
 * 
 * Integration tests for the records module.
 * Tests RBAC, soft-delete exclusion, and all filter parameters.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { testPrisma } from './setup';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function registerAndLogin(email: string, password: string, name = 'User') {
  await request(app).post('/api/auth/register').send({ name, email, password });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.data as { accessToken: string; user: { id: string } };
}

const sampleRecord = {
  amount: '1500.00',
  type: 'INCOME',
  category: 'Salary',
  date: new Date().toISOString(),
  notes: 'Monthly salary',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Records Module', () => {
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;

  beforeEach(async () => {
    // First = ADMIN
    const admin = await registerAndLogin('admin@test.com', 'Password@123', 'Admin');
    adminToken = admin.accessToken;

    // Second = VIEWER
    const viewer = await registerAndLogin('viewer@test.com', 'Password@123', 'Viewer');
    viewerToken = viewer.accessToken;

    // Third = VIEWER → promote to ANALYST
    await registerAndLogin('analyst@test.com', 'Password@123', 'Analyst');
    await testPrisma.user.update({
      where: { email: 'analyst@test.com' },
      data: { role: 'ANALYST' },
    });
    const analystLoginRes = await request(app).post('/api/auth/login').send({
      email: 'analyst@test.com',
      password: 'Password@123',
    });
    analystToken = analystLoginRes.body.data.accessToken;
  });

  // ── POST /records ─────────────────────────────────────────────────────────

  describe('POST /api/records', () => {
    it('VIEWER cannot create record → 403', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(sampleRecord);

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, message: 'Insufficient permissions' });
    });

    it('ANALYST can create a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send(sampleRecord);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.record.amount).toBe('1500.00');
      expect(typeof res.body.data.record.amount).toBe('string'); // Decimal → string
    });

    it('ADMIN can create a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleRecord);

      expect(res.status).toBe(201);
    });

    it('returns 422 for invalid amount format', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ ...sampleRecord, amount: 'not-a-number' });

      expect(res.status).toBe(422);
    });

    it('amount in response is a string, not a number', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send(sampleRecord);

      expect(typeof res.body.data.record.amount).toBe('string');
    });
  });

  // ── GET /records ──────────────────────────────────────────────────────────

  describe('GET /api/records', () => {
    beforeEach(async () => {
      // Seed a few records
      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ amount: '1000.00', type: 'INCOME', category: 'Salary', date: '2024-01-15T00:00:00.000Z', notes: 'January salary' });

      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ amount: '250.00', type: 'EXPENSE', category: 'Food', date: '2024-02-10T00:00:00.000Z', notes: 'Grocery shopping' });

      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: '800.00', type: 'INCOME', category: 'Travel', date: '2024-03-01T00:00:00.000Z', notes: 'Travel reimbursement' });
    });

    it('VIEWER can list records', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records).toBeInstanceOf(Array);
    });

    it('filter by type=INCOME returns only income records', async () => {
      const res = await request(app)
        .get('/api/records?type=INCOME')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      res.body.data.records.forEach((r: { type: string }) => {
        expect(r.type).toBe('INCOME');
      });
    });

    it('filter by category=Food returns only Food records', async () => {
      const res = await request(app)
        .get('/api/records?category=Food')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      res.body.data.records.forEach((r: { category: string }) => {
        expect(r.category).toBe('Food');
      });
    });

    it('filter by date range returns records within range', async () => {
      const res = await request(app)
        .get('/api/records?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.000Z')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBeGreaterThanOrEqual(1);
      res.body.data.records.forEach((r: { date: string }) => {
        const d = new Date(r.date);
        expect(d.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-01').getTime());
        expect(d.getTime()).toBeLessThanOrEqual(new Date('2024-01-31T23:59:59').getTime());
      });
    });

    it('search on notes returns matching records case-insensitively', async () => {
      const res = await request(app)
        .get('/api/records?search=grocery')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBeGreaterThanOrEqual(1);
    });

    it('pagination: limit=2 returns at most 2 records', async () => {
      const res = await request(app)
        .get('/api/records?limit=2')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBeLessThanOrEqual(2);
      expect(res.body.data.pagination.limit).toBe(2);
    });

    it('soft-deleted records are excluded from list', async () => {
      // Get a record ID
      const listRes = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);
      const recordId = listRes.body.data.records[0].id;

      // Delete it
      await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // List again — deleted record must be absent
      const listRes2 = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`);

      const ids = listRes2.body.data.records.map((r: { id: string }) => r.id);
      expect(ids).not.toContain(recordId);
    });

    it('amount field is always a string', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`);

      res.body.data.records.forEach((r: { amount: unknown }) => {
        expect(typeof r.amount).toBe('string');
      });
    });
  });

  // ── GET /records/:id ──────────────────────────────────────────────────────

  describe('GET /api/records/:id', () => {
    it('returns 404 for soft-deleted record', async () => {
      // Create and immediately soft-delete a record
      const createRes = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleRecord);

      const recordId = createRes.body.data.record.id;

      await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .get(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(404);
    });

    it('VIEWER can fetch a specific record', async () => {
      const createRes = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send(sampleRecord);

      const recordId = createRes.body.data.record.id;

      const res = await request(app)
        .get(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.record.id).toBe(recordId);
    });
  });

  // ── PATCH /records/:id ────────────────────────────────────────────────────

  describe('PATCH /api/records/:id', () => {
    let recordId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send(sampleRecord);
      recordId = res.body.data.record.id;
    });

    it('VIEWER cannot update record → 403', async () => {
      const res = await request(app)
        .patch(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ category: 'Food' });

      expect(res.status).toBe(403);
    });

    it('ANALYST can update a record', async () => {
      const res = await request(app)
        .patch(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ category: 'Food', amount: '2000.00' });

      expect(res.status).toBe(200);
      expect(res.body.data.record.category).toBe('Food');
      expect(res.body.data.record.amount).toBe('2000.00');
    });
  });

  // ── DELETE /records/:id ───────────────────────────────────────────────────

  describe('DELETE /api/records/:id', () => {
    let recordId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleRecord);
      recordId = res.body.data.record.id;
    });

    it('VIEWER cannot delete record → 403', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('ANALYST cannot delete record → 403', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(403);
    });

    it('ADMIN can soft-delete a record', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify it's excluded from list
      const listRes = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);

      const ids = listRes.body.data.records.map((r: { id: string }) => r.id);
      expect(ids).not.toContain(recordId);
    });
  });
});
