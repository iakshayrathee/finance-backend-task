'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { recordsApi } from '@/lib/api/records.api';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { RoleGate } from '@/components/layout/RoleGate';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { useLiveStore } from '@/stores/liveStore';
import { EventType } from '@/types/events.types';
import { Role, TxType } from '@/types/api.types';
import type { FinancialRecord, CreateRecordDto, UpdateRecordDto } from '@/types/api.types';

// ── Form schemas ───────────────────────────────────────────────────────────────
const recordSchema = z.object({
  amount:   z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 150.00)'),
  type:     z.nativeEnum(TxType),
  category: z.string().min(1, 'Category is required'),
  date:     z.string().min(1, 'Date is required'),
  notes:    z.string().optional(),
});
type RecordForm = z.infer<typeof recordSchema>;

// ── Columns ────────────────────────────────────────────────────────────────────
function buildColumns(
  onEdit:   (r: FinancialRecord) => void,
  onDelete: (r: FinancialRecord) => void,
): Array<{ key: string; header: string; render?: (r: FinancialRecord) => React.ReactNode; className?: string }> {
  return [
    {
      key: 'date',
      header: 'Date',
      render: (r) => <span className="text-xs text-muted font-mono">{formatDate(r.date)}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => <span className="text-sm capitalize text-text-primary">{r.category}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => (
        <Badge variant={r.type === TxType.INCOME ? 'success' : 'danger'}>{r.type}</Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right',
      render: (r) => (
        <span className={`text-sm font-semibold font-mono ${r.type === TxType.INCOME ? 'text-success' : 'text-danger'}`}>
          {r.type === TxType.INCOME ? '+' : '-'}{formatCurrency(r.amount)}
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (r) => (
        <span className="text-xs text-muted truncate max-w-[160px] block">{r.notes ?? '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <RoleGate minRole={Role.ANALYST} fallback={null}>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(r); }}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <RoleGate minRole={Role.ADMIN} fallback={null}>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(r); }}>
                <Trash2 className="w-3.5 h-3.5 text-danger" />
              </Button>
            </RoleGate>
          </div>
        </RoleGate>
      ),
    },
  ];
}

// ── Reusable Record Form ───────────────────────────────────────────────────────
function RecordFormFields({
  register,
  errors,
  defaultType,
}: {
  register:    ReturnType<typeof useForm<RecordForm>>['register'];
  errors:      ReturnType<typeof useForm<RecordForm>>['formState']['errors'];
  defaultType?: TxType;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount"
          type="text"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount')}
        />
        <Select
          label="Type"
          error={errors.type?.message}
          options={[
            { value: TxType.INCOME, label: 'Income' },
            { value: TxType.EXPENSE, label: 'Expense' },
          ]}
          {...register('type')}
        />
      </div>
      <Input
        label="Category"
        type="text"
        placeholder="e.g. Salary, Groceries"
        error={errors.category?.message}
        {...register('category')}
      />
      <Input
        label="Date"
        type="date"
        error={errors.date?.message}
        {...register('date')}
      />
      <Input
        label="Notes (optional)"
        type="text"
        placeholder="Optional description"
        error={errors.notes?.message}
        {...register('notes')}
      />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RecordsPage() {
  const qc = useQueryClient();

  // Filters
  const [search,    setSearch]    = useState('');
  const [typeFilter, setTypeFilter] = useState<TxType | ''>('');
  const [page,      setPage]      = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<FinancialRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<FinancialRecord | null>(null);

  // SSE highlight tracking
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const events = useLiveStore((s) => s.events);
  useEffect(() => {
    const latest = events.find(
      (e) => e.type === EventType.RECORD_CREATED || e.type === EventType.RECORD_UPDATED
    );
    if (latest?.payload?.id) {
      const id = String(latest.payload.id);
      setHighlightIds([id]);
      const t = setTimeout(() => setHighlightIds([]), 3000);
      return () => clearTimeout(t);
    }
  }, [events]);

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ['records', { page, search: debouncedSearch, type: typeFilter }],
    queryFn:  () =>
      recordsApi.list({
        page,
        limit:  15,
        search: debouncedSearch || undefined,
        type:   typeFilter || undefined,
      }),
  });

  // Create mutation
  const createForm = useForm<RecordForm>({
    resolver: zodResolver(recordSchema),
    defaultValues: { type: TxType.EXPENSE, date: new Date().toISOString().slice(0, 10) },
  });
  const createMutation = useMutation({
    mutationFn: (dto: CreateRecordDto) => recordsApi.create(dto),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['records'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Record created');
      setCreateOpen(false);
      createForm.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Edit mutation
  const editForm = useForm<RecordForm>({ resolver: zodResolver(recordSchema) });
  const editMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecordDto }) =>
      recordsApi.update(id, dto),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['records'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Record updated');
      setEditRecord(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => recordsApi.delete(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['records'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Record deleted');
      setDeleteRecord(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openEdit = useCallback((r: FinancialRecord) => {
    setEditRecord(r);
    editForm.reset({
      amount:   r.amount,
      type:     r.type,
      category: r.category,
      date:     r.date.slice(0, 10),
      notes:    r.notes ?? '',
    });
  }, [editForm]);

  const columns = buildColumns(openEdit, setDeleteRecord);

  const records    = data?.records    ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Records</h1>
          <p className="text-sm text-muted mt-1">
            {pagination ? `${pagination.total} total transactions` : 'All financial transactions'}
          </p>
        </div>
        <RoleGate minRole={Role.ANALYST} fallback={null}>
          <Button
            variant="primary"
            size="md"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Record
          </Button>
        </RoleGate>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by category or notes…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-base pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as TxType | ''); setPage(1); }}
          className="rounded-lg border border-border bg-surface-2 text-text-primary text-sm px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Types</option>
          <option value={TxType.INCOME}>Income</option>
          <option value={TxType.EXPENSE}>Expense</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <Table<FinancialRecord>
          columns={columns}
          data={records}
          keyExtract={(r) => r.id}
          emptyText={isLoading ? 'Loading…' : 'No records found.'}
          highlightIds={highlightIds}
          highlightColor="green"
        />
        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border">
            <p className="text-xs text-muted">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Record" size="md">
        <form
          onSubmit={createForm.handleSubmit((d) =>
            createMutation.mutate({
              amount:   d.amount,
              type:     d.type,
              category: d.category,
              date:     new Date(d.date).toISOString(),
              notes:    d.notes || undefined,
            })
          )}
          className="space-y-4"
        >
          <RecordFormFields
            register={createForm.register}
            errors={createForm.formState.errors}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editRecord}
        onClose={() => setEditRecord(null)}
        title="Edit Record"
        size="md"
      >
        <form
          onSubmit={editForm.handleSubmit((d) => {
            if (!editRecord) return;
            editMutation.mutate({
              id:  editRecord.id,
              dto: {
                amount:   d.amount,
                type:     d.type,
                category: d.category,
                date:     new Date(d.date).toISOString(),
                notes:    d.notes || null,
              },
            });
          })}
          className="space-y-4"
        >
          <RecordFormFields
            register={editForm.register}
            errors={editForm.formState.errors}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setEditRecord(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={editMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        title="Delete Record"
        size="sm"
      >
        <p className="text-sm text-text-primary mb-1">
          Are you sure you want to delete this record?
        </p>
        <p className="text-xs text-muted mb-6">This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteRecord(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteRecord && deleteMutation.mutate(deleteRecord.id)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
