/**
 * tests/setup.ts
 * 
 * Global test setup. Runs before ALL test suites AND before each individual 
 * suite file. Truncates all tables in FK-safe order to ensure a clean state.
 * 
 * FK-safe truncation order: RefreshToken → FinancialRecord → User
 * 
 * NOTE: Uses finance_test PostgreSQL database (NOT SQLite).
 * TEST_DATABASE_URL must point to finance_test.
 */

import { beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load .env so TEST_DATABASE_URL is available
dotenv.config();

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Tests require a separate PostgreSQL database named "finance_test".'
  );
}

export const testPrisma = new PrismaClient({
  datasources: {
    db: { url: testDatabaseUrl },
  },
  log: [],
});

/**
 * Truncate all tables in FK-safe order before each test suite.
 * This ensures "first user = ADMIN" logic works correctly in auth tests.
 */
async function truncateAllTables() {
  await testPrisma.$executeRaw`TRUNCATE TABLE "refresh_tokens" RESTART IDENTITY CASCADE`;
  await testPrisma.$executeRaw`TRUNCATE TABLE "financial_records" RESTART IDENTITY CASCADE`;
  await testPrisma.$executeRaw`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE`;
}

beforeEach(async () => {
  await truncateAllTables();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
