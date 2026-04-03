'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { CategoryBreakdown } from '@/types/api.types';
import { parseCurrency } from '@/utils/formatCurrency';

interface CategoryPieChartProps {
  data: CategoryBreakdown[];
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { total: string } }>;
}) => {
  if (!active || !payload?.[0]) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-2xl text-xs">
      <p className="font-medium text-text-primary">{p.name}</p>
      <p className="text-text-muted">${p.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
    </div>
  );
};

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  // Aggregate expenses by category (sum all expense entries)
  const grouped: Record<string, number> = {};
  data.forEach((d) => {
    if (d.type === 'EXPENSE') {
      grouped[d.category] = (grouped[d.category] ?? 0) + parseCurrency(d.total);
    }
  });

  const chartData = Object.entries(grouped).map(([category, total]) => ({
    name:  category,
    value: total,
    total: total.toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(v: string) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
