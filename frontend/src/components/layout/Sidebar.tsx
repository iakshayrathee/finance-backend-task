'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart2,
  Radio,
  LogOut,
  Zap,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Role } from '@/types/api.types';
import { Badge } from '@/components/ui/Badge';
import { roleBadgeClass } from '@/utils/roleColors';

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard, minRole: Role.VIEWER  },
  { href: '/records',     label: 'Records',      icon: FileText,        minRole: Role.VIEWER  },
  { href: '/analytics',  label: 'Analytics',    icon: BarChart2,       minRole: Role.VIEWER  },
  { href: '/users',       label: 'Users',        icon: Users,           minRole: Role.ADMIN   },
  { href: '/live',        label: 'Live Monitor', icon: Radio,           minRole: Role.VIEWER  },
];

export function Sidebar() {
  const pathname   = usePathname();
  const { user, logout } = useAuth();
  const { role, hasMinRole } = useRoleAccess();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary">data</p>
          <p className="text-[10px] text-text-muted">Finance Tracker</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, minRole }) => {
          const accessible = hasMinRole(minRole);
          const active     = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={accessible ? href : '#'}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-white'
                  : accessible
                  ? 'text-text-muted hover:bg-white/5 hover:text-text-primary'
                  : 'text-text-muted/40 cursor-not-allowed'
              )}
              aria-disabled={!accessible}
              onClick={(e) => !accessible && e.preventDefault()}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {!accessible && (
                <span className="ml-auto text-[9px] text-text-muted/40 font-mono">LOCKED</span>
              )}
              {href === '/live' && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', roleBadgeClass[role])}>
            {role}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-danger transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
