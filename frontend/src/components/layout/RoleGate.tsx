'use client';

import { Lock } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Role } from '@/types/api.types';

interface RoleGateProps {
  minRole:   Role;
  children:  React.ReactNode;
  fallback?: React.ReactNode;
  locked?:   boolean;  // true = show locked card, false = render nothing
}

function LockedCard({ minRole, currentRole }: { minRole: Role; currentRole: Role }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface/50 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background">
        <Lock className="h-6 w-6 text-text-muted" />
      </div>
      <div>
        <p className="text-base font-semibold text-text-primary mb-1">Access Restricted</p>
        <p className="text-sm text-text-muted">
          This section requires{' '}
          <span className="font-bold text-primary">{minRole}</span> access or higher.
        </p>
        <p className="text-xs text-text-muted mt-2">
          Your current role: <span className="text-warning">{currentRole}</span>
        </p>
      </div>
    </div>
  );
}

export function RoleGate({ minRole, children, fallback, locked = true }: RoleGateProps) {
  const { hasMinRole, role } = useRoleAccess();

  if (hasMinRole(minRole)) return <>{children}</>;

  if (fallback)  return <>{fallback}</>;
  if (locked)    return <LockedCard minRole={minRole} currentRole={role} />;
  return null;
}
