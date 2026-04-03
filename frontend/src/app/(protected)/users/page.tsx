'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCog, Ban, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '@/lib/api/users.api';
import { useAuthStore } from '@/stores/authStore';
import { useLiveStore } from '@/stores/liveStore';
import { EventType } from '@/types/events.types';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { roleBadgeClass } from '@/utils/roleColors';
import { formatDate } from '@/utils/formatDate';
import { Role, Status } from '@/types/api.types';
import type { SafeUser, UpdateUserDto, CreateUserDto } from '@/types/api.types';

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

const createSchema = z.object({
  name:     z.string().min(1, 'Name is required'),
  email:    z.string().email('Invalid email address'),
  password: strongPassword,
  role:     z.nativeEnum(Role).default(Role.VIEWER),
});
type CreateForm = z.infer<typeof createSchema>;

const editSchema = z.object({
  role:   z.nativeEnum(Role),
  status: z.nativeEnum(Status),
});
type EditForm = z.infer<typeof editSchema>;

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeClass[role]}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant={status === Status.ACTIVE ? 'success' : 'danger'}>
      {status}
    </Badge>
  );
}

const columns = (
  onEdit:       (u: SafeUser) => void,
  onDeactivate: (u: SafeUser) => void,
  currentId:    string,
  liveUserIds:  Set<string>,
) => [
  {
    key: 'name',
    header: 'Name',
    render: (u: SafeUser) => (
      <div className="flex items-center gap-2">
        {liveUserIds.has(u.id) && (
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" title="Active now" />
        )}
        <div>
          <p className="text-sm font-medium text-text-primary">{u.name}</p>
          <p className="text-xs text-muted">{u.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    render: (u: SafeUser) => <RoleBadge role={u.role} />,
  },
  {
    key: 'status',
    header: 'Status',
    render: (u: SafeUser) => <StatusBadge status={u.status} />,
  },
  {
    key: 'createdAt',
    header: 'Joined',
    render: (u: SafeUser) => (
      <span className="text-xs text-muted font-mono">{formatDate(u.createdAt)}</span>
    ),
  },
  {
    key: 'actions',
    header: '',
    render: (u: SafeUser) => (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          title="Edit role/status"
          onClick={(e) => { e.stopPropagation(); onEdit(u); }}
          disabled={u.id === currentId}
        >
          <UserCog className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="Deactivate user"
          onClick={(e) => { e.stopPropagation(); onDeactivate(u); }}
          disabled={u.id === currentId || u.status === Status.INACTIVE}
        >
          <Ban className="w-3.5 h-3.5 text-danger" />
        </Button>
      </div>
    ),
  },
];

export default function UsersPage() {
  const router     = useRouter();
  const qc         = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  // Redirect non-ADMIN
  useEffect(() => {
    if (currentUser && currentUser.role !== Role.ADMIN) {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  // Track "online" users via SSE loggedIn events
  const events = useLiveStore((s) => s.events);
  const [liveUserIds, setLiveUserIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const loginEvent = events.find((e) => e.type === EventType.USER_LOGGED_IN);
    if (loginEvent?.actor && typeof loginEvent.actor === 'object') {
      const id = loginEvent.actor.id;
      setLiveUserIds((prev) => new Set(Array.from(prev).concat([id])));
      const t = setTimeout(() => {
        setLiveUserIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 30_000); // show as "active" for 30s
      return () => clearTimeout(t);
    }
  }, [events]);

  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn:  () => usersApi.list({ page, limit: 20 }),
    enabled:  currentUser?.role === Role.ADMIN,
  });

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) });
  const createMutation = useMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(dto),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
      setShowCreate(false);
      createForm.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Edit modal
  const [editUser, setEditUser] = useState<SafeUser | null>(null);
  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) });
  const editMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) =>
      usersApi.update(id, dto),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
      setEditUser(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openEdit = (u: SafeUser) => {
    setEditUser(u);
    editForm.reset({ role: u.role, status: u.status });
  };

  // Deactivate modal
  const [deactivateUser, setDeactivateUser] = useState<SafeUser | null>(null);
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated');
      setDeactivateUser(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const users      = data?.users      ?? [];
  const pagination = data?.pagination;

  if (!currentUser || currentUser.role !== Role.ADMIN) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Users</h1>
          <p className="text-sm text-muted mt-1">
            {pagination ? `${pagination.total} registered users` : 'Manage all platform users'}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4 mr-1.5" />
          Create User
        </Button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <Table<SafeUser>
          columns={columns(openEdit, setDeactivateUser, currentUser.id, liveUserIds)}
          data={users}
          keyExtract={(u) => u.id}
          emptyText={isLoading ? 'Loading…' : 'No users found.'}
        />
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border">
            <p className="text-xs text-muted">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User" size="sm">
        {editUser && (
          <>
            <p className="text-sm text-muted mb-4">{editUser.name} · {editUser.email}</p>
            <form
              onSubmit={editForm.handleSubmit((d) =>
                editMutation.mutate({ id: editUser.id, dto: d })
              )}
              className="space-y-4"
            >
              <Select
                label="Role"
                options={[
                  { value: Role.VIEWER, label: 'VIEWER' },
                  { value: Role.ANALYST, label: 'ANALYST' },
                  { value: Role.ADMIN, label: 'ADMIN' },
                ]}
                error={editForm.formState.errors.role?.message}
                {...editForm.register('role')}
              />
              <Select
                label="Status"
                options={[
                  { value: Status.ACTIVE, label: 'ACTIVE' },
                  { value: Status.INACTIVE, label: 'INACTIVE' },
                ]}
                error={editForm.formState.errors.status?.message}
                {...editForm.register('status')}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" type="button" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button variant="primary" type="submit" loading={editMutation.isPending}>
                  Save
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* Deactivate Confirm */}
      <Modal open={!!deactivateUser} onClose={() => setDeactivateUser(null)} title="Deactivate User" size="sm">
        <p className="text-sm text-text-primary mb-1">
          Deactivate <strong>{deactivateUser?.name}</strong>?
        </p>
        <p className="text-xs text-muted mb-6">
          The user will no longer be able to log in.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeactivateUser(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deactivateMutation.isPending}
            onClick={() => deactivateUser && deactivateMutation.mutate(deactivateUser.id)}
          >
            Deactivate
          </Button>
        </div>
      </Modal>

      {/* Create User Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); createForm.reset(); }} title="Create User" size="sm">
        <form
          onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}
          className="space-y-4"
        >
          <Input
            label="Full Name"
            type="text"
            placeholder="Jane Doe"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="jane@example.com"
            error={createForm.formState.errors.email?.message}
            {...createForm.register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            error={createForm.formState.errors.password?.message}
            {...createForm.register('password')}
          />
          <Select
            label="Role"
            options={[
              { value: Role.VIEWER,  label: 'VIEWER' },
              { value: Role.ANALYST, label: 'ANALYST' },
              { value: Role.ADMIN,   label: 'ADMIN' },
            ]}
            error={createForm.formState.errors.role?.message}
            {...createForm.register('role')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowCreate(false); createForm.reset(); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
