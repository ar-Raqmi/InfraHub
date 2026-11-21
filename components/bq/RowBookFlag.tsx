// Row indicator for a BQ line whose source in the project's contract book has changed or gone, plus the
// explicit decision sheet. Nothing changes unless the officer picks "Guna kadar baharu".
import React, { useState } from 'react';
import { Button, ContractChip, DiffRow, Indicator, Sheet, type IndicatorState } from '../ui';
import { findSource, type BookIndex, type BookRow } from '../../domain/rateBook/rows';
import { rowStatus } from '../../domain/rateBook/rowStatus';
import type { BookDecision, BQItem, Contract } from '../../types';
import { apiService } from '../../services/apiService';

export interface RowBookCheck {
  state: IndicatorState;
  source: BookRow | undefined;
}

/** The indicator state of one BQ row against the book, or null when the row matches (or is not from a book). */
export function checkRow(item: BQItem, index: BookIndex): RowBookCheck | null {
  const status = rowStatus(item, index);
  if (status === 'OK') return null;
  return { state: status, source: findSource(index, item.sourceItemId!, item.sourceVariantId) };
}

const wordingOf = (row: BookRow): string => (row.variantId ? row.label ?? '' : row.itemDescription);

/** Updates that "Guna kadar baharu" applies to the row: book rate, unit and wording, amount recomputed. */
export function newRateUpdates(item: BQItem, source: BookRow, contract: Contract, versionNo: number | null): Partial<BQItem> {
  const description = wordingOf(source);
  const bookDecision: BookDecision = {
    choice: 'BAHARU',
    at: new Date().toISOString(),
    by: apiService.getCurrentUser()?.fullName ?? null,
    contractCode: contract.code,
    versionNo,
    from: { rate: Number(item.rate) || 0, unit: item.unit, description: item.description },
    to: { rate: source.rate, unit: source.unit, description },
  };
  const updates: Partial<BQItem> & { bookDecision: BookDecision } = {
    rate: source.rate,
    unit: source.unit,
    description,
    amount: parseFloat(((Number(item.qty) || 0) * source.rate).toFixed(2)),
    sourceGroupId: source.groupId,
    bookDecision,
  };
  return updates;
}

const DETAIL: Record<IndicatorState, string> = {
  KADAR_BERUBAH: 'Kadar baris ini berbeza daripada buku kadar semasa kontrak projek.',
  PERKATAAN_BERUBAH: 'Perkataan atau unit baris ini berbeza daripada buku kadar semasa. Kadarnya sama.',
  TIADA: 'Item ini sudah tiada dalam buku kadar semasa kontrak projek. Baris kekal dengan kadar asalnya.',
};

interface RowBookFlagProps {
  item: BQItem;
  check: RowBookCheck;
  contract: Contract;
  versionNo: number | null;
  readOnly: boolean;
  /** When set, the decision is also written to the project's change log. */
  projectId?: number;
  onApply: (updates: Partial<BQItem>) => void;
}

const RowBookFlag: React.FC<RowBookFlagProps> = ({ item, check, contract, versionNo, readOnly, projectId, onApply }) => {
  const [open, setOpen] = useState(false);
  const { state, source } = check;
  const useNew = () => {
    if (!source) return;
    const updates = newRateUpdates(item, source, contract, versionNo);
    onApply(updates);
    if (projectId) {
      apiService.logProjectEvent(projectId, {
        action: 'row-rate',
        message: `Guna kadar baharu: ${item.description.slice(0, 80)}`,
        diff: { itemId: item.id, ...updates.bookDecision },
      }).catch(() => { /* the decision is still kept on the row (bookDecision) */ });
    }
    setOpen(false);
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} data-testid="row-book-flag" data-state={state}
        className="inline-flex items-center min-h-11 md:min-h-0 -my-1 rounded-ih-sm focus-visible:outline-2 focus-visible:outline-emerald"
        aria-label={`Semak baris: ${state}`}>
        <Indicator state={state} detail={source && state === 'KADAR_BERUBAH' ? `kini RM ${source.rate.toFixed(2)}` : undefined} />
      </button>
      <Sheet open={open} title="Baris ini berbeza daripada buku kadar" onClose={() => setOpen(false)} lead={<Indicator state={state} />}
        footer={(
          <div className="flex flex-col gap-2">
            <Button variant="ink" size="lg" block onClick={() => setOpen(false)} hint="Tiada perubahan pada BQ. Ini pilihan lalai.">Kekal kadar kontrak</Button>
            {!readOnly && source && (
              <Button variant="outline" size="lg" block onClick={useNew} hint="Kadar, unit dan perkataan baris ini dikemas kini. Keputusan direkod dengan nama dan tarikh anda.">
                Guna kadar baharu
              </Button>
            )}
          </div>
        )}>
        <p className="text-[15px] text-ink">{DETAIL[state]}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>Buku kadar:</span>
          <ContractChip code={contract.code} status={contract.status} />
          {versionNo && <span className="ih-num">versi {versionNo}</span>}
        </div>
        <div className="mt-2 border-t border-line">
          <DiffRow
            className="md:!grid-cols-1"
            code={source?.code}
            description={source ? wordingOf(source) : item.description}
            oldDescription={item.description}
            unit={source?.unit ?? item.unit}
            oldRate={Number(item.rate) || 0}
            newRate={source ? source.rate : null}
          />
        </div>
        <p className="mt-2 text-[13px] text-muted">Kiri: kadar dalam BQ projek ini. Kanan: kadar dalam buku kadar semasa.</p>
      </Sheet>
    </>
  );
};

export default RowBookFlag;
