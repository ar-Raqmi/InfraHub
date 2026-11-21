import React, { useMemo, useState } from 'react';
import { Sheet } from '../../ui';
import { normUnit, type BookRow } from '../../../domain/rateBook/rows';
import { describe } from './reviewModel';
import { SearchField } from '../bits';
import { money } from '../format';

interface Props {
  open: boolean;
  target?: BookRow;
  oldRows: BookRow[];
  claims: Map<string, string[]>;
  onClose: () => void;
  onPick: (old: BookRow) => void;
}

const LIMIT = 80;

/** "Pilih item lain": search the current book for the line this new row really continues. */
const OldItemPicker: React.FC<Props> = ({ open, target, oldRows, claims, onClose, onPick }) => {
  const [q, setQ] = useState('');
  const [sameUnit, setSameUnit] = useState(true);
  const rows = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const unit = normUnit(target?.unit);
    return oldRows
      .filter(r => !sameUnit || !target || normUnit(r.unit) === unit)
      .filter(r => terms.every(t => `${r.code ?? ''} ${describe(r)} ${r.groupTitle}`.toLowerCase().includes(t)))
      .slice(0, LIMIT);
  }, [oldRows, q, sameUnit, target]);

  return (
    <Sheet open={open} onClose={onClose} title="Pilih item lama yang sepadan"
      lead={target && <p className="text-sm text-ink-soft rounded-ih-md bg-kontrak-tint border border-kontrak-line px-3 py-2"><b className="text-kontrak">{target.code}</b> {describe(target)} · {target.unit} · {money(target.rate)}</p>}>
      <div className="space-y-3">
        <SearchField label="Cari item lama" placeholder="Cari perkataan atau kod" value={q} onChange={setQ} autoFocus />
        <label className="flex items-center gap-2 min-h-11 text-[15px]">
          <input type="checkbox" checked={sameUnit} onChange={e => setSameUnit(e.target.checked)} className="w-5 h-5 accent-[#3B2E8C]" />
          Unit sama sahaja ({target?.unit || '-'})
        </label>
        <ul className="divide-y divide-line">
          {rows.map(r => {
            const used = claims.get(r.ref)?.length ?? 0;
            return (
              <li key={r.ref}>
                <button type="button" onClick={() => onPick(r)} className="w-full text-left py-3 min-h-11 hover:bg-paper px-1 rounded-ih-sm">
                  <p className="text-[15px] text-ink break-words"><b className="text-kontrak ih-num mr-1.5">{r.code}</b>{describe(r)}</p>
                  <p className="text-[13px] text-muted ih-num mt-0.5">{r.groupTitle} · {r.unit} · {money(r.rate)}{used > 0 && <span className="text-amber font-bold"> · sudah dipadankan</span>}</p>
                </button>
              </li>
            );
          })}
          {rows.length === 0 && <li className="py-4 text-muted text-sm">Tiada item lama sepadan. Cuba buang tanda “Unit sama sahaja”.</li>}
        </ul>
      </div>
    </Sheet>
  );
};

export default OldItemPicker;
