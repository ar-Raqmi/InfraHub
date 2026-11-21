import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Project } from '../../types';
import { Button, Card } from '../ui';
import type { WorkItem, Worklist } from './worklist';

const EYEBROW: Record<WorkItem['kind'], string> = {
  NOTICE: 'Seterusnya · Notis kontrak',
  REPRICE: 'Seterusnya · Harga semula',
  PAPERWORK: 'Seterusnya · Kertas kerja',
};

/** Notices are time-bound, re-pricing blocks the award, paperwork is the longest-waiting claim. */
export const nextItem = (w: Worklist): WorkItem | undefined => w.notices[0] ?? w.reprice[0] ?? w.paperwork[0];

const detail = (item: WorkItem) =>
  item.kind === 'PAPERWORK' ? `${item.reason} · ${item.days} hari` : item.reason;

/** The single ink "do this next" card at the top of the phone's Hari ini screen. */
const NextUpCard: React.FC<{ item: WorkItem; onOpen: (p: Project) => void }> = ({ item, onOpen }) => (
  <Card variant="ink" padding="lg" data-testid="next-up">
    <p className="ih-eyebrow text-emerald-bright">{EYEBROW[item.kind]}</p>
    <h2 className="font-display text-title font-bold mt-2 leading-snug line-clamp-3 [overflow-wrap:anywhere]">{item.project.namaProjek || item.project.noFail}</h2>
    <p className="text-sm text-paper/75 mt-1 ih-num">{item.project.noFail} · {detail(item)}</p>
    <Button variant="primary" size="lg" block icon={ArrowRight} className="mt-4" onClick={() => onOpen(item.project)}>
      Buka projek
    </Button>
  </Card>
);

export default NextUpCard;
