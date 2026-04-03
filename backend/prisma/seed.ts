import { PrismaClient, TxType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

const categories = ['Salary', 'Rent', 'Food', 'Utilities', 'Travel', 'Healthcare'];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', BCRYPT_ROUNDS);
  const analystPassword = await bcrypt.hash('Analyst@123', BCRYPT_ROUNDS);
  const viewerPassword = await bcrypt.hash('Viewer@123', BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      name: 'Demo Admin',
      email: 'admin@demo.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@demo.com' },
    update: {},
    create: {
      name: 'Demo Analyst',
      email: 'analyst@demo.com',
      password: analystPassword,
      role: 'ANALYST',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@demo.com' },
    update: {},
    create: {
      name: 'Demo Viewer',
      email: 'viewer@demo.com',
      password: viewerPassword,
      role: 'VIEWER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Users created');

  // ── Financial Records (30 rows across last 90 days) ────────────────────────
  const creatorIds = [admin.id, analyst.id];

  const records: {
    amount: string;
    type: TxType;
    category: string;
    date: Date;
    notes?: string;
    createdBy: string;
  }[] = [
    // Salary — INCOME
    { amount: '5000.00', type: 'INCOME', category: 'Salary', date: daysAgo(85), notes: 'Monthly salary', createdBy: admin.id },
    { amount: '5000.00', type: 'INCOME', category: 'Salary', date: daysAgo(55), notes: 'Monthly salary', createdBy: admin.id },
    { amount: '5200.00', type: 'INCOME', category: 'Salary', date: daysAgo(25), notes: 'Monthly salary + bonus', createdBy: admin.id },

    // Rent — EXPENSE
    { amount: '1500.00', type: 'EXPENSE', category: 'Rent', date: daysAgo(88), notes: 'Monthly rent payment', createdBy: analyst.id },
    { amount: '1500.00', type: 'EXPENSE', category: 'Rent', date: daysAgo(58), notes: 'Monthly rent payment', createdBy: analyst.id },
    { amount: '1500.00', type: 'EXPENSE', category: 'Rent', date: daysAgo(28), notes: 'Monthly rent payment', createdBy: analyst.id },

    // Food — EXPENSE
    { amount: '320.50', type: 'EXPENSE', category: 'Food', date: daysAgo(80), notes: 'Grocery shopping', createdBy: admin.id },
    { amount: '145.00', type: 'EXPENSE', category: 'Food', date: daysAgo(75), notes: 'Restaurant dinner', createdBy: analyst.id },
    { amount: '290.00', type: 'EXPENSE', category: 'Food', date: daysAgo(50), notes: 'Weekly groceries', createdBy: admin.id },
    { amount: '180.75', type: 'EXPENSE', category: 'Food', date: daysAgo(30), notes: 'Takeout orders', createdBy: analyst.id },
    { amount: '95.20', type: 'EXPENSE', category: 'Food', date: daysAgo(10), notes: 'Cafe and snacks', createdBy: admin.id },

    // Utilities — EXPENSE
    { amount: '210.00', type: 'EXPENSE', category: 'Utilities', date: daysAgo(82), notes: 'Electricity bill', createdBy: analyst.id },
    { amount: '85.00', type: 'EXPENSE', category: 'Utilities', date: daysAgo(82), notes: 'Water bill', createdBy: analyst.id },
    { amount: '65.00', type: 'EXPENSE', category: 'Utilities', date: daysAgo(52), notes: 'Internet subscription', createdBy: admin.id },
    { amount: '200.00', type: 'EXPENSE', category: 'Utilities', date: daysAgo(52), notes: 'Electricity bill', createdBy: analyst.id },
    { amount: '70.00', type: 'EXPENSE', category: 'Utilities', date: daysAgo(22), notes: 'Internet + streaming', createdBy: admin.id },

    // Travel — EXPENSE + INCOME
    { amount: '450.00', type: 'EXPENSE', category: 'Travel', date: daysAgo(70), notes: 'Flight tickets', createdBy: admin.id },
    { amount: '180.00', type: 'EXPENSE', category: 'Travel', date: daysAgo(68), notes: 'Hotel accommodation', createdBy: admin.id },
    { amount: '95.00', type: 'EXPENSE', category: 'Travel', date: daysAgo(40), notes: 'Train tickets', createdBy: analyst.id },
    { amount: '1200.00', type: 'INCOME', category: 'Travel', date: daysAgo(35), notes: 'Travel reimbursement from employer', createdBy: analyst.id },
    { amount: '250.00', type: 'EXPENSE', category: 'Travel', date: daysAgo(8), notes: 'Taxi and rideshare', createdBy: admin.id },

    // Healthcare — EXPENSE
    { amount: '350.00', type: 'EXPENSE', category: 'Healthcare', date: daysAgo(78), notes: 'Dental check-up', createdBy: admin.id },
    { amount: '120.00', type: 'EXPENSE', category: 'Healthcare', date: daysAgo(60), notes: 'Prescription medication', createdBy: analyst.id },
    { amount: '500.00', type: 'EXPENSE', category: 'Healthcare', date: daysAgo(45), notes: 'Eye examination and glasses', createdBy: admin.id },
    { amount: '75.00', type: 'EXPENSE', category: 'Healthcare', date: daysAgo(15), notes: 'Pharmacy', createdBy: analyst.id },

    // Extra records to reach 30 + variety
    { amount: '800.00', type: 'INCOME', category: 'Salary', date: daysAgo(42), notes: 'Freelance consulting', createdBy: analyst.id },
    { amount: '2500.00', type: 'INCOME', category: 'Salary', date: daysAgo(12), notes: 'Project bonus', createdBy: admin.id },
    { amount: '350.00', type: 'EXPENSE', category: 'Food', date: daysAgo(20), notes: 'Weekly meal prep and groceries', createdBy: analyst.id },
    { amount: '9999.99', type: 'INCOME', category: 'Salary', date: daysAgo(3), notes: 'Quarterly performance bonus', createdBy: admin.id },
    { amount: '50.00', type: 'EXPENSE', category: 'Healthcare', date: daysAgo(2), notes: 'Vitamins and supplements', createdBy: analyst.id },
  ];

  // Delete existing seed records to keep seed idempotent
  await prisma.financialRecord.deleteMany({
    where: {
      createdBy: { in: [admin.id, analyst.id] },
      notes: { not: null },
    },
  });

  await prisma.financialRecord.createMany({ data: records });

  console.log(`✅ ${records.length} financial records created`);
  console.log('🌱 Seeding complete!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  ADMIN:   admin@demo.com   / Admin@123');
  console.log('  ANALYST: analyst@demo.com / Analyst@123');
  console.log('  VIEWER:  viewer@demo.com  / Viewer@123');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
