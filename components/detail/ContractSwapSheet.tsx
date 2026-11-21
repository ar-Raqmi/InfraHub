// "Tukar sebutharga": pick a contract, preview the re-price row by row, then apply. Locked projects (No. Inden
// issued) can still preview; applying needs an explicit, logged "Buka kunci".
import React, { useEffect, useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { Button, ContractChip, DiffRow, Indicator, Sheet, type IndicatorState } from '../ui';
import { cx } from '../ui/cx';
import { useContracts } from '../../hooks/useContracts';
import { apiService, type RepriceResult } from '../../services/apiService';
import type { RepricePlan, RepriceRow } from '../../domain/reprice';
import { normText, normUnit, sameMoney } from '../../domain/rateBook/rows';
import { formatCurrency, type Contract, type Project } from '../../types';

export type RowChange = 'SAME' | 'KADAR' | 'PERKATAAN' | 'TIADA';

/** The re-price plan's CHANGED rows split into a rate change or a wording/unit-only change. */
export function rowChange(row: RepriceRow): RowChange {
  if (row.status === 'MISSING' || !row.to) return 'TIADA';
  if (row.status === 'SAME') return 'SAME';
  if (!sameMoney(row.from.rate, row.to.rate)) return 'KADAR';
  return normText(row.from.description) !== normText(row.to.description) || normUnit(row.from.unit) !== normUnit(row.to.unit) ? 'PERKATAAN' : 'SAME';
}

const INDICATOR: Record<Exclude<RowChange, 'SAME'>, IndicatorState> = { KADAR: 'KADAR_BERUBAH', PERKATAAN: 'PERKATAAN_BERUBAH', TIADA: 'TIADA' };
const ORDER: Record<RowChange, number> = { KADAR: 0, PERKATAAN: 1, TIADA: 2, SAME: 3 };
const STATUS_RANK: Record<Contract['status'], number> = { AKTIF: 0, DRAF: 1, DITUTUP: 2 };

interface ContractSwapSheetProps {
  open: boolean;
  project: Partial<Project>;
  currentContract: Contract | undefined;
  onClose: () => void;
  onApplied: (project: Project) => void;
}

const ContractOption: React.FC<{ contract: Contract; why: string; disabled: boolean; onPick: (c: Contract) => void }> = ({ contract: c, why, disabled, onPick }) => (
  <li>
    <button type="button" disabled={disabled} onClick={() => onPick(c)} data-code={c.code}
      className={cx('w-full min-h-14 text-left px-3 py-2.5 rounded-ih-md border flex flex-col gap-1',
        disabled ? 'border-line bg-paper opacity-70 cursor-not-allowed' : 'border-kontrak-line bg-surface hover:bg-kontrak-tint')}>
      <span className="flex items-center gap-2 min-w-0"><ContractChip code={c.code} status={c.status} /></span>
      <span className="text-[14px] text-ink break-words">{c.title}</span>
      <span className="text-[13px] text-muted">{why}</span>
    </button>
  </li>
);

const ContractSwapSheet: React.FC<ContractSwapSheetProps> = ({ open, project, currentContract, onClose, onApplied }) => {
  const { contracts } = useContracts();
  const [target, setTarget] = useState<Contract | null>(null);
  const [plan, setPlan] = useState<RepricePlan | null>(null);
  const [unlock, setUnlock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = !!(project.noInden ?? '').trim();

  useEffect(() => { if (open) { setTarget(null); setPlan(null); setUnlock(false); setError(null); } }, [open]);

  const sorted = useMemo(() => [...contracts].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.code.localeCompare(b.code)), [contracts]);
  const isChoice = (c: Contract) => c.status === 'AKTIF' && c.id !== currentContract?.id;
  const choices = sorted.filter(isChoice);
  const others = sorted.filter((c) => !isChoice(c));
  const whyOf = (c: Contract): string => {
    if (c.id === currentContract?.id) return 'Sebutharga semasa projek';
    if (c.status === 'DITUTUP') return 'Ditutup: tidak boleh dipilih';
    if (c.status === 'DRAF') return 'Belum aktif';
    return `${c.stats?.projects ?? 0} projek · buku kadar versi ${c.stats?.currentVersion ?? '-'}`;
  };

  const preview = async (c: Contract) => {
    setTarget(c); setPlan(null); setError(null); setBusy(true);
    try {
      const res = await apiService.repriceProject(project.id!, c.id, true) as Extract<RepriceResult, { dryRun: true }>;
      setPlan(res.plan);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const apply = async () => {
    if (!target) return;
    setBusy(true); setError(null);
    try {
      const res = await apiService.repriceProject(project.id!, target.id, false, unlock) as Extract<RepriceResult, { dryRun: false }>;
      // Re-price records the new rates; the swap call records the unlock itself in the change log.
      const saved = locked && unlock ? await apiService.swapProjectContract(project.id!, target.id, true) : res.project;
      onApplied({ ...res.project, ...saved });
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const rows = plan ? [...plan.rows].sort((a, b) => ORDER[rowChange(a)] - ORDER[rowChange(b)]) : [];
  const counts = rows.reduce<Record<RowChange, number>>((acc, r) => ({ ...acc, [rowChange(r)]: acc[rowChange(r)] + 1 }), { SAME: 0, KADAR: 0, PERKATAAN: 0, TIADA: 0 });
  const delta = plan ? plan.totals.after - plan.totals.before : 0;

  const footer = plan && target ? (
    <div className="flex flex-col gap-2">
      {locked && !unlock && (
        <Button variant="danger" block icon={Lock} onClick={() => setUnlock(true)} data-testid="swap-unlock">Buka kunci untuk projek ini</Button>
      )}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { setTarget(null); setPlan(null); }}>Kembali</Button>
        <Button variant="primary" block disabled={busy || (locked && !unlock)} onClick={apply} data-testid="swap-apply">
          {busy ? 'Menyimpan…' : `Guna ${target.code}`}
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <Sheet open={open} onClose={onClose} title={target ? `Harga semula ke ${target.code}` : 'Tukar sebutharga'} footer={footer}>
      {locked && (
        <div className="mb-3 flex gap-2 p-3 rounded-ih-md border border-amber-line bg-amber-tint text-[14px] text-ink" data-testid="swap-locked">
          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-amber" />
          <p>
            Kontrak projek ini dikunci kerana No. Inden <b className="ih-num">{project.noInden}</b> telah dikeluarkan.
            {unlock ? ' Kunci akan dibuka dan direkod dalam log dengan nama dan tarikh anda.' : ' Anda boleh melihat pratonton; untuk menukar, buka kunci dahulu (direkod dalam log).'}
          </p>
        </div>
      )}
      {error && <p className="mb-3 text-[14px] text-danger" role="alert">{error}</p>}
      {!target && (
        <>
          <p className="text-[15px] text-muted mb-3">Pilih sebutharga yang akan menentukan kadar projek ini. Anda akan nampak perbezaan setiap baris sebelum apa-apa berubah.</p>
          <ul className="flex flex-col gap-2" data-testid="swap-contracts">
            {choices.map((c) => <ContractOption key={c.id} contract={c} why={whyOf(c)} disabled={false} onPick={preview} />)}
            {choices.length === 0 && <li className="text-[15px] text-muted">Tiada sebutharga AKTIF lain untuk dipilih.</li>}
          </ul>
          {others.length > 0 && (
            <>
              <button type="button" onClick={() => setShowOthers(!showOthers)} aria-expanded={showOthers}
                className="mt-3 w-full min-h-11 text-left text-[14px] font-bold text-muted underline underline-offset-4">
                {showOthers ? 'Sembunyikan' : 'Tunjuk'} {others.length} sebutharga yang tidak boleh dipilih
              </button>
              {showOthers && (
                <ul className="mt-2 flex flex-col gap-2">
                  {others.map((c) => <ContractOption key={c.id} contract={c} why={whyOf(c)} disabled onPick={preview} />)}
                </ul>
              )}
            </>
          )}
        </>
      )}
      {target && busy && !plan && <p className="text-[15px] text-muted">Mengira harga semula…</p>}
      {plan && (
        <div data-testid="reprice-preview">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-3 rounded-ih-md bg-paper border border-line">
              <p className="ih-eyebrow text-muted">Sebelum</p>
              <p className="text-lg font-bold ih-num" data-testid="reprice-before">{formatCurrency(plan.totals.before)}</p>
            </div>
            <div className="p-3 rounded-ih-md bg-kontrak-tint border border-kontrak-line">
              <p className="ih-eyebrow text-kontrak">Selepas</p>
              <p className="text-lg font-bold ih-num" data-testid="reprice-after">{formatCurrency(plan.totals.after)}</p>
            </div>
          </div>
          <p className="text-[14px] text-ink mb-2 ih-num" data-testid="reprice-counts">
            {counts.KADAR} kadar berubah · {counts.PERKATAAN} perkataan berubah · {counts.TIADA} tiada · {counts.SAME} sama
            {delta !== 0 && <> · beza <b>{delta > 0 ? '+' : '−'}{formatCurrency(Math.abs(delta))}</b></>}
          </p>
          {counts.TIADA > 0 && <p className="text-[13px] text-muted mb-2">Baris yang tiada dalam buku baharu kekal dengan kadar lama dan akan ditanda.</p>}
          <div className="border-t border-line">
            {rows.map((r) => {
              const change = rowChange(r);
              return (
                <div key={r.bqItemId} data-change={change} className="border-b border-line last:border-b-0 pt-2">
                  {change !== 'SAME' && <Indicator state={INDICATOR[change]} />}
                  <DiffRow className="border-b-0" description={r.to?.description ?? r.from.description} oldDescription={r.from.description}
                    unit={r.to?.unit ?? r.from.unit} oldRate={r.from.rate} newRate={r.to ? r.to.rate : null} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Sheet>
  );
};

export default ContractSwapSheet;
