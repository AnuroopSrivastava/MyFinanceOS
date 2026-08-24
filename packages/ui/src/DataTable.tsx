import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  /** Enable sorting */
  sortable?: boolean;
  /** Enable row hover */
  hoverable?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state action */
  emptyAction?: React.ReactNode;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Custom row className */
  rowClassName?: (row: T) => string;
  /** Striped rows */
  striped?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Show row numbers */
  showRowNumbers?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  if (direction === 'asc') return <ChevronUp size={12} style={{ color: 'var(--accent-1)' }} />;
  if (direction === 'desc') return <ChevronDown size={12} style={{ color: 'var(--accent-1)' }} />;
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      <ChevronUp size={10} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
      <ChevronDown size={10} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
    </span>
  );
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  sortable = true,
  hoverable = true,
  emptyMessage = 'No data available',
  emptyAction,
  onRowClick,
  rowClassName,
  striped = false,
  compact = false,
  showRowNumbers = false,
  className = '',
  style,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      if (aVal === null || aVal === undefined) return 1 * direction;
      if (bVal === null || bVal === undefined) return -1 * direction;
      return (aVal > bVal ? 1 : -1) * direction;
    });
  }, [data, sortConfig, sortable]);

  const handleSort = (key: string) => {
    if (!sortable) return;
    const column = columns.find(c => c.key === key);
    if (!column?.sortable) return;
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (data.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', ...style }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className={`table-responsive neo-inset-well ${className}`} style={{ borderRadius: 'var(--radius-md)', padding: '0.25rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', ...style }}>
      <table className="custom-table" style={{ width: '100%' }}>
        <thead style={{ background: 'var(--bg-secondary)' }}>
          <tr>
            {showRowNumbers && (
              <th scope="col" className="type-label-upper" style={{
                width: '40px',
                padding: compact ? '0.5rem' : '0.85rem 1.25rem',
              }}>#</th>
            )}
            {columns.map((col) => {
              const isSorted = sortConfig?.key === col.key;
              const isSortable = col.sortable && sortable;
              const ariaSortValue = isSorted
                ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending')
                : (isSortable ? 'none' : undefined);

              return (
                <th
                  key={col.key}
                  scope="col"
                  role="columnheader"
                  tabIndex={isSortable ? 0 : undefined}
                  aria-sort={ariaSortValue}
                  className="type-label-upper"
                  style={{
                    textAlign: col.align || 'left',
                    width: col.width,
                    padding: compact ? '0.5rem 0.75rem' : '0.85rem 1.25rem',
                    cursor: isSortable ? 'pointer' : 'default',
                    userSelect: isSortable ? 'none' : 'auto',
                  }}
                  onClick={() => isSortable && handleSort(col.key)}
                  onKeyDown={(e) => {
                    if (isSortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSort(col.key);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                    <span>{col.header}</span>
                    {isSortable && <SortIcon direction={isSorted ? sortConfig.direction : null} />}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={keyExtractor(row)}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                ...(striped && index % 2 === 1 ? { background: 'var(--surface-tint)' } : {}),
              }}
              className={rowClassName ? rowClassName(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              onClick={() => onRowClick?.(row)}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
            >
              {showRowNumbers && (
                <td className="tabular-nums" style={{
                  padding: compact ? '0.5rem' : '0.85rem 1.25rem',
                  color: 'var(--text-muted)',
                  fontSize: compact ? '0.8rem' : 'var(--font-base)',
                }}>
                  {index + 1}
                </td>
              )}
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={col.align === 'right' ? 'tabular-nums' : ''}
                  style={{
                    textAlign: col.align || 'left',
                    padding: compact ? '0.5rem 0.75rem' : '0.85rem 1.25rem',
                    fontSize: compact ? '0.82rem' : 'var(--font-base)',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 'var(--lh-normal)',
                  }}
                >
                  {col.render ? col.render(row, index) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
