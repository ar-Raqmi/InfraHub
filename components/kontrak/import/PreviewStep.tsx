import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Send } from 'lucide-react';
import { Button, Card, DataTable, StatTile } from '../../ui';
import type { ImportPreview, BillPreview } from './ImporterSession';
import { CardTitle, StepFooter } from '../bits';
import { money } from '../format';

interface Props {
  preview: ImportPreview;
  sending: boolean;
  error: string;
  onBack: () => void;
  onSend: () => void;
}

const WARN_PAGE = 50;

/** Step 3: what the parser found, before anything is sent to the server. */
const PreviewStep: React.FC<Props> = ({ preview, sending, error, onBack, onSend }) => {
  const { book, rows, missingInColumn, bills, rateColumn } = preview;
  const [warnLimit, setWarnLimit] = useState(WARN_PAGE);
  const total = useMemo(() => rows.reduce((n, r) => n + r.rate, 0), [rows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3" data-testid="preview-stats">
        <StatTile value={rows.length} label="Kadar diimport" hint={rateColumn} tone="kontrak" />
        <StatTile value={book.stats.bills} label="Bil" />
        <StatTile value={book.stats.groups} label="Kumpulan" />
        <StatTile value={book.stats.items} label="Item" />
        <StatTile value={book.stats.variants} label="Varian" />
        <StatTile value={book.warnings.length} label="Amaran" tone={book.warnings.length ? 'amber' : 'emerald'} hint={book.warnings.length ? 'Semak di bawah' : 'Tiada amaran'} />
      </div>

      {missingInColumn > 0 && (
        <p role="status" className="flex gap-2 rounded-ih-md border border-amber-line bg-amber-tint px-3 py-2 text-sm text-amber">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          <span><b>{missingInColumn} baris</b> berkadar tidak mempunyai nilai dalam lajur “{rateColumn}” dan tidak akan diimport. Kembali dan pilih lajur lain jika ini tidak dijangka.</span>
        </p>
      )}

      {book.warnings.length > 0 && (
        <Card className="space-y-2">
          <CardTitle>Amaran pembacaan</CardTitle>
          <p className="text-sm text-muted">Setiap amaran menunjukkan helaian dan nombor baris seperti dalam Excel. Baiki fail dan muat naik semula, atau teruskan jika baris itu memang bukan item.</p>
          <ul className="divide-y divide-line" data-testid="parse-warnings">
            {book.warnings.slice(0, warnLimit).map((w, i) => (
              <li key={i} className="py-2 flex gap-3 text-sm"><span className="shrink-0 font-bold text-amber ih-num w-40 truncate">{w.sheet} · baris {w.row}</span><span className="text-ink min-w-0 break-words">{w.message}</span></li>
            ))}
          </ul>
          {book.warnings.length > warnLimit && <Button variant="ghost" size="sm" onClick={() => setWarnLimit(l => l + WARN_PAGE)}>Tunjuk lagi</Button>}
        </Card>
      )}

      <div>
        <CardTitle className="mb-2">Mengikut bil</CardTitle>
        <DataTable<BillPreview>
          rowKey={b => `${b.sheet}-${b.no}-${b.title}`}
          rows={bills}
          columns={[
            { key: 'no', header: 'Bil', render: b => <span className="font-bold text-kontrak ih-num">{b.no}</span> },
            { key: 'title', header: 'Tajuk', render: b => <span className="break-words">{b.title}</span> },
            { key: 'sheet', header: 'Helaian', render: b => <span className="text-muted">{b.sheet}</span> },
            { key: 'rows', header: 'Kadar', numeric: true, render: b => b.rows },
            { key: 'range', header: 'Julat kadar', numeric: true, render: b => (b.rows ? `${money(b.minRate)} – ${money(b.maxRate)}` : '—') },
          ]}
        />
        <p className="text-[13px] text-muted mt-2 ih-num">Jumlah semua kadar (semakan silang dengan Excel): {money(total)}</p>
      </div>

      <StepFooter error={error}
        back={<Button variant="outline" icon={ArrowLeft} onClick={onBack}>Tukar helaian / lajur</Button>}
        next={<Button icon={Send} onClick={onSend} disabled={sending || rows.length === 0} data-testid="send-import">{sending ? 'Memadankan…' : `Padankan ${rows.length} kadar dengan buku semasa`}</Button>} />
    </div>
  );
};

export default PreviewStep;
