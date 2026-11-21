import { useMemo } from 'react';
import { POLICY_KEYS, policyAt, type LadPolicy, type LocPolicy, type PolicyRule } from '../../domain/policy';
import { useOrgConfig } from '../../hooks/useOrgConfig';
import { apiService } from '../../services/apiService';
import type { PolicyRuleRecord, Project } from '../../types';
import {
  ALL_DEFAULT_POLICY_RULES, CONFIG_KEYS, DEFAULT_LOGO, DEFAULT_PROFILE, defaultDocTexts,
  type DocTexts, type OrgLogo, type OrgProfile,
} from './orgDefaults';
import { fillTemplate, templateTokens, type TemplateVars, type TextToken } from './template';

export const recordsToRules = (records: PolicyRuleRecord[]): PolicyRule[] =>
  records.map((r) => ({ key: r.key, effective_from: r.effectiveFrom, value: r.value, note: r.note }));

// Server rules win key by key; keys the server has never stored fall back to today's constants.
const mergeRules = (server: PolicyRule[]): PolicyRule[] => {
  const known = new Set(server.map((r) => r.key));
  return [...server, ...ALL_DEFAULT_POLICY_RULES.filter((r) => !known.has(r.key))];
};

/** Everything a printed document needs from Tetapan Organisasi: profile, logo, texts and dated policies. */
export class OrgDocs {
  readonly profile: OrgProfile;
  readonly logo: OrgLogo | null;
  private readonly config: Record<string, unknown>;
  private readonly rules: PolicyRule[];
  private readonly baseVars: TemplateVars;

  constructor(config: Record<string, unknown> = {}, rules: PolicyRule[] = [], baseVars: TemplateVars = {}) {
    this.config = config;
    this.baseVars = baseVars;
    this.profile = { ...DEFAULT_PROFILE, ...((config[CONFIG_KEYS.profile] as Partial<OrgProfile>) ?? {}) };
    const logo = config[CONFIG_KEYS.logo];
    this.logo = logo === undefined ? DEFAULT_LOGO : (logo as OrgLogo | null);
    this.rules = mergeRules(rules);
  }

  /** Same settings, with the project's own fields ({{nama_syarikat}}, {{no_sebutharga}}…) available to every text. */
  forProject(project: Partial<Project>): OrgDocs {
    return new OrgDocs(this.config, this.rules, projectVars(project));
  }

  orgVars(): TemplateVars {
    const p = this.profile;
    return {
      ...this.baseVars,
      nama_organisasi: p.name, NAMA_ORGANISASI: p.name.toUpperCase(), nama_ringkas: p.short, kerajaan: p.government,
      jabatan: p.department, JABATAN: p.department.toUpperCase(), telefon: p.phone, unit_perolehan: p.procurementUnit,
    };
  }

  raw(group: string, field: string): string {
    const saved = this.config[group] as DocTexts | undefined;
    return saved?.[field] ?? defaultDocTexts(group)[field] ?? '';
  }

  text(group: string, field: string, vars: TemplateVars = {}): string {
    return fillTemplate(this.raw(group, field), { ...this.orgVars(), ...vars });
  }

  tokens(group: string, field: string, vars: TemplateVars = {}): TextToken[] {
    return templateTokens(this.raw(group, field), { ...this.orgVars(), ...vars });
  }

  /** A policy value on a date; before the first recorded rule the earliest value applies. */
  number(key: string, isoDate: string): number {
    const day = (isoDate || new Date().toISOString()).slice(0, 10);
    let value = policyAt(this.rules, key, day);
    if (value === undefined) {
      const earliest = this.rules.filter((r) => r.key === key).sort((a, b) => a.effective_from.localeCompare(b.effective_from))[0];
      value = earliest?.value;
    }
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error(`Peraturan ${key} tiada nilai pada ${day}`);
    return n;
  }

  ladPolicy(isoDate: string): LadPolicy & { blrPct: number } {
    const blrPct = this.number(POLICY_KEYS.ladBlrPct, isoDate);
    return {
      blrPct,
      smallProjectThreshold: this.number(POLICY_KEYS.ladSmallThreshold, isoDate),
      smallProjectDailyRate: this.number(POLICY_KEYS.ladSmallDailyRate, isoDate),
      annualRatePct: blrPct - this.number(POLICY_KEYS.ladTreasuryPct, isoDate),
    };
  }

  locPolicy(isoDate: string): LocPolicy {
    return { graceDays: this.number(POLICY_KEYS.locGraceDays, isoDate), dailyRate: this.number(POLICY_KEYS.locDailyRate, isoDate) };
  }
}

const projectVars = (p: Partial<Project>): TemplateVars => ({
  nama_syarikat: (p.namaSyarikat ?? '').toUpperCase(),
  no_sebutharga: p.noSebutharga ?? '',
  no_fail: p.noFail ?? '',
  nama_projek: (p.namaProjek ?? '').toUpperCase(),
});

const CACHE_MS = 30_000;
let cache: { at: number; docs: Promise<OrgDocs> } | null = null;

/** Non-React loader for the PDF exporters. Falls back to today's values when the API is unreachable. */
export function loadOrgDocs(): Promise<OrgDocs> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.docs;
  const docs = Promise.all([apiService.getOrgConfig(), apiService.getPolicies()])
    .then(([config, policies]) => new OrgDocs(config, recordsToRules(policies)))
    .catch(() => new OrgDocs());
  cache = { at: Date.now(), docs };
  return docs;
}

/** Same object for React previews, so the preview and the PDF read identical values. */
export function useOrgDocs(project?: Partial<Project>): { docs: OrgDocs; ready: boolean } {
  const { config, policies, isLoading } = useOrgConfig();
  const docs = useMemo(() => {
    const base = new OrgDocs(config, recordsToRules(policies));
    return project ? base.forProject(project) : base;
  }, [config, policies, project]);
  return { docs, ready: !isLoading };
}
