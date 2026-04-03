'use client';

import { cn } from '@/utils/cn';

interface Column<T> {
  key:       string;
  header:    string;
  render?:   (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns:    Column<T>[];
  data:       T[];
  keyExtract: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  className?: string;
  highlightIds?: string[];
  highlightColor?: 'green' | 'red';
}

export function Table<T>({
  columns,
  data,
  keyExtract,
  onRowClick,
  emptyText = 'No data found.',
  className,
  highlightIds = [],
  highlightColor = 'green',
}: TableProps<T>) {
  const pulseClass = highlightColor === 'green' ? 'animate-pulse-green' : 'animate-pulse-red';

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('px-4 py-3 text-left font-medium text-text-muted', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-text-muted">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const key       = keyExtract(row);
              const highlight = highlightIds.includes(key);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-border/50 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-white/5',
                    highlight && pulseClass
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-text-primary', col.className)}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
