import React, { useRef } from 'react';
import { Project, formatCurrency } from '../../types';
import { DataTable, StatusPill } from '../ui';
import type { Column } from '../ui';
import { NoticeChip } from './StatusChip';
import { pendingNotice } from './worklist';

interface ActiveProjectsTableProps {
  rows: Project[];
  pjaName?: (p: Project) => string | undefined;
  empty: React.ReactNode;
  onOpen: (p: Project) => void;
  onProgressCommit: (p: Project, value: string) => void;
}

const ProgressInput: React.FC<{ project: Project; onCommit: (v: string) => void }> = ({ project, onCommit }) => (
  <label className="relative inline-block w-24" onClick={e => e.stopPropagation()}>
    <input
      type="number" min="0" max="100" inputMode="numeric"
      aria-label={`Kemajuan ${project.noFail || ''} (%)`}
      defaultValue={project.peratusSiap || 0}
      onBlur={e => onCommit(e.target.value)}
      onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }}
      className="w-full h-10 pl-3 pr-7 text-center bg-paper border border-line-strong rounded-ih-sm text-sm font-bold text-ink ih-num outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/25"
    />
    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none">%</span>
  </label>
);

/** Desktop "Projek aktif" table. A press held for 500 ms selects text instead of opening the project. */
const ActiveProjectsTable: React.FC<ActiveProjectsTableProps> = ({ rows, pjaName, empty, onOpen, onProgressCommit }) => {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const longPress = useRef(false);
  const down = () => { longPress.current = false; timer.current = setTimeout(() => { longPress.current = true; }, 500); };
  const up = () => clearTimeout(timer.current);

  const columns: Column<Project>[] = [
    {
      key: 'projek', header: 'Projek', className: 'min-w-[280px]',
      render: p => (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-ink ih-num">{p.noFail || 'Tiada No. Fail'}</span>
            {pjaName?.(p) && <span className="text-xs font-bold text-muted border border-line rounded-ih-sm px-1.5 py-0.5">PJA {pjaName(p)}</span>}
          </div>
          <p className="text-sm text-ink-soft mt-1 leading-snug whitespace-normal">{p.namaProjek}</p>
        </div>
      ),
    },
    { key: 'kontraktor', header: 'Kontraktor', render: p => p.namaSyarikat ? <span className="text-sm font-bold text-ink">{p.namaSyarikat}</span> : <span className="text-sm text-muted italic">Belum dilantik</span> },
    {
      key: 'status', header: 'Status',
      render: p => {
        const notice = pendingNotice(p);
        return <div className="flex flex-col items-start gap-1.5"><StatusPill status={p.status} />{notice && <NoticeChip notice={notice} />}</div>;
      },
    },
    { key: 'kemajuan', header: 'Kemajuan', align: 'center', render: p => <ProgressInput project={p} onCommit={v => onProgressCommit(p, v)} /> },
    { key: 'kos', header: 'Kos (RM)', numeric: true, render: p => <span className="font-bold text-ink">{formatCurrency(p.kosProjek)}</span> },
  ];

  return (
    <div onMouseDown={down} onMouseUp={up} onMouseLeave={up}>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={p => String(p.id)}
        onRowClick={p => { if (!longPress.current) onOpen(p); }}
        empty={empty}
        caption="Projek aktif"
      />
    </div>
  );
};

export default ActiveProjectsTable;
