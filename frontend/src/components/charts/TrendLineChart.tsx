'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TrendPoint } from '@/types/api.types';
import { parseCurrency } from '@/utils/formatCurrency';

interface TrendLineChartProps {
  data:  TrendPoint[];
  field?: 'income' | 'expenses' | 'net';
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-2xl text-xs">
      <p className="font-medium text-text-primary mb-1">{label}</p>
      <p className="text-indigo-400">${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
    </div>
  );
};

export function TrendLineChart({ data, field = 'net' }: TrendLineChartProps) {
  const chartData = data.map((d) => ({
    period: d.period,
    value:  parseCurrency(d[field]),
  }));

  const isNegative = chartData.some((d) => d.value < 0);
  const color = field === 'income' ? '#22c55e' : field === 'expenses' ? '#ef4444' : '#6366f1';

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id={`gradient-${field}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
        <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          domain={isNegative ? ['auto', 'auto'] : [0, 'auto']}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2a2d3e' }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${field})`}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
