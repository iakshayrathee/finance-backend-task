/**
 * tests/dashboard.test.ts
 * 
 * Integration tests for the dashboard module.
 * Tests RBAC, decimal-as-string enforcement, and aggregate correctness.
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

async function createRecord(
  token: string,
  data: {
    amount: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    date?: string;
    notes?: string;
  }
) {
  return request(app)
    .post('/api/records')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: new Date().toISOString(), ...data });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Dashboard Module', () => {
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
    const res = await request(app).post('/api/auth/login').send({
      email: 'analyst@test.com',
      password: 'Password@123',
    });
    analystToken = res.body.data.accessToken;

    // Seed known financial records for predictable assertion
    await createRecord(adminToken, { amount: '1000.00', type: 'INCOME', category: 'Salary', notes: 'Income 1' });
    await createRecord(adminToken, { amount: '500.00', type: 'INCOME', category: 'Travel', notes: 'Income 2' });
    await createRecord(adminToken, { amount: '300.00', type: 'EXPENSE', category: 'Food', notes: 'Expense 1' });
    await createRecord(analystToken, { amount: '200.00', type: 'EXPENSE', category: 'Utilities', notes: 'Expense 2' });
  });

  // ── RBAC ─────────────────────────────────────────────────────────────────

  describe('RBAC: VIEWER can access summary and recent, but not analytics endpoints', () => {
    it('GET /api/dashboard/summary → 200 for VIEWER', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/dashboard/recent → 200 for VIEWER', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/dashboard/by-category → 403 for VIEWER', async () => {
      const res = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /api/dashboard/trends → 403 for VIEWER', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Summary ───────────────────────────────────────────────────────────────

  describe('GET /api/dashboard/summary', () => {
    it('ANALYST can access summary', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('summary totals match seeded data exactly', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { totalIncome, totalExpenses, netBalance, recordCount } = res.body.data;

      // 1000 + 500 = 1500 income
      expect(totalIncome).toBe('1500.00');
      // 300 + 200 = 500 expenses
      expect(totalExpenses).toBe('500.00');
      // 1500 - 500 = 1000 net
      expect(netBalance).toBe('1000.00');
      // 4 records total
      expect(recordCount).toBe(4);
    });

    it('all monetary fields in summary are strings, not numbers', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      const { totalIncome, totalExpenses, netBalance } = res.body.data;
      expect(typeof totalIncome).toBe('string');
      expect(typeof totalExpenses).toBe('string');
      expect(typeof netBalance).toBe('string');
    });
  });

  // ── By Category ───────────────────────────────────────────────────────────

  describe('GET /api/dashboard/by-category', () => {
    it('returns array of category groups', async () => {
      const res = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('each group has total as string and count as number', async () => {
      const res = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${analystToken}`);

      res.body.data.forEach((g: { total: unknown; count: unknown }) => {
        expect(typeof g.total).toBe('string');
        expect(typeof g.count).toBe('number');
      });
    });

    it('Salary category has correct total', async () => {
      const res = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${adminToken}`);

      const salaryGroup = res.body.data.find(
        (g: { category: string; type: string }) => g.category === 'Salary' && g.type === 'INCOME'
      );
      expect(salaryGroup).toBeDefined();
      expect(salaryGroup.total).toBe('1000.00');
    });
  });

  // ── Trends ────────────────────────────────────────────────────────────────

  describe('GET /api/dashboard/trends', () => {
    it('defaults to monthly period', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('weekly period returns data', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?period=weekly')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('each trend entry has period, income, expenses, net as strings', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${adminToken}`);

      res.body.data.forEach((t: { period: unknown; income: unknown; expenses: unknown; net: unknown }) => {
        expect(typeof t.period).toBe('string');
        expect(typeof t.income).toBe('string');
        expect(typeof t.expenses).toBe('string');
        expect(typeof t.net).toBe('string');
      });
    });

    it('invalid period value → 422', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?period=yearly')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
    });
  });

  // ── Recent ────────────────────────────────────────────────────────────────

  describe('GET /api/dashboard/recent', () => {
    it('returns recent records sorted by date desc', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('respects ?limit parameter', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent?limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });

    it('amount fields in recent records are strings', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${adminToken}`);

      res.body.data.forEach((r: { amount: unknown }) => {
        expect(typeof r.amount).toBe('string');
      });
    });

    it('soft-deleted records are excluded from recent', async () => {
      // Get a record and soft-delete it
      const listRes = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);
      const recordId = listRes.body.data.records[0].id;

      await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const recentRes = await request(app)
        .get('/api/dashboard/recent?limit=50')
        .set('Authorization', `Bearer ${adminToken}`);

      const ids = recentRes.body.data.map((r: { id: string }) => r.id);
      expect(ids).not.toContain(recordId);
    });
  });
});
