// Picker heading and template follow-up that say which rate book a BQ editor is reading.
import React from 'react';
import { ContractChip, Indicator, Sheet, Button } from '../ui';
import type { ProjectBook } from './useProjectBook';
import type { TemplateMiss } from './bookTemplate';

/** "Pilih item daripada buku kadar" + the contract chip and version the picker reads. */
export const BookPickerHeading: React.FC<{ book: ProjectBook; hint: React.ReactNode; title?: string }> = ({ book, hint, title = 'Pilih item daripada buku kadar' }) => (
  <div className="min-w-0">
    <h3 className="font-bold text-slate-900">{title}</h3>
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1" data-testid="picker-book">
      {book.contract
        ? <ContractChip code={book.contract.code} status={book.contract.status} />
        : <span className="text-xs font-bold text-muted">Pustaka BQ</span>}
      {book.versionNo && <span className="text-xs text-muted ih-num">versi {book.versionNo}</span>}
    </div>
    <p className="mt-1 text-xs text-slate-500 truncate md:overflow-visible md:whitespace-normal">{hint}</p>
  </div>
);

interface TemplateMissSheetProps {
  misses: TemplateMiss[];
  book: ProjectBook;
  onClose: () => void;
}

/** After a template is applied: every line the project's book could not resolve, so none disappears unseen. */
export const TemplateMissSheet: React.FC<TemplateMissSheetProps> = ({ misses, book, onClose }) => (
  <Sheet open={misses.length > 0} onClose={onClose} title={`${misses.length} item templat tiada dalam buku kadar`}
    lead={<Indicator state="TIADA" detail={book.contract ? book.contract.code : undefined} />}
    footer={<Button variant="ink" block onClick={onClose}>Faham</Button>}>
    <p className="text-[15px] text-ink">
      Templat ini merujuk item yang tiada dalam buku kadar kontrak projek. Baris salinan ditambah dengan kadar
      templat dan ditanda; rujukan tanpa salinan tidak dapat ditambah.
    </p>
    <ul className="mt-3 divide-y divide-line border-y border-line" data-testid="template-misses">
      {misses.map((m) => (
        <li key={m.ref} className="py-2.5">
          <p className="text-[15px] text-ink break-words">{m.description}</p>
          <p className="text-[13px] text-muted">{m.kept ? 'Ditambah, kadar templat, ditanda Tiada' : 'Tidak ditambah'} · <span className="ih-num">{m.ref}</span></p>
        </li>
      ))}
    </ul>
  </Sheet>
);
