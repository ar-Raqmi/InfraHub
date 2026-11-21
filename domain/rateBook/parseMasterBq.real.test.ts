// Runs only when MASTER_BQ_XLS points at a real master BQ workbook (never committed).
// Optional LEGACY_BOOK_JSON: a JSON array of PresetGroup (today's Pustaka) to match against.
// Optional MASTER_BQ_REPORT: path where the measured numbers are written as JSON.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { workbookToSheetRows } from '../../lib/excel/readWorkbook';
import type { PresetGroup } from '../../types';
import { matchBooks } from './matchItems';
import { parseMasterBq } from './parseMasterBq';
import { defaultRateColumn, toPresetGroups } from './toPresetGroups';
import type { ParsedBook, Rates } from './types';

const file = process.env.MASTER_BQ_XLS;
const legacyPath = process.env.LEGACY_BOOK_JSON;
const reportPath = process.env.MASTER_BQ_REPORT;
const JAB = 'KADAR HARGA JABATAN (RM)';
const KON = 'KADAR HARGA KONTRAKTOR (RM)';

const pricedRates = (book: ParsedBook): Rates[] =>
  book.bills.flatMap((b) => b.groups.flatMap((g) => g.items.flatMap((i) => (i.variants.length ? i.variants.map((v) => v.rates) : [i.rates ?? {}]))));

describe.skipIf(!file || !existsSync(file))('real master BQ workbook', () => {
  let overall: ParsedBook;
  let byCategory: ParsedBook;
  let categorySheets: string[];
  const report: Record<string, unknown> = {};

  beforeAll(() => {
    const sheets = workbookToSheetRows(readFileSync(file!));
    categorySheets = sheets.map((s) => s.name).filter((n) => n !== 'KESELURUHAN');
    overall = parseMasterBq(sheets, { sheets: ['KESELURUHAN'] });
    byCategory = parseMasterBq(sheets, { sheets: categorySheets });
  });

  it('KESELURUHAN: every BIL header (incl. SAMBUNGAN) lands in its bill, 465 priced rows', () => {
    expect(overall.sheets[0].title).toBe('JADUAL KADAR HARGA 2024/2025');
    expect(overall.rateColumns).toEqual([JAB, KON]);
    expect(overall.sheets[0].pricedRows).toBe(465);
    expect(overall.stats.pricedRows).toBe(465);
    report.keseluruhan = { ...overall.stats, rowsWithARate: overall.sheets[0].pricedRows, warningList: overall.warnings };
  });

  it('category sheets: 16 sheets, 508 priced rows', () => {
    expect(categorySheets).toHaveLength(16);
    expect(byCategory.stats.pricedRows).toBe(508);
    report.categories = { ...byCategory.stats, rowsWithARate: byCategory.sheets.reduce((n, s) => n + s.pricedRows, 0), warningList: byCategory.warnings };
  });

  it('kontraktor is jabatan x 0.85 rounded on (almost) every KESELURUHAN row, read as written', () => {
    const ratios = pricedRates(overall).map((r) => r[KON] / r[JAB]).filter(Number.isFinite);
    const outliers = ratios.filter((q) => q < 0.849 || q > 0.851);
    report.kontraktorRatio = { rows: ratios.length, outliers: outliers.length, min: Math.min(...ratios), max: Math.max(...ratios) };
    expect(ratios).toHaveLength(465);
    expect(outliers.length).toBeLessThanOrEqual(ratios.length * 0.01);
  });

  it.skipIf(!legacyPath)('matches KESELURUHAN-kontraktor against the legacy Pustaka', () => {
    const legacy = JSON.parse(readFileSync(legacyPath!, 'utf8')) as PresetGroup[];
    const next = toPresetGroups(overall, defaultRateColumn(overall)!);
    const result = matchBooks(next, legacy);
    report.match = { newRows: result.matches.length, ...result.stats };
    expect(result.matches).toHaveLength(465);
    expect(result.stats.EXACT).toBeGreaterThan(0);
  });

  it('writes the report', () => {
    if (reportPath) writeFileSync(reportPath, JSON.stringify(report, null, 2));
    expect(Object.keys(report).length).toBeGreaterThan(0);
  });
});
