import React, { useMemo, useState } from 'react';
import { BookOpen, Copy, FilePlus2, Users, FolderKanban } from 'lucide-react';
import { Button, Card, Chip, ContractChip, EmptyState, SectionHeader, Tabs } from '../ui';
import type { Contract, ContractStatus } from '../../types';
import { KIND_LABEL, shortDate, validity } from './format';
import { SearchField } from './bits';
import { cx } from '../ui/cx';

type StatusFilter = 'ALL' | ContractStatus;
type KindFilter = 'ALL' | Contract['kind'];

const STATUS_ORDER: Record<ContractStatus, number> = { AKTIF: 0, DRAF: 1, DITUTUP: 2 };

interface Props {
  contracts: Contract[];
  isLoading: boolean;
  onOpen: (c: Contract) => void;
  onCreate: (cloneFrom?: Contract) => void;
}

function lifeLine(c: Contract): string {
  if (c.status === 'AKTIF') return `Aktif sejak ${shortDate(c.activatedAt)}`;
  if (c.status === 'DITUTUP') return `Ditutup ${shortDate(c.closedAt)}`;
  return `Draf · dicipta ${shortDate(c.createdAt)}`;
}

const RAIL_DOT: Record<ContractStatus, string> = {
  AKTIF: 'bg-kontrak ring-kontrak-tint',
  DRAF: 'bg-surface border-2 border-kontrak-soft ring-surface',
  DITUTUP: 'bg-[#9C97B8] ring-surface',
};

const ContractRow: React.FC<{ c: Contract; last: boolean; onOpen: () => void }> = ({ c, last, onOpen }) => (
  <li className="relative flex gap-3 md:gap-4">
    {!last && <span className="absolute left-[9px] top-7 bottom-0 w-0.5 bg-line" aria-hidden />}
    <span className={cx('relative mt-6 w-5 h-5 shrink-0 rounded-full ring-4', RAIL_DOT[c.status])} aria-hidden />
    <button
      type="button"
      onClick={onOpen}
      data-testid="contract-row"
      data-code={c.code}
      className={cx(
        'flex-1 min-w-0 mb-3 text-left rounded-ih-lg border p-4 md:p-5 transition-colors',
        c.status === 'AKTIF' ? 'bg-surface border-kontrak-line hover:border-kontrak' : 'bg-surface border-line hover:border-line-strong',
        c.status === 'DITUTUP' && 'bg-paper',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ContractChip code={c.code} status={c.status} />
        <Chip tone="neutral">{KIND_LABEL[c.kind]}</Chip>
        {c.stats?.currentVersion != null && <Chip tone="kontrak">Buku v{c.stats.currentVersion}</Chip>}
      </div>
      <p className="mt-2 font-display font-bold text-[18px] text-ink leading-snug break-words">{c.title}</p>
      <p className="text-sm text-muted mt-0.5 ih-num">{validity(c)} · {lifeLine(c)}</p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div className="flex items-center gap-1.5 min-w-0"><FolderKanban className="w-4 h-4 text-muted shrink-0" aria-hidden /><dt className="sr-only">Projek</dt><dd className="ih-num font-bold text-ink">{c.stats?.projects ?? 0}</dd><span className="text-muted truncate">projek</span></div>
        <div className="flex items-center gap-1.5 min-w-0"><Users className="w-4 h-4 text-muted shrink-0" aria-hidden /><dt className="sr-only">Panel</dt><dd className="ih-num font-bold text-ink">{c.stats?.panelSize ?? 0}</dd><span className="text-muted truncate">syarikat</span></div>
        <div className="flex items-center gap-1.5 min-w-0"><BookOpen className="w-4 h-4 text-muted shrink-0" aria-hidden /><dt className="sr-only">Versi</dt><dd className="ih-num font-bold text-ink">{c.stats?.versions ?? 0}</dd><span className="text-muted truncate">versi</span></div>
      </dl>
    </button>
  </li>
);

const ContractRegister: React.FC<Props> = ({ contracts, isLoading, onOpen, onCreate }) => {
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [kind, setKind] = useState<KindFilter>('ALL');
  const [q, setQ] = useState('');
  const active = contracts.find(c => c.status === 'AKTIF' && c.kind === 'PANEL');

  const counts = useMemo(() => ({
    ALL: contracts.length,
    AKTIF: contracts.filter(c => c.status === 'AKTIF').length,
    DRAF: contracts.filter(c => c.status === 'DRAF').length,
    DITUTUP: contracts.filter(c => c.status === 'DITUTUP').length,
  }), [contracts]);

  const shown = useMemo(() => contracts
    .filter(c => status === 'ALL' || c.status === status)
    .filter(c => kind === 'ALL' || c.kind === kind)
    .filter(c => !q || `${c.code} ${c.title}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')), [contracts, status, kind, q]);

  return (
    <div className="space-y-6">
      <SectionHeader
        level="page"
        eyebrow="Sebutharga"
        title="Kontrak & buku kadar"
        description="Setiap sebutharga membawa buku kadarnya sendiri. Projek baharu memakai kontrak panel yang AKTIF; setiap perubahan direkod seperti komit."
        actions={<>
          {active && <Button variant="outline" icon={Copy} onClick={() => onCreate(active)}>Salin {active.code}</Button>}
          <Button variant="kontrak" icon={FilePlus2} onClick={() => onCreate()} data-testid="new-contract">Kontrak baharu</Button>
        </>}
      />

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <Tabs
          label="Tapis status"
          value={status}
          onChange={id => setStatus(id as StatusFilter)}
          items={[
            { id: 'ALL', label: 'Semua', count: counts.ALL },
            { id: 'AKTIF', label: 'Aktif', count: counts.AKTIF },
            { id: 'DRAF', label: 'Draf', count: counts.DRAF },
            { id: 'DITUTUP', label: 'Ditutup', count: counts.DITUTUP },
          ]}
        />
        <div className="flex gap-2 md:ml-auto">
          <SearchField className="flex-1 md:w-64" label="Cari kod atau tajuk" placeholder="Cari kod atau tajuk" value={q} onChange={setQ} />
          <select aria-label="Jenis kontrak" value={kind} onChange={e => setKind(e.target.value as KindFilter)} className="min-h-12 rounded-ih-md border border-line-strong bg-surface px-3 text-base md:text-[15px] text-ink">
            <option value="ALL">Semua jenis</option>
            <option value="PANEL">Panel</option>
            <option value="STANDALONE">Berasingan</option>
          </select>
        </div>
      </div>

      {isLoading && <p className="text-muted">Memuatkan senarai kontrak…</p>}
      {!isLoading && shown.length === 0 && (
        <EmptyState icon={BookOpen} title="Tiada kontrak dalam tapisan ini" body="Ubah tapisan, atau cipta kontrak baharu dengan memuat naik BQ induk." action={<Button variant="kontrak" icon={FilePlus2} onClick={() => onCreate()}>Kontrak baharu</Button>} />
      )}
      <ol aria-label="Daftar kontrak" className="max-w-4xl">
        {shown.map((c, i) => <ContractRow key={c.id} c={c} last={i === shown.length - 1} onOpen={() => onOpen(c)} />)}
      </ol>
      <Card variant="sunken" className="max-w-4xl text-sm text-ink-soft">
        Satu kontrak panel AKTIF menjadi lalai untuk projek baharu. Kontrak berasingan (standalone) mempunyai kadar dan panel sendiri, biasanya untuk satu projek. Projek yang sudah dilantik tidak berubah kadar apabila versi baharu diterbitkan; projek draf hanya ditanda.
      </Card>
    </div>
  );
};

export default ContractRegister;
