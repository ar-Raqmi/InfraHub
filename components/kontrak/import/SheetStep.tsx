import React, { useMemo, useState } from 'react';
import { ArrowRight, Columns3, Layers } from 'lucide-react';
import { Button, Card } from '../../ui';
import type { ImporterSession, SheetChoice } from './ImporterSession';
import { CardTitle } from '../bits';
import { cx } from '../../ui/cx';

export interface SheetSelection {
  sheets: string[];
  rateColumn: string;
}

interface Props {
  session: ImporterSession;
  initial?: SheetSelection;
  onNext: (sel: SheetSelection) => void;
}

const Radio: React.FC<{ checked: boolean; onClick: () => void; title: React.ReactNode; hint?: React.ReactNode; side?: React.ReactNode; testId?: string }> = ({ checked, onClick, title, hint, side, testId }) => (
  <button type="button" role="radio" aria-checked={checked} onClick={onClick} data-testid={testId}
    className={cx('w-full min-h-14 text-left rounded-ih-md border px-4 py-3 flex items-start gap-3 transition-colors', checked ? 'border-kontrak bg-kontrak-tint' : 'border-line-strong bg-surface hover:border-ink')}>
    <span className={cx('mt-1 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center', checked ? 'border-kontrak' : 'border-line-strong')}>{checked && <span className="w-2.5 h-2.5 rounded-full bg-kontrak" />}</span>
    <span className="flex-1 min-w-0">
      <span className={cx('block font-bold text-[15px] break-words', checked ? 'text-kontrak' : 'text-ink')}>{title}</span>
      {hint && <span className="block text-[13px] text-muted mt-0.5 break-words">{hint}</span>}
    </span>
    {side && <span className="shrink-0 text-right">{side}</span>}
  </button>
);

/** Step 2: which sheets hold the book, and which rate column is the contract rate. */
const SheetStep: React.FC<Props> = ({ session, initial, onNext }) => {
  const choices = session.choices();
  const preset = session.defaultChoice();
  const [mode, setMode] = useState<SheetChoice['id']>(() => (initial ? choices.find(c => c.sheets.join() === initial.sheets.join())?.id ?? 'custom' : preset?.id ?? 'custom'));
  const [custom, setCustom] = useState<string[]>(initial?.sheets ?? preset?.sheets ?? []);
  const sheets = mode === 'custom' ? custom : choices.find(c => c.id === mode)?.sheets ?? [];
  const book = useMemo(() => (sheets.length ? session.parse(sheets) : null), [session, sheets]);
  const columns = book?.rateColumns ?? [];
  const [picked, setPicked] = useState<string | undefined>(initial?.rateColumn);
  const rateColumn = picked && columns.includes(picked) ? picked : session.defaultRateColumn(sheets);

  const toggle = (name: string) => setCustom(cs => (cs.includes(name) ? cs.filter(n => n !== name) : [...cs, name]));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="space-y-3">
        <CardTitle icon={Layers}>Helaian</CardTitle>
        <p className="text-sm text-muted">{session.fileName} · {session.summaries.length} helaian berkadar</p>
        <div role="radiogroup" aria-label="Helaian" className="space-y-2">
          {choices.map(c => (
            <Radio key={c.id} checked={mode === c.id} onClick={() => setMode(c.id)} testId={`sheet-choice-${c.id}`}
              title={c.label} hint={<>{c.hint}<br />Lajur: {c.rateColumns.join(' · ') || '—'}</>}
              side={<><span className="block font-display font-extrabold text-xl text-ink ih-num">{c.pricedRows}</span><span className="text-[12px] text-muted">baris</span></>} />
          ))}
          <Radio checked={mode === 'custom'} onClick={() => setMode('custom')} title="Pilih helaian sendiri" hint="Untuk BQ yang susunannya lain." />
        </div>
        {mode === 'custom' && (
          <ul className="max-h-80 overflow-y-auto rounded-ih-md border border-line divide-y divide-line">
            {session.summaries.map(s => (
              <li key={s.name}>
                <label className="flex items-center gap-3 px-3 min-h-12 cursor-pointer">
                  <input type="checkbox" checked={custom.includes(s.name)} onChange={() => toggle(s.name)} className="w-5 h-5 accent-[#3B2E8C]" />
                  <span className="flex-1 min-w-0 truncate text-[15px] text-ink">{s.name}</span>
                  <span className="text-sm text-muted ih-num">{s.pricedRows} baris · {s.bills} bil</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3">
        <CardTitle icon={Columns3}>Lajur kadar kontrak</CardTitle>
        <p className="text-sm text-muted">Pilih lajur yang menjadi kadar kontrak. Nilainya disalin seperti tertulis dalam sel, tidak dikira semula.</p>
        {columns.length === 0 && <p className="text-sm font-bold text-amber">Pilih sekurang-kurangnya satu helaian berkadar.</p>}
        <div role="radiogroup" aria-label="Lajur kadar" className="space-y-2">
          {columns.map(col => (
            <Radio key={col} checked={rateColumn === col} onClick={() => setPicked(col)} testId="rate-column"
              title={col} hint={/KONTRAKTOR/i.test(col) ? 'Lalai: lajur kontraktor' : undefined} />
          ))}
        </div>
      </Card>

      <div className="lg:col-span-2 flex justify-end">
        <Button icon={ArrowRight} disabled={!sheets.length || !rateColumn} onClick={() => onNext({ sheets, rateColumn: rateColumn! })} data-testid="to-preview">Pratonton</Button>
      </div>
    </div>
  );
};

export default SheetStep;
