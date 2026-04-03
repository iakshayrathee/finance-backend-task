'use client';

import { useAuthStore } from '@/stores/authStore';
import { Role } from '@/types/api.types';

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.VIEWER]:  1,
  [Role.ANALYST]: 2,
  [Role.ADMIN]:   3,
};

export function useRoleAccess() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? Role.VIEWER;

  const hasRole = (...allowedRoles: Role[]): boolean =>
    allowedRoles.includes(role);

  const hasMinRole = (minRole: Role): boolean =>
    ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];

  return {
    role,
    isAdmin:   role === Role.ADMIN,
    isAnalyst: role === Role.ANALYST || role === Role.ADMIN,
    isViewer:  true, // all authenticated users at least VIEWER
    hasRole,
    hasMinRole,
  };
}
