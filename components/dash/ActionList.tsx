import React, { useState } from 'react';
import { ChevronRight, CheckCircle2, FileClock, BellRing, Scale } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Project } from '../../types';
import { Card, Chip, ContractChip, EmptyState } from '../ui';
import type { Tone } from '../ui';
import type { WorkItem, Worklist } from './worklist';

interface ActionListProps {
  worklist: Worklist;
  medianPaperworkDays: number | null;
  onOpen: (project: Project) => void;
  pjaName?: (project: Project) => string | undefined;
}

interface GroupDef {
  key: keyof Worklist;
  title: string;
  icon: LucideIcon;
  tone: Tone;
  body: (medianDays: number | null) => string;
}

const GROUPS: GroupDef[] = [
  {
    key: 'reprice', title: 'Perlu harga semula', icon: Scale, tone: 'kontrak',
    body: () => 'Projek belum dilantik ini terikat pada sebutharga yang sudah ditutup atau belum aktif. Tukar ke sebutharga AKTIF dan semak harga sebelum lantikan.',
  },
  {
    key: 'notices', title: 'Notis tertunggak', icon: BellRing, tone: 'danger',
    body: () => 'Tarikh tamat kontrak sudah dekat atau berlalu, dan notis yang sepatutnya belum direkod.',
  },
  {
    key: 'paperwork', title: 'Menunggu kertas kerja', icon: FileClock, tone: 'amber',
    body: (m) => `Kerja tapak sudah siap tetapi tuntutan atau penghantaran ke Kewangan belum direkod.${m !== null ? ` Biasanya ${Math.round(m)} hari dari siap sebenar hingga padanan.` : ''}`,
  },
];

const PREVIEW = 4;

const ItemDetail: React.FC<{ item: WorkItem }> = ({ item }) => {
  if (item.kind === 'REPRICE') {
    return (
      <span className="flex flex-wrap items-center gap-2">
        {item.contract
          ? <ContractChip code={item.contract.code} status={item.contract.status} />
          : <Chip tone="kontrak">Tiada sebutharga</Chip>}
        <span className="text-[13px] font-bold text-amber">{item.reason}</span>
      </span>
    );
  }
  if (item.kind === 'NOTICE') return <Chip tone="danger" dot>{item.reason}</Chip>;
  return <span className="text-[13px] text-muted">{item.reason}</span>;
};

const ItemRow: React.FC<{ item: WorkItem; pja?: string; onOpen: () => void }> = ({ item, pja, onOpen }) => (
  <li>
    <button
      type="button"
      onClick={onOpen}
      data-project-id={item.project.id}
      className="w-full min-h-11 flex items-center gap-3 py-3 text-left hover:bg-paper -mx-2 px-2 rounded-ih-md transition-colors"
    >
      <span className="flex-1 min-w-0">
        <span className="flex items-baseline gap-2 min-w-0">
          <span className="font-bold text-ink ih-num shrink-0">{item.project.noFail || 'Tiada No. Fail'}</span>
          {pja && <span className="text-xs font-bold text-muted shrink-0">{pja}</span>}
        </span>
        <span className="block text-sm text-ink-soft truncate">{item.project.namaProjek || 'Tanpa tajuk'}</span>
        <span className="block mt-1.5"><ItemDetail item={item} /></span>
      </span>
      {item.days !== undefined && (
        <span className="shrink-0 text-right">
          <span className="block font-display font-extrabold text-2xl leading-none ih-num text-amber">{item.days}</span>
          <span className="block text-xs text-muted">hari</span>
        </span>
      )}
      <ChevronRight className="w-5 h-5 text-muted shrink-0" aria-hidden />
    </button>
  </li>
);

const Group: React.FC<{ def: GroupDef; items: WorkItem[]; medianDays: number | null } & Omit<ActionListProps, 'worklist' | 'medianPaperworkDays'>> = ({ def, items, medianDays, onOpen, pjaName }) => {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, PREVIEW);
  const Icon = def.icon;
  return (
    <section data-group={def.key} className="pt-4 first:pt-0">
      <header className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-ink shrink-0" strokeWidth={2.25} aria-hidden />
        <h3 className="font-display text-title text-ink">{def.title}</h3>
        <Chip tone={def.tone} className="ml-auto ih-num">{items.length}</Chip>
      </header>
      <p className="text-[13px] text-muted mt-1">{def.body(medianDays)}</p>
      <ul className="divide-y divide-line mt-1">
        {shown.map(item => (
          <ItemRow key={`${item.kind}-${item.project.id}`} item={item} pja={pjaName?.(item.project)} onOpen={() => onOpen(item.project)} />
        ))}
      </ul>
      {items.length > PREVIEW && (
        <button type="button" onClick={() => setExpanded(v => !v)} className="min-h-11 text-sm font-bold text-emerald-deep">
          {expanded ? 'Tunjuk sedikit' : `Lihat semua ${items.length}`}
        </button>
      )}
    </section>
  );
};

/** "Perlu tindakan": every project that needs someone to act, grouped by what has to happen. */
const ActionList: React.FC<ActionListProps> = ({ worklist, medianPaperworkDays, onOpen, pjaName }) => {
  const groups = GROUPS.filter(g => worklist[g.key].length > 0);
  return (
    <Card padding="lg" aria-labelledby="perlu-tindakan" data-testid="perlu-tindakan">
      <h2 id="perlu-tindakan" className="font-display text-title md:text-display-m font-bold text-ink">Perlu tindakan</h2>
      <p className="text-sm text-muted mt-1 mb-4">Disusun mengikut perkara yang perlu dibuat, bukan mengikut status.</p>
      {groups.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Tiada tindakan tertunggak" body="Semua projek dalam paparan ini sedang bergerak seperti biasa." />
      ) : (
        <div className="divide-y divide-line">
          {groups.map(def => (
            <Group key={def.key} def={def} items={worklist[def.key]} medianDays={medianPaperworkDays} onOpen={onOpen} pjaName={pjaName} />
          ))}
        </div>
      )}
    </Card>
  );
};

export default ActionList;
