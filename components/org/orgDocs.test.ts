import { describe, expect, it } from 'vitest';
import { fillTemplate, placeholdersIn, templateTokens } from './template';
import { OrgDocs } from './orgDocs';
import { calculateLADDailyRate, dlpPeriod, ladPolicyDate } from '../../services/finance';
import { DEFAULT_PROFILE } from './orgDefaults';

describe('templates', () => {
  it('fills known slots and leaves unknown ones visible', () => {
    expect(fillTemplate('pihak {{nama_ringkas}} / {{tiada}}', { nama_ringkas: 'MPS' })).toBe('pihak MPS / {{tiada}}');
  });

  it('marks filled slots as bold tokens, keeping the surrounding text exact', () => {
    expect(templateTokens('sebanyak{{kadar_lad}}/hari.', { kadar_lad: 'RM20.00' })).toEqual([
      { text: 'sebanyak', bold: false }, { text: 'RM20.00', bold: true }, { text: '/hari.', bold: false },
    ]);
  });

  it('lists placeholders once', () => {
    expect(placeholdersIn('{{a}} {{b}} {{a}}')).toEqual(['a', 'b']);
  });
});

describe('OrgDocs', () => {
  const rule = (key: string, effectiveFrom: string, value: number) => ({ key, effective_from: effectiveFrom, value });

  it('falls back to the pre-v2 values when nothing is configured', () => {
    const org = new OrgDocs();
    expect(org.profile.name).toBe(DEFAULT_PROFILE.name);
    expect(org.text('doc.aku_janji', 'para2')).toContain('pihak MPS berhak');
    expect(org.text('doc.cpc', 'heading2')).toBe('MAJLIS PERBANDARAN SELAYANG');
    expect(org.locPolicy('2026-01-01')).toEqual({ graceDays: 14, dailyRate: 100 });
  });

  it('uses saved texts and profile over the defaults', () => {
    const org = new OrgDocs({ 'org.profile': { short: 'MPC' }, 'doc.loc': { title: 'TAJUK BAHARU' } });
    expect(org.text('doc.aku_janji', 'para2')).toContain('pihak MPC berhak');
    expect(org.text('doc.loc', 'title')).toBe('TAJUK BAHARU');
    expect(org.text('doc.loc', 'heading')).toBe('PENGIRAAN DENDA LEWAT TUNTUTAN');
  });

  it('applies a new policy only from its effective date (policyAt)', () => {
    const org = new OrgDocs({}, [rule('LAD_BLR_PCT', '2020-01-01', 6.65), rule('LAD_BLR_PCT', '2027-01-01', 7.65)]);
    const before = calculateLADDailyRate(50000, org.ladPolicy('2026-12-31'));
    const after = calculateLADDailyRate(50000, org.ladPolicy('2027-01-01'));
    expect(before).toBe(8.77);
    expect(after).toBe(10.14);
  });

  it('uses the earliest rule for dates before any rule existed', () => {
    const org = new OrgDocs({}, [rule('LOC_DAILY_RATE', '2020-01-01', 100)]);
    expect(org.locPolicy('2019-05-01').dailyRate).toBe(100);
  });

  it('makes project fields available to every text', () => {
    const org = new OrgDocs({ 'doc.loc': { title: 'LoC {{nama_syarikat}} {{no_sebutharga}}' } })
      .forProject({ namaSyarikat: 'Syarikat 01 Enterprise', noSebutharga: 'SH/1' });
    expect(org.text('doc.loc', 'title')).toBe('LoC SYARIKAT 01 ENTERPRISE SH/1');
  });
});

describe('finance helpers', () => {
  it('keeps the pre-v2 LAD rate with the default policy', () => {
    expect(calculateLADDailyRate(15000)).toBe(20);
    expect(calculateLADDailyRate(37870)).toBe(6.64);
  });

  it('reads the LAD rule on the contract start date first', () => {
    expect(ladPolicyDate({ tarikhMulaKontrak: '2026-03-01', tarikhSerahTapak: '2026-03-05', tarikhTamatKontrak: '2026-04-01' })).toBe('2026-03-01');
    expect(ladPolicyDate({ tarikhTamatKontrak: '2026-04-01' })).toBe('2026-04-01');
  });

  it('computes the DLP like the old CPC code (next day, plus N months)', () => {
    expect(dlpPeriod('2026-06-29', 6)).toEqual({ start: '2026-06-30', end: '2026-12-30' });
    expect(dlpPeriod('', 6)).toEqual({ start: '', end: '' });
  });
});
