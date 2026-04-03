'use client';

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { parseCurrency } from '@/utils/formatCurrency';
import { formatCurrency } from '@/utils/formatCurrency';
import type { DashboardSummary } from '@/types/api.types';

interface NetBalanceGaugeProps {
  summary: DashboardSummary;
}

export function NetBalanceGauge({ summary }: NetBalanceGaugeProps) {
  const income   = parseCurrency(summary.totalIncome);
  const expenses = parseCurrency(summary.totalExpenses);
  const net      = parseCurrency(summary.netBalance);
  const total    = income + expenses || 1;

  // Income vs Expense ratio for the donut
  const chartData = [
    { name: 'Income',   value: (income / total) * 100,   fill: '#22c55e' },
    { name: 'Expenses', value: (expenses / total) * 100, fill: '#ef4444' },
  ];

  const isPositive = net >= 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} strokeWidth={0} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-xl font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
            {isPositive ? '+' : ''}
            {formatCurrency(net)}
          </span>
          <span className="text-xs text-text-muted mt-1">Net Balance</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="text-center">
          <p className="text-xs text-text-muted">Income</p>
          <p className="text-sm font-semibold text-success">{formatCurrency(income)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-text-muted">Expenses</p>
          <p className="text-sm font-semibold text-danger">{formatCurrency(expenses)}</p>
        </div>
      </div>
    </div>
  );
}
