import { describe, expect, it } from 'vitest';
import { DEFAULT_POLICY_RULES, ladPolicyAt, locPolicyAt, policyAt, type PolicyRule } from './policy';

const rules: PolicyRule[] = [
  { key: 'LOC_DAILY_RATE', effective_from: '2020-01-01', value: 100 },
  { key: 'LOC_DAILY_RATE', effective_from: '2027-01-01', value: 150 },
  { key: 'LOC_DAILY_RATE', effective_from: '2026-06-01', value: 120 },
  { key: 'LOC_GRACE_DAYS', effective_from: '2020-01-01', value: 14 },
];

describe('policyAt', () => {
  it('picks the latest rule effective on or before the date', () => {
    expect(policyAt(rules, 'LOC_DAILY_RATE', '2026-05-31')).toBe(100);
    expect(policyAt(rules, 'LOC_DAILY_RATE', '2026-06-01')).toBe(120);
    expect(policyAt(rules, 'LOC_DAILY_RATE', '2030-01-01')).toBe(150);
  });

  it('returns undefined before the first rule or for an unknown key', () => {
    expect(policyAt(rules, 'LOC_DAILY_RATE', '2019-12-31')).toBeUndefined();
    expect(policyAt(rules, 'NOPE', '2026-01-01')).toBeUndefined();
  });

  it('accepts full ISO timestamps', () => {
    expect(policyAt(rules, 'LOC_DAILY_RATE', '2026-06-01T08:00:00.000Z')).toBe(120);
  });

  it('builds typed LAD/LoC policies, defaults reproduce today\'s constants', () => {
    expect(ladPolicyAt(DEFAULT_POLICY_RULES, '2026-11-21')).toEqual({ smallProjectThreshold: 20000, smallProjectDailyRate: 20, annualRatePct: 6.4 });
    expect(locPolicyAt(rules, '2026-07-01')).toEqual({ graceDays: 14, dailyRate: 120 });
  });
});
