// Policy rules with effective dates. Values are data (app_config/policy_rules), never constants in callers;
// DEFAULT_POLICY_RULES only seeds a fresh install with the values the code used before v2.

export interface PolicyRule {
  key: string;
  effective_from: string; // YYYY-MM-DD
  value: unknown;
  note?: string | null;
}

export interface LadPolicy {
  smallProjectThreshold: number;
  smallProjectDailyRate: number;
  annualRatePct: number;
}

export interface LocPolicy {
  graceDays: number;
  dailyRate: number;
}

export const POLICY_KEYS = {
  ladSmallThreshold: 'LAD_SMALL_PROJECT_THRESHOLD',
  ladSmallDailyRate: 'LAD_SMALL_PROJECT_DAILY_RATE',
  ladBlrPct: 'LAD_BLR_PCT',
  ladTreasuryPct: 'LAD_TREASURY_PCT',
  locGraceDays: 'LOC_GRACE_DAYS',
  locDailyRate: 'LOC_DAILY_RATE',
  notice1Days: 'NOTIS_PERINGATAN_1_DAYS',
  notice2Days: 'NOTIS_PERINGATAN_2_DAYS',
  notice3Days: 'NOTIS_PERINGATAN_3_DAYS',
  companyCap: 'COMPANY_CAP',
} as const;

const SEED_DATE = '2020-01-01';
const seed = (key: string, value: number, note: string): PolicyRule => ({ key, effective_from: SEED_DATE, value, note });

// Sources: services/finance.ts, ProjectDetail.tsx LoC effect and isCPCBlocked notice offsets, company `limit`.
export const DEFAULT_POLICY_RULES: PolicyRule[] = [
  seed(POLICY_KEYS.ladSmallThreshold, 20000, 'LAD: kontrak di bawah nilai ini guna kadar harian tetap (RM)'),
  seed(POLICY_KEYS.ladSmallDailyRate, 20, 'LAD: kadar harian tetap untuk kontrak kecil (RM/hari)'),
  seed(POLICY_KEYS.ladBlrPct, 6.65, 'LAD: BLR (%)'),
  seed(POLICY_KEYS.ladTreasuryPct, 0.25, 'LAD: kadar perbendaharaan ditolak dari BLR (%)'),
  seed(POLICY_KEYS.locGraceDays, 14, 'LoC: hari tangguh selepas siap sebelum denda'),
  seed(POLICY_KEYS.locDailyRate, 100, 'LoC: denda lewat tuntutan (RM/hari)'),
  seed(POLICY_KEYS.notice1Days, -7, 'Notis Peringatan 1: hari relatif kepada tarikh tamat kontrak'),
  seed(POLICY_KEYS.notice2Days, 7, 'Notis Peringatan 2: hari relatif kepada tarikh tamat kontrak'),
  seed(POLICY_KEYS.notice3Days, 14, 'Notis Peringatan 3: hari relatif kepada tarikh tamat kontrak'),
  seed(POLICY_KEYS.companyCap, 200000, 'Had nilai kerja setiap syarikat panel (RM), amaran sahaja'),
];

export function policyAt(rules: PolicyRule[], key: string, isoDate: string): unknown {
  const day = isoDate.slice(0, 10);
  let best: PolicyRule | undefined;
  for (const rule of rules) {
    if (rule.key !== key || rule.effective_from > day) continue;
    if (!best || rule.effective_from > best.effective_from) best = rule;
  }
  return best?.value;
}

const numberAt = (rules: PolicyRule[], key: string, isoDate: string): number => {
  const value = Number(policyAt(rules, key, isoDate));
  if (!Number.isFinite(value)) throw new Error(`Policy ${key} has no numeric value at ${isoDate}`);
  return value;
};

export function ladPolicyAt(rules: PolicyRule[], isoDate: string): LadPolicy {
  return {
    smallProjectThreshold: numberAt(rules, POLICY_KEYS.ladSmallThreshold, isoDate),
    smallProjectDailyRate: numberAt(rules, POLICY_KEYS.ladSmallDailyRate, isoDate),
    annualRatePct: numberAt(rules, POLICY_KEYS.ladBlrPct, isoDate) - numberAt(rules, POLICY_KEYS.ladTreasuryPct, isoDate),
  };
}

export function locPolicyAt(rules: PolicyRule[], isoDate: string): LocPolicy {
  return {
    graceDays: numberAt(rules, POLICY_KEYS.locGraceDays, isoDate),
    dailyRate: numberAt(rules, POLICY_KEYS.locDailyRate, isoDate),
  };
}

export const DEFAULT_LAD_POLICY: LadPolicy = ladPolicyAt(DEFAULT_POLICY_RULES, SEED_DATE);
export const DEFAULT_LOC_POLICY: LocPolicy = locPolicyAt(DEFAULT_POLICY_RULES, SEED_DATE);
