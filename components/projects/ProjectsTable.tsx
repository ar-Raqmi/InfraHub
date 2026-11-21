import React from 'react';
import { ArrowUpRight, Trash2 } from 'lucide-react';
import { Contract, Project, User, formatCurrency, formatDate } from '../../types';
import { DataTable, IconButton, StatusPill } from '../ui';
import type { Column } from '../ui';
import PjaAvatar from './PjaAvatar';
import ContractCell from './ContractCell';

export interface ColumnDef { id: string; label: string; group: string; default: boolean }

interface ProjectsTableProps {
  rows: Project[];
  columns: ColumnDef[];
  visible: Record<string, boolean>;
  getPja: (id: number) => User | undefined;
  contractOf: (p: Project) => Contract | undefined;
  repriceOf: (p: Project) => string | null;
  hargaAkhir: (p: Project) => number;
  canDelete: boolean;
  onOpen: (p: Project) => void;
  onDelete: (p: Project) => void;
  onRowMouse: { onMouseDown: () => void; onMouseUp: () => void; onMouseLeave: () => void };
}

type Ctx = Pick<ProjectsTableProps, 'getPja' | 'contractOf' | 'repriceOf' | 'hargaAkhir'>;

const lines = (text: string | undefined, splitter: RegExp | string, max: string) =>
  text ? (
    <div className={`flex flex-col gap-1 ${max} overflow-y-auto custom-scrollbar`}>
      {text.split(splitter).map(s => s.trim()).filter(Boolean).map((s, i) => <span key={i} className="text-[13px] text-ink-soft leading-tight whitespace-pre-wrap">{s}</span>)}
    </div>
  ) : <span className="text-muted">-</span>;

const muted = (v: React.ReactNode) => <span className="text-[13px] text-muted ih-num">{v || '-'}</span>;
const money = (v: number | undefined | null, cls = 'text-ink') => <span className={`text-[13px] font-bold ${cls}`}>{formatCurrency(v ?? 0)}</span>;

const CELLS: Record<string, (p: Project, ctx: Ctx) => React.ReactNode> = {
  noFail: p => <div className="whitespace-nowrap"><div className="font-bold text-ink text-sm ih-num">{p.noFail}</div><div className="text-xs text-muted ih-num mt-0.5">{formatDate(p.tarikhBuka)}</div></div>,
  namaProjek: p => <div className="text-sm text-ink leading-relaxed whitespace-pre-wrap min-w-[280px]">{p.namaProjek}</div>,
  pjaId: (p, c) => { const pja = c.getPja(p.pjaId); return <div className="flex items-center gap-2 whitespace-nowrap"><PjaAvatar pja={pja} /><span className="text-xs font-bold text-ink-soft">{pja?.username?.toUpperCase() || '-'}</span></div>; },
  noAduan: p => lines(p.noAduan, /[,;\n]/, 'max-h-[100px]'),
  lokasi: p => <div className="min-w-[200px]">{lines(p.lokasi, '\n', 'max-h-[150px]')}</div>,
  bp: p => muted(p.bp), zon: p => muted(p.zon), mukim: p => muted(p.mukim),
  tarikhBuka: p => muted(formatDate(p.tarikhBuka)),
  namaSyarikat: p => <div className="min-w-[180px] text-[13px] font-bold text-ink leading-relaxed">{p.namaSyarikat || <span className="text-muted italic font-normal">Belum dilantik</span>}</div>,
  kontrak: (p, c) => <ContractCell contract={c.contractOf(p)} repriceReason={c.repriceOf(p)} project={p} />,
  noVote: p => muted(p.noVote), noSebutharga: p => muted(p.noSebutharga), noInden: p => muted(p.noInden), noBpp: p => muted(p.noBpp),
  tempohKontrak: p => muted(p.tempohKontrak),
  status: p => <div className="flex flex-col items-start gap-1.5 whitespace-nowrap"><StatusPill status={p.status} /><span className="text-xs text-muted ih-num">{Math.round(p.peratusSiap || 0)}% siap</span></div>,
  prestasi: p => <span className="font-bold text-ink">{p.prestasi || '-'}</span>,
  kosProjek: p => money(p.kosProjek, 'text-emerald-deep'),
  kosSebenar: (p, c) => money(c.hargaAkhir(p)),
  wangTahanan: p => money(p.wangTahanan),
  ladAmount: p => money(p.ladAmount, 'text-danger'),
  ladDays: p => muted(p.ladDays || 0),
  locAmount: p => money(p.locAmount, 'text-amber'),
  locDays: p => muted(p.locDays || 0),
  iso: p => muted(p.iso),
};

const NUMERIC = new Set(['kosProjek', 'kosSebenar', 'wangTahanan', 'ladAmount', 'locAmount', 'ladDays', 'locDays']);

const dateCell = (key: keyof Project) => (p: Project) => muted(formatDate(p[key] as string | undefined));

/** Desktop list of projects (DataTable): the visible columns picked in "Paparan kolum". */
const ProjectsTable: React.FC<ProjectsTableProps> = ({ rows, columns, visible, canDelete, onOpen, onDelete, onRowMouse, ...ctx }) => {
  const cols: Column<Project>[] = columns.filter(c => visible[c.id]).map(c => ({
    key: c.id,
    header: c.label,
    numeric: NUMERIC.has(c.id),
    render: p => (CELLS[c.id] ?? dateCell(c.id as keyof Project))(p, ctx),
  }));
  cols.push({
    key: 'actions', header: '', align: 'right',
    render: p => (
      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
        <IconButton icon={ArrowUpRight} label="Buka projek" onClick={() => onOpen(p)} />
        {canDelete && <IconButton icon={Trash2} label="Padam projek" onClick={() => onDelete(p)} className="text-danger hover:text-danger" />}
      </div>
    ),
  });
  return (
    <div {...onRowMouse}>
      <DataTable columns={cols} rows={rows} rowKey={p => String(p.id)} onRowClick={onOpen} caption="Senarai projek"
        empty={<p className="px-6 py-12 text-center text-muted bg-surface border border-line rounded-ih-lg">Tiada projek dijumpai.</p>} />
    </div>
  );
};

export default ProjectsTable;
