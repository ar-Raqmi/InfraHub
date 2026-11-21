import React, { useState } from 'react';
import { ArrowLeft, BookCheck, GitCommitHorizontal, History } from 'lucide-react';
import { Button, Card, Field, StatTile, Timeline } from '../../ui';
import { useChangeLog } from '../../../hooks/useChangeLog';
import type { RateBookVersion } from '../../../types';
import type { Bucket } from './reviewModel';
import { CardTitle, StepFooter } from '../bits';
import { stamp } from '../format';
import { useAction } from '../useAction';

type DiffStats = { unchanged: number; rateChanged: number; wordingChanged: number; added: number; removed: number };

interface Props {
  version: RateBookVersion;
  contractCode: string;
  counts: Record<Bucket, number>;
  pending: number;
  publish: (message: string) => Promise<{ version: RateBookVersion; diff: DiffStats }>;
  onBack: () => void;
  onDone: () => void;
}

const MIN_MESSAGE = 8;

const PublishedEntry: React.FC<{ versionId: string }> = ({ versionId }) => {
  const { data = [] } = useChangeLog({ entity: 'rate_book', entityId: versionId, limit: 10 });
  const items = data.map(e => ({ id: String(e.id), at: stamp(e.at), title: e.message ?? e.action, actor: e.userName ?? undefined, tag: e.action, tone: (e.action === 'publish' ? 'kontrak' : 'neutral') as 'kontrak' | 'neutral' }));
  return items.length ? <div data-testid="publish-changelog"><Timeline items={items} /></div> : <p className="text-sm text-muted">Memuatkan log perubahan…</p>;
};

/** Step 5: name the commit, publish (TERBIT), then show the change-log entry it wrote. */
const PublishStep: React.FC<Props> = ({ version, contractCode, counts, pending, publish, onBack, onDone }) => {
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const { busy, error, run } = useAction();
  const [result, setResult] = useState<{ version: RateBookVersion; diff: DiffStats } | null>(version.status === 'TERBIT' ? { version, diff: ((version.stats ?? {}) as { diff: DiffStats }).diff } : null);
  const tooShort = message.trim().length < MIN_MESSAGE;
  const suggestion = `Kadar baharu ${contractCode} daripada ${version.sourceFile ?? 'Excel'}${version.rateColumn ? ` (${version.rateColumn})` : ''}`;

  const submit = async () => {
    setTouched(true);
    if (tooShort || pending) return;
    const published = await run(() => publish(message.trim()));
    if (published) setResult(published);
  };

  if (result) {
    const d = result.diff;
    return (
      <div className="space-y-5 max-w-4xl" data-testid="publish-result">
        <Card className="border-kontrak-line bg-kontrak-tint space-y-1">
          <p className="ih-eyebrow text-kontrak flex items-center gap-2"><BookCheck className="w-4 h-4" aria-hidden /> Diterbitkan</p>
          <p className="font-display font-extrabold text-display-m text-kontrak">{contractCode} · buku v{result.version.versionNo}</p>
          <p className="text-[15px] text-ink">“{result.version.message}”</p>
          <p className="text-sm text-muted ih-num">{stamp(result.version.publishedAt)}</p>
        </Card>
        {d && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="publish-diff">
            <StatTile value={d.rateChanged} label="Kadar berubah" tone="kontrak" />
            <StatTile value={d.wordingChanged} label="Perkataan berubah" tone="amber" />
            <StatTile value={d.added} label="Ditambah" tone="emerald" />
            <StatTile value={d.removed} label="Dibuang" tone="danger" />
            <StatTile value={d.unchanged} label="Sama" />
          </div>
        )}
        <Card>
          <CardTitle icon={History} className="mb-3">Log perubahan</CardTitle>
          <PublishedEntry versionId={result.version.id} />
        </Card>
        <p className="text-sm text-muted">Projek draf yang memakai item yang berubah atau dibuang akan menunjukkan penanda; kadar mereka tidak ditukar secara senyap. Projek yang sudah dilantik tidak terjejas.</p>
        <Button variant="kontrak" icon={GitCommitHorizontal} onClick={onDone} data-testid="see-versions">Lihat log versi</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Card className="space-y-3">
        <CardTitle>Ringkasan versi baharu</CardTitle>
        <ul className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm ih-num">
          <li><b className="text-lg">{counts.same}</b><br />sama</li>
          <li><b className="text-lg text-kontrak">{counts.rate}</b><br />kadar berubah</li>
          <li><b className="text-lg text-amber">{counts.wording}</b><br />perkataan berubah</li>
          <li><b className="text-lg text-emerald-deep">{counts.new}</b><br />baharu</li>
          <li><b className="text-lg text-danger">{counts.removed}</b><br />dibuang</li>
        </ul>
        <p className="text-sm text-muted">Item yang dipadankan mengekalkan id lama, jadi BQ projek yang memakainya terus terpaut. Versi lama kekal boleh dibaca.</p>
      </Card>
      <Field label="Mesej komit" htmlFor="pub-msg" required error={touched && tooShort ? `Tulis sekurang-kurangnya ${MIN_MESSAGE} aksara: apa yang berubah dan kenapa.` : undefined}
        hint="Contoh: “Kadar baharu panel longkang 2027 (lajur kontraktor), mesyuarat Bil. 9/2026”.">
        <textarea id="pub-msg" rows={3} value={message} onChange={e => setMessage(e.target.value)} data-testid="publish-message"
          className="w-full rounded-ih-md border border-line-strong bg-surface px-3.5 py-2.5 text-base md:text-[15px] text-ink focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/25" />
      </Field>
      {!message && <Button size="sm" variant="ghost" onClick={() => setMessage(suggestion)}>Guna cadangan: “{suggestion}”</Button>}
      {pending > 0 && <p role="status" className="text-sm font-bold text-amber">{pending} padanan masih menunggu keputusan. Kembali ke semakan dahulu.</p>}
      <StepFooter error={error}
        back={<Button variant="outline" icon={ArrowLeft} onClick={onBack}>Kembali ke semakan</Button>}
        next={<Button icon={BookCheck} disabled={busy || pending > 0} onClick={submit} data-testid="publish">{busy ? 'Menerbitkan…' : 'Terbitkan versi'}</Button>} />
    </div>
  );
};

export default PublishStep;
