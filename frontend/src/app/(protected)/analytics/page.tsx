'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, TrendingUp, PieChart, Activity } from 'lucide-react';
import { dashboardApi } from '@/lib/api/dashboard.api';
import { RoleGate } from '@/components/layout/RoleGate';
import { IncomeExpenseBar } from '@/components/charts/IncomeExpenseBar';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { NetBalanceGauge } from '@/components/charts/NetBalanceGauge';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency } from '@/utils/formatCurrency';
import { Role } from '@/types/api.types';

type Period = 'monthly' | 'weekly';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('monthly');

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn:  dashboardApi.getSummary,
  });

  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['dashboard', 'trends', period],
    queryFn:  () => dashboardApi.getTrends(period),
  });

  const { data: byCategory } = useQuery({
    queryKey: ['dashboard', 'byCategory'],
    queryFn:  dashboardApi.getByCategory,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-sm text-muted mt-1">In-depth financial trends and category breakdown</p>
        </div>
        <div className="flex gap-2">
          {(['monthly', 'weekly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize
                ${period === p
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-muted hover:text-text-primary'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Locked for VIEWER */}
      <RoleGate minRole={Role.ANALYST}>
        <div className="space-y-6">
          {/* Summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Income"
              value={summary ? formatCurrency(summary.totalIncome) : '—'}
              loading={loadingSummary}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard
              title="Total Expenses"
              value={summary ? formatCurrency(summary.totalExpenses) : '—'}
              loading={loadingSummary}
              icon={<Activity className="w-4 h-4" />}
            />
            <StatCard
              title="Net Balance"
              value={summary ? formatCurrency(summary.netBalance) : '—'}
              loading={loadingSummary}
              icon={<BarChart2 className="w-4 h-4" />}
            />
          </div>

          {/* Income vs Expenses bar chart */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-text-primary">Income vs Expenses</h2>
              <span className="ml-auto text-xs text-muted capitalize">{period}</span>
            </div>
            {loadingTrends ? (
              <div className="h-64 animate-pulse bg-border/30 rounded-xl" />
            ) : (
              <IncomeExpenseBar data={trends ?? []} />
            )}
          </div>

          {/* Trend lines + Net Balance gauge */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-success" />
                <h2 className="text-sm font-semibold text-text-primary">Net Balance Trend</h2>
              </div>
              {loadingTrends ? (
                <div className="h-52 animate-pulse bg-border/30 rounded-xl" />
              ) : (
                <TrendLineChart data={trends ?? []} field="net" />
              )}
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Income/Expense Ratio</h2>
              </div>
              {summary ? (
                <NetBalanceGauge summary={summary} />
              ) : (
                <div className="h-52 animate-pulse bg-border/30 rounded-xl" />
              )}
            </div>
          </div>

          {/* Category pie chart */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-warning" />
              <h2 className="text-sm font-semibold text-text-primary">Expenses by Category</h2>
            </div>
            <div className="max-w-lg mx-auto">
              <CategoryPieChart data={byCategory ?? []} />
            </div>
          </div>
        </div>
      </RoleGate>
    </div>
  );
}
