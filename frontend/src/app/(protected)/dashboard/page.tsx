'use client';

import { useQuery } from '@tanstack/react-query';
import {
  DollarSign, TrendingDown, Activity, BarChart2,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { dashboardApi } from '@/lib/api/dashboard.api';
import { StatCard } from '@/components/ui/StatCard';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { RoleGate } from '@/components/layout/RoleGate';
import { IncomeExpenseBar } from '@/components/charts/IncomeExpenseBar';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { BackendActivityFeed } from '@/components/live/BackendActivityFeed';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { Role, TxType } from '@/types/api.types';
import type { FinancialRecord } from '@/types/api.types';

const recentColumns = [
  {
    key: 'date',
    header: 'Date',
    render: (r: FinancialRecord) => (
      <span className="text-xs text-muted font-mono">{formatDate(r.date)}</span>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    render: (r: FinancialRecord) => (
      <span className="text-xs text-text-primary capitalize">{r.category}</span>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    render: (r: FinancialRecord) => (
      <Badge variant={r.type === TxType.INCOME ? 'success' : 'danger'}>
        {r.type}
      </Badge>
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    className: 'text-right',
    render: (r: FinancialRecord) => (
      <span
        className={`text-sm font-semibold font-mono ${
          r.type === TxType.INCOME ? 'text-success' : 'text-danger'
        }`}
      >
        {r.type === TxType.INCOME ? '+' : '-'}
        {formatCurrency(r.amount)}
      </span>
    ),
  },
];

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn:  dashboardApi.getSummary,
  });

  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['dashboard', 'trends', 'monthly'],
    queryFn:  () => dashboardApi.getTrends('monthly'),
  });

  const { data: recent, isLoading: loadingRecent } = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn:  () => dashboardApi.getRecent(5),
  });

  const { data: byCategory } = useQuery({
    queryKey: ['dashboard', 'byCategory'],
    queryFn:  dashboardApi.getByCategory,
  });

  const netPositive =
    summary ? parseFloat(summary.netBalance) >= 0 : true;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Your financial overview at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={summary ? formatCurrency(summary.totalIncome) : '—'}
          icon={<ArrowUpRight className="w-4 h-4" />}
          loading={loadingSummary}
          className="border-success/20"
        />
        <StatCard
          title="Total Expenses"
          value={summary ? formatCurrency(summary.totalExpenses) : '—'}
          icon={<ArrowDownRight className="w-4 h-4" />}
          loading={loadingSummary}
          className="border-danger/20"
        />
        <StatCard
          title="Net Balance"
          value={summary ? formatCurrency(summary.netBalance) : '—'}
          icon={<DollarSign className="w-4 h-4" />}
          loading={loadingSummary}
          className={netPositive ? 'border-primary/30' : 'border-warning/30'}
        />
        <StatCard
          title="Total Records"
          value={summary?.recordCount ?? '—'}
          icon={<Activity className="w-4 h-4" />}
          loading={loadingSummary}
        />
      </div>

      {/* Charts row — locked for VIEWER */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RoleGate minRole={Role.ANALYST}>
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Income vs Expenses</h2>
                <span className="ml-auto text-xs text-muted">Monthly</span>
              </div>
              {loadingTrends ? (
                <div className="h-64 animate-pulse bg-border/30 rounded-xl" />
              ) : (
                <IncomeExpenseBar data={trends ?? []} />
              )}
            </div>
          </RoleGate>
        </div>

        <div>
          <RoleGate minRole={Role.ANALYST}>
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-text-primary">By Category</h2>
              </div>
              <CategoryPieChart data={byCategory ?? []} />
            </div>
          </RoleGate>
        </div>
      </div>

      {/* Bottom row: Recent records + Live feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Recent Transactions</h2>
          <Table<FinancialRecord>
            columns={recentColumns}
            data={recent ?? []}
            keyExtract={(r) => r.id}
            emptyText="No recent transactions."
          />
          {loadingRecent && (
            <div className="space-y-2 mt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-border/30" />
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 overflow-hidden" style={{ maxHeight: '400px' }}>
          <h2 className="text-sm font-semibold text-text-primary mb-4">Live Activity</h2>
          <BackendActivityFeed compact maxHeight="320px" />
        </div>
      </div>
    </div>
  );
}
