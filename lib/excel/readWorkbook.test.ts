import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { workbookToSheetRows } from './readWorkbook';

function workbook(): Uint8Array {
  const ws = XLSX.utils.aoa_to_sheet([
    ['BIL', 'KETERANGAN', 'UNIT', 'KADAR'],
    [1, 'KERJA', null, null],
    [1.1, 'Item satu', 'M2', 1275],
    [1.1, 'Item sepuluh', 'M2', 12.5],
  ]);
  ws.A2.z = '0.0';
  ws.A4.z = '0.00';
  ws.D3.z = '#,##0.00';
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'KESELURUHAN');
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
}

describe('workbookToSheetRows', () => {
  const [sheet] = workbookToSheetRows(workbook());

  it('keeps sheet names and row positions', () => {
    expect(sheet.name).toBe('KESELURUHAN');
    expect(sheet.rows).toHaveLength(4);
    expect(sheet.rows[1][1]).toBe('KERJA');
  });

  it('keeps a dotted code with a trailing zero as text, other numbers as numbers', () => {
    expect(sheet.rows[3][0]).toBe('1.10');
    expect(sheet.rows[1][0]).toBe('1.0');
    expect(sheet.rows[2][0]).toBe(1.1);
    expect(sheet.rows[2][3]).toBe(1275);
  });

  it('returns null for empty cells', () => {
    expect(sheet.rows[1][2]).toBeNull();
  });
});
