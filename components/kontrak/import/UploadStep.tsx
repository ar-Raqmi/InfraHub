import React, { useRef, useState } from 'react';
import { AlertTriangle, FileSpreadsheet, Upload } from 'lucide-react';
import { readWorkbook } from '../../../lib/excel/readWorkbook';
import { Card } from '../../ui';
import { ImporterSession } from './ImporterSession';
import { cx } from '../../ui/cx';

interface Props {
  onLoaded: (session: ImporterSession, ms: number) => void;
}

const ACCEPT = '.xls,.xlsx';

/** Step 1: read the master BQ workbook in the browser. Nothing leaves the device until step 3. */
const UploadStep: React.FC<Props> = ({ onLoaded }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  const load = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    if (!/\.xlsx?$/i.test(file.name)) { setError(`${file.name} bukan fail Excel. Pilih fail .xls atau .xlsx.`); return; }
    setBusy(file.name);
    const t0 = performance.now();
    try {
      const session = new ImporterSession(file.name, await readWorkbook(file));
      if (!session.summaries.length) { setError('Tiada baris berkadar dijumpai dalam fail ini. Pastikan ia BQ induk dengan lajur kadar.'); return; }
      onLoaded(session, Math.round(performance.now() - t0));
    } catch {
      setError('Fail tidak dapat dibaca. Jika ia dilindungi kata laluan atau rosak, simpan semula di Excel dan cuba lagi.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <label
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files?.[0]); }}
        className={cx('block cursor-pointer rounded-ih-lg border-2 border-dashed p-8 md:p-12 text-center transition-colors', drag ? 'border-kontrak bg-kontrak-tint' : 'border-line-strong bg-surface hover:border-kontrak')}
      >
        <input ref={input} type="file" accept={ACCEPT} className="sr-only" data-testid="bq-file" onChange={e => load(e.target.files?.[0])} />
        <span className="mx-auto w-14 h-14 rounded-ih-md bg-kontrak-tint text-kontrak flex items-center justify-center"><FileSpreadsheet className="w-7 h-7" aria-hidden /></span>
        <span className="block mt-4 font-display font-bold text-title text-ink">{busy ? `Membaca ${busy}…` : 'Pilih fail BQ induk (.xls / .xlsx)'}</span>
        <span className="block mt-1 text-[15px] text-muted">Seret fail ke sini, atau tekan untuk memilih. Semua helaian dibaca dalam pelayar anda.</span>
        <span className="mt-4 inline-flex items-center gap-2 min-h-11 px-4 rounded-ih-md bg-kontrak text-white font-bold"><Upload className="w-4 h-4" aria-hidden /> Pilih fail</span>
      </label>
      {error && <p role="alert" className="flex gap-2 rounded-ih-md border border-danger-line bg-danger-tint px-3 py-2 text-sm font-bold text-danger"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />{error}</p>}
      <Card variant="sunken" className="text-sm text-ink-soft space-y-1.5">
        <p><b>Kadar dibaca terus daripada sel Excel</b>, tidak dikira semula dan tidak diteka oleh AI.</p>
        <p>Selepas membaca, anda memilih helaian dan lajur kadar, melihat pratonton, kemudian menyemak padanan dengan buku semasa sebelum menerbitkan versi baharu.</p>
      </Card>
    </div>
  );
};

export default UploadStep;
