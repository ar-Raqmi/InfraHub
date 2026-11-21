import React from 'react';
import { Calculator, Save } from 'lucide-react';
import { formatCurrency } from '../../types';
import { Button, Card, DataTable } from '../ui';
import type { Column } from '../ui';
import type { VoteLine, VoteTotals } from './reportScope';

interface ManualFinancials { outsource?: number; ydp?: number }

interface VoteSummaryProps {
  summary: Record<string, VoteLine>;
  totals: VoteTotals;
  scopeLabel: string;
  costLabel: string;
  /** Financial year whose allocations are compared, or null when the scope spans several years. */
  allocationYear: number | null;
  /** Manual deductions are saved per selected year, so they only apply when the scope is that year. */
  manualEditable: boolean;
  rowFilterNote: string | null;
  manual: ManualFinancials;
  onManualChange: (m: ManualFinancials) => void;
  onSave: () => void;
  saving: boolean;
  getVoteName: (code: string) => string;
}

type Row = { code: string } & VoteLine;

const Total: React.FC<{ label: string; big?: boolean; tone?: string; testId?: string; value?: string; children: React.ReactNode }> = ({ label, big, tone = '', testId, value, children }) => (
  <div className="bg-paper border border-line rounded-ih-md p-3">
    <dt className="ih-eyebrow text-muted">{label}</dt>
    <dd className={`ih-num ${big ? 'font-display font-extrabold text-2xl' : 'font-bold mt-1'} ${tone}`} data-testid={testId} data-value={value}>{children}</dd>
  </div>
);

const money = (v: number | null) => (v === null ? '—' : formatCurrency(v));
// An overspent vote must read as a problem, not as a healthy green balance.
const balanceTone = (v: number | null) => (v !== null && v < 0 ? 'text-danger' : 'text-emerald-deep');

const ManualInput: React.FC<{ id: string; label: string; value?: number; onChange: (v: number) => void }> = ({ id, label, value, onChange }) => (
  <label htmlFor={id} className="flex items-center justify-between gap-3 text-sm">
    <span className="font-bold text-ink">{label}</span>
    <span className="flex items-center gap-2">
      <span className="text-muted font-bold">RM</span>
      <input
        id={id} type="number" inputMode="decimal" placeholder="0.00"
        value={value || ''}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-32 min-h-11 text-base md:text-sm text-right bg-surface border border-line-strong rounded-ih-sm px-3 ih-num font-bold text-ink focus:outline-none focus:border-emerald"
      />
    </span>
  </label>
);

/** "Rumusan kewangan": per-vote allocation vs usage, always labelled with the scope that produced it. */
const VoteSummary: React.FC<VoteSummaryProps> = (props) => {
  const { summary, totals, scopeLabel, costLabel, allocationYear, manualEditable, rowFilterNote, manual, onManualChange, onSave, saving, getVoteName } = props;
  const rows: Row[] = Object.entries(summary).map(([code, line]) => ({ code, ...line }));
  const net = totals.balance === null ? null : totals.balance - (manual.outsource || 0) - (manual.ydp || 0);
  const columns: Column<Row>[] = [
    { key: 'code', header: 'Kod vot', render: r => <span className="font-bold ih-num">{r.code}</span> },
    { key: 'name', header: 'Butiran', render: r => getVoteName(r.code) },
    { key: 'n', header: 'Bil. projek', numeric: true, render: r => r.projectCount },
    { key: 'alloc', header: allocationYear ? `Peruntukan ${allocationYear}` : 'Peruntukan', numeric: true, render: r => money(r.allocated) },
    { key: 'used', header: `Belanja (${costLabel})`, numeric: true, render: r => <span className="text-danger">-{formatCurrency(r.used)}</span> },
    { key: 'bal', header: 'Baki', numeric: true, render: r => <span className={`font-bold ${balanceTone(r.allocated === null ? null : r.allocated - r.used)}`}>{r.allocated === null ? '—' : formatCurrency(r.allocated - r.used)}</span> },
  ];

  return (
    <Card padding="lg" data-testid="vote-summary">
      <header className="flex items-start gap-3 mb-4">
        <span className="w-11 h-11 rounded-ih-md bg-paper-deep border border-line inline-flex items-center justify-center text-ink shrink-0"><Calculator className="w-5 h-5" aria-hidden /></span>
        <div className="min-w-0">
          <h3 className="font-display text-title md:text-display-m text-ink">Rumusan kewangan</h3>
          <p className="text-sm text-muted mt-0.5">Dikira daripada <span className="font-bold text-ink" data-testid="summary-scope">{scopeLabel}</span>.</p>
          {rowFilterNote && <p className="text-[13px] text-muted mt-1">{rowFilterNote}</p>}
          {allocationYear === null && <p className="text-[13px] font-bold text-amber mt-1">Peruntukan vot ialah setahun. Pilih tempoh dalam satu tahun kewangan untuk melihat baki.</p>}
        </div>
      </header>
      <DataTable columns={columns} rows={rows} rowKey={r => r.code} caption="Rumusan kewangan mengikut vot" />
      <dl className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Total label="Projek bervot" big testId="summary-count">{totals.projectCount}</Total>
        <Total label="Peruntukan">{money(totals.allocated)}</Total>
        <Total label="Belanja" tone="text-danger" testId="summary-used" value={totals.used.toFixed(2)}>-{formatCurrency(totals.used)}</Total>
        <Total label="Baki" tone={balanceTone(totals.balance)}>{money(totals.balance)}</Total>
      </dl>
      {manualEditable && (
        <div className="mt-5 pt-4 border-t border-line space-y-3">
          <ManualInput id="tolak-sebutharga" label="Tolak lain-lain (sebutharga)" value={manual.outsource} onChange={v => onManualChange({ ...manual, outsource: v })} />
          <ManualInput id="tolak-ydp" label="Tolak lantikan YDP/TYDP" value={manual.ydp} onChange={v => onManualChange({ ...manual, ydp: v })} />
          <div className="flex items-center justify-between gap-3 bg-emerald-tint border border-emerald-200 rounded-ih-md px-4 py-3">
            <Button variant="ink" size="sm" icon={Save} onClick={onSave} disabled={saving}>Simpan</Button>
            <div className="text-right">
              <p className="ih-eyebrow text-emerald-deep">Baki bersih</p>
              <p className={`font-display font-extrabold text-2xl ih-num ${balanceTone(net)}`}>{money(net)}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default VoteSummary;
