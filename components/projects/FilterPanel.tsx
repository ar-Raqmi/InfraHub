import React, { useState } from 'react';
import { ArrowDown, ArrowUp, CalendarX, ChevronDown, Eye, EyeOff, Layout, RotateCcw } from 'lucide-react';
import { ProjectStatus, User, VoteDefinition, BP_OPTIONS, ZON_OPTIONS, MUKIM_OPTIONS, getStatusLabel } from '../../types';
import StrictDateInput from '../StrictDateInput';
import { useLookups } from '../../hooks/useOrgConfig';
import { Button, Select } from '../ui';
import type { ColumnDef } from './ProjectsTable';
import type { CostMode } from './reportScope';

export interface RowFilters {
  status: ProjectStatus | 'ALL';
  pja: string;
  zon: string;
  bp: string;
  mukim: string;
  vote: string;
  dateType: string;
  dateStart: string | null;
  dateEnd: string | null;
}

export const DEFAULT_ROW_FILTERS: RowFilters = {
  status: 'ALL', pja: 'ALL', zon: 'ALL', bp: 'ALL', mukim: 'ALL', vote: 'ALL', dateType: 'tarikhBuka', dateStart: null, dateEnd: null,
};

export const DATE_TYPES: [string, string][] = [
  ['tarikhBuka', 'Tarikh Buka'], ['tarikhLantikan', 'Tarikh Lantikan'], ['tarikhMulaKontrak', 'Tarikh Mula Kontrak'],
  ['tarikhTamatKontrak', 'Tarikh Tamat Kontrak'], ['tarikhSiapSebenar', 'Tarikh Siap Sebenar'], ['tarikhTuntutanBayaran', 'Tarikh Tuntutan'],
  ['tarikhHantarKewangan', 'Tarikh Hantar Kewangan'], ['tarikhPadanan', 'Tarikh Padanan'], ['tarikhSerahTapak', 'Tarikh Serah Tapak'],
];

interface FilterPanelProps {
  filters: RowFilters;
  onChange: (f: RowFilters) => void;
  onReset: () => void;
  pjas: User[];
  votes: VoteDefinition[];
  viewMode: 'list' | 'group';
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  onSortKey: (k: string) => void;
  onSortDirection: (d: 'asc' | 'desc') => void;
  columns: ColumnDef[];
  visibleColumns: Record<string, boolean>;
  onVisibleColumns: (v: Record<string, boolean>) => void;
  defaultColumns: Record<string, boolean>;
  costViewMode: CostMode;
  onCostViewMode: (m: CostMode) => void;
  showSiap: boolean;
  onShowSiap: (v: boolean) => void;
  showTuntutan: boolean;
  onShowTuntutan: (v: boolean) => void;
  idPrefix: string;
}

/** BP / Zon / Mukim options come from Tetapan → Organisasi (lookup_values); the old constants only cover loading. */
const useLookupOptions = (list: string, fallback: readonly string[]): { code: string; label: string }[] => {
  const { active, isSuccess } = useLookups(list);
  return isSuccess && active.length > 0 ? active.map(v => ({ code: v.code, label: v.label })) : fallback.map(code => ({ code, label: code }));
};

const dirClass = (on: boolean) => `w-11 h-11 rounded-ih-sm inline-flex items-center justify-center ${on ? 'bg-ink text-paper' : 'text-ink'}`;
const segClass = (on: boolean) => `min-h-11 md:min-h-9 px-3 rounded-ih-sm text-sm font-bold ${on ? 'bg-ink text-paper' : 'text-ink'}`;
const dateClass = 'w-full min-h-12 px-3.5 bg-surface border border-line-strong rounded-ih-md text-base md:text-[15px] text-ink outline-none focus:border-emerald';

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string }> = ({ on, onChange, label }) => (
  <label className="min-h-11 md:min-h-0 flex items-center gap-2 cursor-pointer">
    <span className={`w-10 h-6 rounded-full p-1 transition-colors ${on ? 'bg-emerald' : 'bg-line-strong'}`} aria-hidden>
      <span className={`block w-4 h-4 bg-surface rounded-full transition-transform ${on ? 'translate-x-4' : ''}`} />
    </span>
    <input type="checkbox" className="sr-only" checked={on} onChange={() => onChange(!on)} />
    <span className="text-sm font-bold text-ink">{label}</span>
  </label>
);

/** Row filters (they narrow the visible list only), sort, columns and the Syarikat view options. */
const FilterPanel: React.FC<FilterPanelProps> = (props) => {
  const { filters: f, onChange, onReset, pjas, votes, viewMode, idPrefix } = props;
  const [showColumns, setShowColumns] = useState(false);
  const set = <K extends keyof RowFilters>(k: K, v: RowFilters[K]) => onChange({ ...f, [k]: v });
  const id = (s: string) => `${idPrefix}-${s}`;
  const zonOptions = useLookupOptions('ZON', ZON_OPTIONS);
  const bpOptions = useLookupOptions('BP', BP_OPTIONS);
  const mukimOptions = useLookupOptions('MUKIM', MUKIM_OPTIONS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Tapisan di bawah hanya menapis senarai yang dipaparkan. Rumusan kewangan ikut skop laporan.</p>
        <Button variant="ghost" size="sm" icon={RotateCcw} onClick={onReset} className="shrink-0">Reset semua</Button>
      </div>

      {viewMode === 'list' && (
        <div className="md:hidden">
          <p className="ih-eyebrow text-muted mb-2">Susunan</p>
          <div className="flex gap-2">
            <div className="flex-1"><Select aria-label="Susunan" value={props.sortKey} onChange={e => props.onSortKey(e.target.value)}>
              {props.columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select></div>
            <div className="flex p-0.5 bg-surface border border-line-strong rounded-ih-md shrink-0">
              <button type="button" aria-label="Menaik" aria-pressed={props.sortDirection === 'asc'} onClick={() => props.onSortDirection('asc')} className={dirClass(props.sortDirection === 'asc')}><ArrowUp className="w-4 h-4" /></button>
              <button type="button" aria-label="Menurun" aria-pressed={props.sortDirection === 'desc'} onClick={() => props.onSortDirection('desc')} className={dirClass(props.sortDirection === 'desc')}><ArrowDown className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="ih-eyebrow text-muted mb-2">Tapisan paparan</p>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Select aria-label="Status" id={id('status')} value={f.status} onChange={e => set('status', e.target.value as RowFilters['status'])}>
            <option value="ALL">Semua status</option>
            {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </Select>
          <Select aria-label="PJA" value={f.pja} onChange={e => set('pja', e.target.value)}>
            <option value="ALL">Semua PJA</option>
            {pjas.map(u => <option key={u.id} value={u.id}>{u.username.toUpperCase()}</option>)}
          </Select>
          <Select aria-label="Zon" value={f.zon} onChange={e => set('zon', e.target.value)}>
            <option value="ALL">Semua zon</option>{zonOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
          </Select>
          <Select aria-label="BP" value={f.bp} onChange={e => set('bp', e.target.value)}>
            <option value="ALL">Semua BP</option>{bpOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
          </Select>
          <Select aria-label="Mukim" value={f.mukim} onChange={e => set('mukim', e.target.value)}>
            <option value="ALL">Semua mukim</option>{mukimOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
          </Select>
          <Select aria-label="Vot" value={f.vote} onChange={e => set('vote', e.target.value)}>
            <option value="ALL">Semua vot</option>{votes.map(v => <option key={v.code} value={v.code}>{v.code} - {v.name}</option>)}
          </Select>
        </div>
      </div>

      <div>
        <p className="ih-eyebrow text-muted mb-2">Julat tarikh paparan</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select aria-label="Jenis tarikh" value={f.dateType} onChange={e => set('dateType', e.target.value)}>
            {DATE_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
          <div className="flex items-center gap-2">
            <div className="flex-1"><StrictDateInput name={id('dari')} value={f.dateStart || ''} onChange={e => set('dateStart', e.target.value)} placeholder="Dari (DD/MM/YYYY)" className={dateClass} /></div>
            {(f.dateStart || f.dateEnd) && (
              <button type="button" onClick={() => onChange({ ...f, dateStart: null, dateEnd: null })} title="Kosongkan tarikh" aria-label="Kosongkan tarikh" className="w-11 h-11 inline-flex items-center justify-center text-muted hover:text-danger rounded-ih-md shrink-0">
                <CalendarX className="w-5 h-5" />
              </button>
            )}
          </div>
          <StrictDateInput name={id('hingga')} value={f.dateEnd || ''} onChange={e => set('dateEnd', e.target.value)} placeholder="Hingga (DD/MM/YYYY)" className={dateClass} />
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="border-t border-line pt-5">
          <button type="button" onClick={() => setShowColumns(v => !v)} aria-expanded={showColumns} className="md:hidden w-full min-h-11 px-3 rounded-ih-md bg-surface border border-line-strong flex items-center gap-2 text-sm font-bold text-ink">
            <Layout className="w-4 h-4 text-muted" /> Paparan kolum
            <span className="ml-auto px-2 py-0.5 rounded-full bg-paper-deep text-ink text-xs ih-num">{props.columns.filter(c => props.visibleColumns[c.id]).length} / {props.columns.length}</span>
            <ChevronDown className={`w-4 h-4 text-muted transition-transform ${showColumns ? 'rotate-180' : ''}`} />
          </button>
          <div className={showColumns ? 'mt-3' : 'hidden md:block'}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="ih-eyebrow text-muted">Paparan kolum</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={Eye} onClick={() => props.onVisibleColumns(Object.fromEntries(props.columns.map(c => [c.id, true])))}>Semua</Button>
                <Button variant="outline" size="sm" icon={EyeOff} onClick={() => props.onVisibleColumns(Object.fromEntries(props.columns.map(c => [c.id, false])))}>Kosong</Button>
                <Button variant="outline" size="sm" icon={Layout} onClick={() => props.onVisibleColumns(props.defaultColumns)}>Asal</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1 bg-paper p-3 rounded-ih-lg border border-line">
              {props.columns.map(col => (
                <label key={col.id} className="min-h-11 md:min-h-9 flex items-center gap-2 cursor-pointer px-2 rounded-ih-sm hover:bg-surface select-none">
                  <input type="checkbox" className="w-4 h-4 accent-emerald-600" checked={!!props.visibleColumns[col.id]} onChange={() => props.onVisibleColumns({ ...props.visibleColumns, [col.id]: !props.visibleColumns[col.id] })} />
                  <span className={`text-[13px] font-bold truncate ${props.visibleColumns[col.id] ? 'text-ink' : 'text-muted'}`}>{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'group' && (
        <div className="border-t border-line pt-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="ih-eyebrow text-muted">Paparan kos</span>
            <div className="inline-flex p-0.5 bg-surface border border-line-strong rounded-ih-md">
              {([['contract', 'Harga kontrak'], ['actual', 'Harga akhir'], ['both', 'Semua']] as [CostMode, string][]).map(([m, l]) => (
                <button key={m} type="button" aria-pressed={props.costViewMode === m} onClick={() => props.onCostViewMode(m)} className={segClass(props.costViewMode === m)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="ih-eyebrow text-muted">Tapis projek</span>
            <Toggle on={props.showSiap} onChange={props.onShowSiap} label="Tunjuk projek siap" />
            <Toggle on={props.showTuntutan} onChange={props.onShowTuntutan} label="Tunjuk tuntutan bayaran" />
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
