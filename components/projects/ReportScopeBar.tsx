import React from 'react';
import { Check, CalendarRange } from 'lucide-react';
import { Contract } from '../../types';
import { ContractChip, Input } from '../ui';
import { todayIso } from '../dash/worklist';
import { NO_CONTRACT, RANGE_PRESETS, ReportScope, PeriodFilter, presetRange } from './reportScope';

interface ReportScopeBarProps {
  scope: ReportScope;
  onChange: (scope: ReportScope) => void;
  contracts: Contract[];
  /** Whether any project in the data has no sebutharga (offers a "Tiada sebutharga" choice). */
  hasUnbound: boolean;
  year: number;
  label: string;
  count: number;
  idPrefix: string;
}

const segClass = (on: boolean) =>
  `min-h-11 px-4 rounded-ih-sm text-sm font-bold transition-colors ${on ? 'bg-ink text-paper' : 'text-ink hover:bg-paper-deep'}`;

const ContractToggle: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode; testId?: string }> = ({ on, onClick, children, testId }) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    data-testid={testId}
    className={`min-h-11 inline-flex items-center gap-1.5 pl-1.5 pr-2.5 rounded-full border transition-colors ${on ? 'border-kontrak bg-kontrak-tint' : 'border-transparent hover:border-line-strong'}`}
  >
    <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center shrink-0 ${on ? 'bg-kontrak text-white' : 'border border-line-strong bg-surface'}`} aria-hidden>
      {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
    </span>
    {children}
  </button>
);

/** The report scope: sebutharga (multi-select) + Tahun / Semua tahun / Julat tarikh tersuai. */
const ReportScopeBar: React.FC<ReportScopeBarProps> = ({ scope, onChange, contracts, hasUnbound, year, label, count, idPrefix }) => {
  const toggleContract = (id: string) => {
    const ids = scope.contractIds.includes(id) ? scope.contractIds.filter(x => x !== id) : [...scope.contractIds, id];
    onChange({ ...scope, contractIds: ids });
  };
  const setPeriod = (period: PeriodFilter) => onChange({ ...scope, period });
  const range = scope.period.kind === 'RANGE' ? scope.period : null;
  const applyPreset = (id: (typeof RANGE_PRESETS)[number]['id']) => setPeriod({ kind: 'RANGE', ...presetRange(id, year, todayIso()), preset: id });

  return (
    <section className="space-y-4" aria-label="Skop laporan" data-testid="report-scope">
      <div>
        <p className="ih-eyebrow text-muted mb-2">Sebutharga</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" aria-pressed={scope.contractIds.length === 0} onClick={() => onChange({ ...scope, contractIds: [] })} className={`${segClass(scope.contractIds.length === 0)} border border-line-strong`}>
            Semua
          </button>
          {contracts.map(c => (
            <ContractToggle key={c.id} on={scope.contractIds.includes(c.id)} onClick={() => toggleContract(c.id)} testId={`scope-contract-${c.code}`}>
              <ContractChip code={c.code} status={c.status} />
            </ContractToggle>
          ))}
          {hasUnbound && (
            <ContractToggle on={scope.contractIds.includes(NO_CONTRACT)} onClick={() => toggleContract(NO_CONTRACT)}>
              <span className="text-sm font-bold text-muted">Tiada sebutharga</span>
            </ContractToggle>
          )}
        </div>
      </div>

      <div>
        <p className="ih-eyebrow text-muted mb-2">Tempoh (ikut tarikh buka)</p>
        <div className="inline-flex flex-wrap gap-1 p-1 bg-surface border border-line-strong rounded-ih-md" role="group" aria-label="Tempoh">
          <button type="button" aria-pressed={scope.period.kind === 'YEAR'} onClick={() => setPeriod({ kind: 'YEAR' })} className={segClass(scope.period.kind === 'YEAR')}>Tahun {year}</button>
          <button type="button" aria-pressed={scope.period.kind === 'ALL'} onClick={() => setPeriod({ kind: 'ALL' })} className={segClass(scope.period.kind === 'ALL')}>Semua tahun</button>
          <button type="button" aria-pressed={!!range} onClick={() => applyPreset('H1')} className={segClass(!!range)}>
            <CalendarRange className="w-4 h-4 inline -mt-0.5 mr-1.5" aria-hidden />Julat tersuai
          </button>
        </div>
        {range && (
          <div className="mt-3 flex flex-col lg:flex-row lg:items-end gap-3">
            <div className="flex flex-wrap gap-1.5">
              {RANGE_PRESETS.map(p => (
                <button key={p.id} type="button" aria-pressed={range.preset === p.id} onClick={() => applyPreset(p.id)} className={`${segClass(range.preset === p.id)} border border-line-strong`}>{p.label}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-[22rem]">
              <label className="flex flex-col gap-1 text-sm font-bold text-ink" htmlFor={`${idPrefix}-from`}>
                Dari
                <Input id={`${idPrefix}-from`} type="date" value={range.from ?? ''} max={range.to ?? undefined} onChange={e => setPeriod({ kind: 'RANGE', from: e.target.value || null, to: range.to })} />
              </label>
              <label className="flex flex-col gap-1 text-sm font-bold text-ink" htmlFor={`${idPrefix}-to`}>
                Hingga
                <Input id={`${idPrefix}-to`} type="date" value={range.to ?? ''} min={range.from ?? undefined} onChange={e => setPeriod({ kind: 'RANGE', from: range.from, to: e.target.value || null })} />
              </label>
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-muted border-t border-line pt-3" data-testid="scope-label">
        Angka laporan dikira daripada: <span className="font-bold text-ink">{label}</span> · <span className="font-bold text-ink ih-num">{count}</span> projek
      </p>
    </section>
  );
};

export default ReportScopeBar;
