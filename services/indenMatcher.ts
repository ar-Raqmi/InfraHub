import type { Project } from '../types';
import type { IndenPdfRow } from './indenPdfParser';

export type IndenProject = Pick<Project, 'id' | 'noFail' | 'namaProjek' | 'noInden' | 'namaSyarikat' | 'kosProjek'>;

export type IndenStatus = 'baharu' | 'berbeza' | 'sama' | 'tiada';
export type IndenFlag = 'supplier' | 'amount' | 'duplicateNoPesanan' | 'duplicateNoFail' | 'ambiguousProject';

export interface IndenMatch {
  row: IndenPdfRow;
  project?: IndenProject;
  status: IndenStatus;
  flags: IndenFlag[];
}

const AMOUNT_TOLERANCE = 0.01;

export const normalizeNoFail = (s?: string) => (s || '').replace(/\s+/g, '').toUpperCase();
// Punctuation is dropped too: the PDF says "SDN. BHD." where users type "SDN BHD".
const normalizeName = (s?: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const groupBy = <T>(items: T[], key: (item: T) => string) => {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) || []), item]);
  }
  return map;
};

const statusOf = (project: IndenProject | undefined, noPesanan: string): IndenStatus => {
  if (!project) return 'tiada';
  const current = (project.noInden || '').trim();
  if (!current) return 'baharu';
  return current === noPesanan ? 'sama' : 'berbeza';
};

function mismatchFlags(row: IndenPdfRow, project: IndenProject): IndenFlag[] {
  const flags: IndenFlag[] = [];
  if (normalizeName(row.supplier) !== normalizeName(project.namaSyarikat)) flags.push('supplier');
  if (Math.abs(row.amount - (project.kosProjek || 0)) > AMOUNT_TOLERANCE) flags.push('amount');
  return flags;
}

export function matchIndenRows(rows: IndenPdfRow[], projects: IndenProject[]): IndenMatch[] {
  const projectsByFail = groupBy(projects.filter(p => normalizeNoFail(p.noFail)), p => normalizeNoFail(p.noFail));
  const rowsByFail = groupBy(rows, r => normalizeNoFail(r.noFail));
  const rowsByPesanan = groupBy(rows, r => r.noPesanan);

  return rows.map(row => {
    const candidates = projectsByFail.get(normalizeNoFail(row.noFail)) || [];
    const project = candidates[0];
    const flags: IndenFlag[] = project ? mismatchFlags(row, project) : [];
    // Unmatched rows are informational only, so duplicates there would just be noise.
    if (project) {
      if (candidates.length > 1) flags.push('ambiguousProject');
      if (rowsByPesanan.get(row.noPesanan)!.length > 1) flags.push('duplicateNoPesanan');
      if (rowsByFail.get(normalizeNoFail(row.noFail))!.length > 1) flags.push('duplicateNoFail');
    }
    return { row, project, status: statusOf(project, row.noPesanan), flags };
  });
}

const UNSAFE_FLAGS: IndenFlag[] = ['duplicateNoPesanan', 'duplicateNoFail', 'ambiguousProject'];

// Rows that could write conflicting values to one project are never pre-ticked.
export const isSelectedByDefault = (m: IndenMatch) =>
  m.status === 'baharu' && !m.flags.some(f => UNSAFE_FLAGS.includes(f));

export const INDEN_FLAG_LABEL: Record<IndenFlag, string> = {
  supplier: 'Nama syarikat dalam PDF tidak sama dengan projek',
  amount: 'Jumlah dalam PDF tidak sama dengan Kos Projek',
  duplicateNoPesanan: 'No. Pesanan ini muncul lebih daripada sekali dalam PDF',
  duplicateNoFail: 'No. Fail ini muncul lebih daripada sekali dalam PDF',
  ambiguousProject: 'Lebih daripada satu projek menggunakan No. Fail ini (padanan pertama digunakan)',
};
