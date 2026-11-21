// Browser-side (and Node) Excel reader: workbook bytes -> SheetRows[] for the master BQ importer.
import * as XLSX from 'xlsx';
import type { Cell, SheetRows } from '../../domain/rateBook/types';

const DOTTED_CODE_RE = /^\d+(\.\d+)+$/;

// Numbers keep their value, except a dotted code whose display text carries a trailing zero
// ("1.10" would otherwise collapse into item "1.1").
function cellValue(cell: XLSX.CellObject | undefined): Cell {
  if (!cell || cell.v === undefined || cell.v === null) return null;
  if (cell.t === 'n') {
    const shown = (cell.w ?? '').trim();
    return DOTTED_CODE_RE.test(shown) && shown !== String(cell.v) ? shown : (cell.v as number);
  }
  if (cell.t === 'b') return cell.v ? 'TRUE' : 'FALSE';
  if (cell.t === 'e') return null;
  return String(cell.v);
}

export function sheetToRows(name: string, sheet: XLSX.WorkSheet): SheetRows {
  if (!sheet['!ref']) return { name, rows: [] };
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const rows: Cell[][] = [];
  for (let r = 0; r <= range.e.r; r++) {
    const row: Cell[] = [];
    for (let c = 0; c <= range.e.c; c++) row.push(cellValue(sheet[XLSX.utils.encode_cell({ r, c })]));
    rows.push(row);
  }
  return { name, rows };
}

export function workbookToSheetRows(data: ArrayBuffer | Uint8Array): SheetRows[] {
  const wb = XLSX.read(data, { type: 'array', cellDates: false });
  return wb.SheetNames.map((name) => sheetToRows(name, wb.Sheets[name]));
}

export async function readWorkbook(file: Blob): Promise<SheetRows[]> {
  return workbookToSheetRows(new Uint8Array(await file.arrayBuffer()));
}
