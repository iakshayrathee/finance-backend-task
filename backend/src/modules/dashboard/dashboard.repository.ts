import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';

/** Safe coercion: null → "0.00", Prisma.Decimal → string with 2 decimal places */
const toStr = (d: Prisma.Decimal | null): string =>
  (d ?? new Prisma.Decimal(0)).toFixed(2);

/**
 * Dashboard repository — all aggregation queries live here.
 * All queries exclude soft-deleted records (isDeleted = false).
 */
export const dashboardRepository = {
  /**
   * Summary: total income, total expenses, net balance, record count.
   */
  getSummary: async () => {
    const [income, expense, count] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { isDeleted: false, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.financialRecord.aggregate({
        where: { isDeleted: false, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      prisma.financialRecord.count({ where: { isDeleted: false } }),
    ]);

    const totalIncome = toStr(income._sum.amount);
    const totalExpenses = toStr(expense._sum.amount);
    const netBalance = new Prisma.Decimal(totalIncome)
      .minus(new Prisma.Decimal(totalExpenses))
      .toFixed(2);

    return { totalIncome, totalExpenses, netBalance, recordCount: count };
  },

  /**
   * Group-by category + type — totals per category.
   */
  getByCategory: async () => {
    const groups = await prisma.financialRecord.groupBy({
      by: ['category', 'type'],
      where: { isDeleted: false },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { category: 'asc' },
    });

    return groups.map((g) => ({
      category: g.category,
      type: g.type,
      total: toStr(g._sum.amount),
      count: g._count.id,
    }));
  },

  /**
   * Trends — PostgreSQL DATE_TRUNC via $queryRaw.
   * Groups records by period (monthly or weekly) and sums INCOME / EXPENSE.
   */
  getTrends: async (period: 'monthly' | 'weekly') => {
    const truncUnit = period === 'monthly' ? 'month' : 'week';

    type TrendRow = {
      period: Date;
      income: string;
      expenses: string;
    };

    const rows = await prisma.$queryRaw<TrendRow[]>(
      Prisma.sql`
        SELECT
          DATE_TRUNC(${Prisma.raw(`'${truncUnit}'`)}, date) AS period,
          SUM(CASE WHEN type = 'INCOME'  THEN amount ELSE 0 END)::TEXT AS income,
          SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END)::TEXT AS expenses
        FROM financial_records
        WHERE "isDeleted" = false
        GROUP BY DATE_TRUNC(${Prisma.raw(`'${truncUnit}'`)}, date)
        ORDER BY period ASC
      `
    );

    return rows.map((r) => {
      const incomeDecimal = new Prisma.Decimal(r.income ?? '0');
      const expensesDecimal = new Prisma.Decimal(r.expenses ?? '0');
      const net = incomeDecimal.minus(expensesDecimal).toString();

      // Format period label
      const d = new Date(r.period);
      const label =
        period === 'monthly'
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, '0')}`;

      return {
        period: label,
        income: incomeDecimal.toFixed(2),
        expenses: expensesDecimal.toFixed(2),
        net: incomeDecimal.minus(expensesDecimal).toFixed(2),
      };
    });
  },

  /**
   * Recent records — top N non-deleted records sorted by date desc.
   */
  getRecent: async (limit: number) => {
    const records = await prisma.financialRecord.findMany({
      where: { isDeleted: false },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return records.map((r) => ({
      ...r,
      amount: r.amount.toFixed(2), // Decimal → string with 2 decimal places
    }));
  },
};

/** ISO 8601 week number helper */
function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
