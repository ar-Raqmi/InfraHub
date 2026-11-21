// Placeholder values derived from dated policies, shared by the certificate previews and the PDF exporters
// so both print the same numbers.
import type { LadPolicy, LocPolicy } from '../../domain/policy';
import type { OrgDocs } from './orgDocs';
import type { TemplateVars } from './template';

export const money2 = (n: number): string => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const ladRateText = (dailyRate: number): string => `RM${money2(dailyRate)}`;

export const ladTextVars = (policy: LadPolicy & { blrPct: number }): TemplateVars => ({
  had_lad: money2(policy.smallProjectThreshold),
  kadar_lad_rata: money2(policy.smallProjectDailyRate),
  blr: String(policy.blrPct),
});

export const prestasiCriteria = (org: OrgDocs): string[] =>
  [1, 2, 3, 4, 5, 6].map((i) => org.text('doc.prestasi', `criterion${i}`));

export const locTextVars = (policy: LocPolicy): TemplateVars => ({
  hari_tangguh: policy.graceDays,
  hari_mula_denda: policy.graceDays + 1,
  kadar_loc: money2(policy.dailyRate),
});
