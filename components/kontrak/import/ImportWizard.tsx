import React, { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../ui';
import { useRateBook, useRateBookImport } from '../../../hooks/useRateBook';
import type { Contract } from '../../../types';
import type { ImporterSession, ImportPreview } from './ImporterSession';
import UploadStep from './UploadStep';
import SheetStep, { type SheetSelection } from './SheetStep';
import PreviewStep from './PreviewStep';
import ReviewStep from './ReviewStep';
import PublishStep from './PublishStep';
import { buildReview } from './reviewModel';
import { errorText } from '../format';
import { cx } from '../../ui/cx';
import { Notice, TextButton } from '../bits';

const STEPS = ['Muat naik', 'Helaian & lajur', 'Pratonton', 'Semak padanan', 'Terbit'];

const StepBar: React.FC<{ current: number }> = ({ current }) => (
  <ol className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Langkah import">
    {STEPS.map((s, i) => (
      <li key={s} aria-current={i === current ? 'step' : undefined}
        className={cx('shrink-0 flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-full border text-sm font-bold',
          i === current ? 'bg-kontrak text-white border-kontrak' : i < current ? 'bg-kontrak-tint text-kontrak border-kontrak-line' : 'bg-surface text-muted border-line')}>
        <span className={cx('w-7 h-7 rounded-full inline-flex items-center justify-center ih-num text-[13px]', i === current ? 'bg-white text-kontrak' : i < current ? 'bg-kontrak text-white' : 'bg-paper-deep')}>{i + 1}</span>
        {s}
      </li>
    ))}
  </ol>
);

interface Props {
  contract: Contract;
  importId: string;
  onExit: () => void;
  onReview: (versionId: string) => void;
  onVersions: () => void;
}

/** Steps 1-3: everything happens in the browser until "Padankan" sends the parsed book. */
const UploadFlow: React.FC<{ contract: Contract; onReview: (vid: string) => void; setStep: (n: number) => void; step: number }> = ({ contract, onReview, setStep, step }) => {
  const { importBook } = useRateBookImport(contract.id, null);
  const [session, setSession] = useState<ImporterSession | null>(null);
  const [readMs, setReadMs] = useState(0);
  const [sel, setSel] = useState<SheetSelection | undefined>();
  const [error, setError] = useState('');
  const preview: ImportPreview | null = useMemo(() => (session && sel ? session.preview(sel.sheets, sel.rateColumn) : null), [session, sel]);

  const send = async () => {
    if (!session || !preview) return;
    setError('');
    try {
      const res = await importBook.mutateAsync({ fileName: session.fileName, rateColumn: preview.rateColumn, book: preview.book });
      onReview(res.version.id);
    } catch (err) {
      setError(errorText(err));
    }
  };

  if (step === 0 || !session) return <UploadStep onLoaded={(s, ms) => { setSession(s); setReadMs(ms); setSel(undefined); setStep(1); }} />;
  if (step === 1 || !preview) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted ih-num">{session.fileName} dibaca dalam {(readMs / 1000).toFixed(1)} s. <TextButton onClick={() => setStep(0)}>Tukar fail</TextButton></p>
        <SheetStep session={session} initial={sel} onNext={s => { setSel(s); setStep(2); }} />
      </div>
    );
  }
  return <PreviewStep preview={preview} sending={importBook.isPending} error={error} onBack={() => setStep(1)} onSend={send} />;
};

/** Steps 4-5: review the server's match suggestions for a DRAF version, then publish it. */
const ReviewFlow: React.FC<{ contract: Contract; versionId: string; step: number; setStep: (n: number) => void; onVersions: () => void }> = ({ contract, versionId, step, setStep, onVersions }) => {
  const { detail, decide, publish } = useRateBookImport(contract.id, versionId);
  const baseId = ((detail.data?.version.stats ?? {}) as { baseVersionId?: string | null }).baseVersionId ?? null;
  const base = useRateBook(baseId ? contract.id : null, baseId ?? undefined);
  const model = useMemo(() => (detail.data ? buildReview(detail.data.groups, detail.data.matches, detail.data.removed, base.groups) : null), [detail.data, base.groups]);

  if (detail.error) return <Notice tone="error">{errorText(detail.error)}</Notice>;
  if (!detail.data || !model || (baseId && base.isLoading)) return <p className="text-muted">Memuatkan padanan…</p>;
  const version = detail.data.version;
  if (version.status === 'TERBIT' || step === 4) {
    return <PublishStep version={version} contractCode={contract.code} counts={model.counts} pending={model.pending}
      publish={m => publish.mutateAsync(m)} onBack={() => setStep(3)} onDone={onVersions} />;
  }
  return <ReviewStep model={model} versionId={versionId} decide={decide.mutateAsync} deciding={decide.isPending} onPublish={() => setStep(4)} />;
};

const ImportWizard: React.FC<Props> = ({ contract, importId, onExit, onReview, onVersions }) => {
  const isNew = importId === 'baru';
  const [step, setStep] = useState(isNew ? 0 : 3);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <button type="button" onClick={onExit} className="min-h-11 -ml-1 inline-flex items-center gap-1.5 text-sm font-bold text-kontrak"><ArrowLeft className="w-4 h-4" aria-hidden /> {contract.code}</button>
          <h1 className="font-display font-extrabold text-[2rem] md:text-display-l text-ink leading-tight">Import BQ induk</h1>
          <p className="text-muted">Kadar baharu untuk <b className="text-kontrak">{contract.code}</b>. Versi semasa kekal sehingga anda menerbitkan.</p>
        </div>
        {!isNew && <Button variant="ghost" onClick={onExit}>Simpan & keluar</Button>}
      </div>
      <StepBar current={step} />
      {isNew
        ? <UploadFlow contract={contract} onReview={vid => { setStep(3); onReview(vid); }} step={step} setStep={setStep} />
        : <ReviewFlow contract={contract} versionId={importId} step={step} setStep={setStep} onVersions={onVersions} />}
    </div>
  );
};

export default ImportWizard;
