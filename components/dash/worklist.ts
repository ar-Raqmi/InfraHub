import { Contract, Project, ProjectStatus } from '../../types';
import { repriceReason as domainRepriceReason } from '../../domain/repricing';

/** Pure "Perlu tindakan" rules for the dashboard. No React, no fetching: inputs in, lists out. */

const DAY_MS = 24 * 60 * 60 * 1000;

const dayValue = (iso?: string | null): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso.slice(0, 10));
  return Number.isNaN(t) ? null : t;
};

export const todayIso = (): string => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });

export const daysBetween = (fromIso?: string | null, toIso?: string | null): number | null => {
  const a = dayValue(fromIso);
  const b = dayValue(toIso);
  return a === null || b === null ? null : Math.round((b - a) / DAY_MS);
};

const isOpen = (status?: string) => !status || status === 'PENDING';

/** The most severe notice still pending (moved unchanged from Dashboard.tsx). */
export function pendingNotice(project: Project, today: string = todayIso()): string | null {
  if (project.status === ProjectStatus.SIAP || project.isTiadaNotisDiperlukan || !project.tarikhTamatKontrak) return null;
  const now = dayValue(project.tarikhPemeriksaan) ?? dayValue(today);
  const tamat = dayValue(project.tarikhTamatKontrak);
  if (now === null || tamat === null) return null;
  if (now >= tamat + 14 * DAY_MS && isOpen(project.notisPeringatan3Status)) return 'Notis Ketiga';
  if (now >= tamat + 7 * DAY_MS && isOpen(project.notisPeringatan2Status)) return 'Notis Kedua';
  if (now >= tamat && isOpen(project.perakuanKerjaTidakSiapStatus)) return 'Kerja Tidak Siap';
  if (now >= tamat - 7 * DAY_MS && isOpen(project.notisPeringatan1Status)) return 'Notis Pertama';
  return null;
}

/** Why a not-yet-awarded project must be re-priced (rule: domain/repricing), or null when its sebutharga is usable. */
export const repriceReason = (project: Project, contractsById: Map<string, Contract>): string | null =>
  domainRepriceReason(project, id => contractsById.get(id)?.status);

export type PaperworkStage = 'TUNTUTAN' | 'KEWANGAN';

export interface PaperworkWait {
  stage: PaperworkStage;
  since: string;
  days: number;
}

/** Site work finished (Siap Sebenar) but the claim or the hand-over to Kewangan is still missing. */
export function paperworkWait(project: Project, today: string = todayIso()): PaperworkWait | null {
  if (project.status === ProjectStatus.SIAP || !project.tarikhSiapSebenar) return null;
  const stage: PaperworkStage | null = !project.tarikhTuntutanBayaran ? 'TUNTUTAN' : !project.tarikhHantarKewangan ? 'KEWANGAN' : null;
  if (!stage) return null;
  const since = stage === 'TUNTUTAN' ? project.tarikhSiapSebenar : project.tarikhTuntutanBayaran!;
  return { stage, since, days: Math.max(0, daysBetween(since, today) ?? 0) };
}

export const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** Median days from Siap Sebenar to Padanan over finished projects: the "usual" paperwork time. */
export const medianPaperworkDays = (projects: Project[]): number | null =>
  median(projects
    .filter(p => p.status === ProjectStatus.SIAP)
    .map(p => daysBetween(p.tarikhSiapSebenar, p.tarikhPadanan))
    .filter((d): d is number => d !== null && d >= 0));

export type WorkKind = 'REPRICE' | 'NOTICE' | 'PAPERWORK';

export interface WorkItem {
  kind: WorkKind;
  project: Project;
  /** Short reason shown under the title. */
  reason: string;
  days?: number;
  contract?: Contract;
}

export interface Worklist {
  reprice: WorkItem[];
  notices: WorkItem[];
  paperwork: WorkItem[];
}

const STAGE_LABEL: Record<PaperworkStage, string> = { TUNTUTAN: 'Belum dituntut', KEWANGAN: 'Belum dihantar ke Kewangan' };

export function buildWorklist(projects: Project[], contracts: Contract[], today: string = todayIso()): Worklist {
  const byId = new Map(contracts.map(c => [c.id, c]));
  const list: Worklist = { reprice: [], notices: [], paperwork: [] };
  for (const project of projects) {
    const why = repriceReason(project, byId);
    if (why) list.reprice.push({ kind: 'REPRICE', project, reason: why, contract: byId.get(project.contractId ?? '') });
    const notice = pendingNotice(project, today);
    if (notice) list.notices.push({ kind: 'NOTICE', project, reason: notice });
    const wait = paperworkWait(project, today);
    if (wait) list.paperwork.push({ kind: 'PAPERWORK', project, reason: STAGE_LABEL[wait.stage], days: wait.days });
  }
  list.paperwork.sort((a, b) => (b.days ?? 0) - (a.days ?? 0));
  return list;
}

export const statusCounts = (projects: Project[]): Record<ProjectStatus, number> => {
  const counts = Object.fromEntries(Object.values(ProjectStatus).map(s => [s, 0])) as Record<ProjectStatus, number>;
  for (const p of projects) if (p.status in counts) counts[p.status] += 1;
  return counts;
};
