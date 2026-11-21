import React from 'react';
import { cx } from './cx';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Numeric columns get tabular figures and right alignment. */
  numeric?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  caption?: string;
  className?: string;
}

const alignOf = <T,>(c: Column<T>) => (c.numeric ? 'text-right ih-num' : c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left');

/** Scrolls inside its own frame, so a wide table never widens the page. */
function DataTable<T>({ columns, rows, rowKey, onRowClick, empty, caption, className }: DataTableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  const onKey = (row: T) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick?.(row); }
  };
  return (
    <div className={cx('bg-surface border border-line rounded-ih-lg overflow-x-auto', className)}>
      <table className="w-full border-collapse text-[15px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-paper">
            {columns.map(c => (
              <th key={c.key} scope="col" className={cx('ih-eyebrow text-muted px-4 py-3 border-b border-line whitespace-nowrap', alignOf(c))}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? onKey(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={cx('border-b border-line last:border-b-0', onRowClick && 'cursor-pointer hover:bg-paper')}
            >
              {columns.map(c => (
                <td key={c.key} className={cx('px-4 py-3 align-top', alignOf(c), c.className)}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
