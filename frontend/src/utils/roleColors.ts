import type { Role } from '@/types/api.types';

/** Tailwind classes for role badges */
export const roleBadgeClass: Record<Role, string> = {
  ADMIN:   'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  ANALYST: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  VIEWER:  'bg-slate-500/20  text-slate-300  border border-slate-500/30',
};

/** Tailwind text color per role */
export const roleTextClass: Record<Role, string> = {
  ADMIN:   'text-purple-400',
  ANALYST: 'text-indigo-400',
  VIEWER:  'text-slate-400',
};

/** Event type color CSS variables mapped to Tailwind classes */
export const eventColorClass: Record<string, { bg: string; text: string; border: string }> = {
  green:  { bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30' },
  blue:   { bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/30' },
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  red:    { bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/30' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  gray:   { bg: 'bg-slate-500/20',  text: 'text-slate-400',  border: 'border-slate-500/30' },
};
