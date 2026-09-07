import ExcelJS from 'exceljs';
import { PresetGroup } from '../types';

const FONT = 'Arial';
const FONT_SIZE = 12;
const HEADER_HEIGHT = 47.25;
const COL_WIDTHS = [5.57, 94.42, 10.42, 20.14, 18];
const HEADERS = ['BIL', 'KETERANGAN', 'UNIT', 'KADAR HARGA KONTRAKTOR\n(RM)', 'RUJUKAN DB'];
const WRAP_WIDTH = 95;

const MASTER_ORDER = [
  'Permulaan', 'Longkang', 'Penutup Longkang', 'Laluan Keluar Masuk', 'Pejalan Kaki',
  'Scupper Drain', 'Pagar, Railling & Guardrail', 'Palang Penghadang', 'Susur Jalan (Road Kerb)',
  'Pelbagai', 'Papan Tanda', 'Jalan', 'Garisan Jalan', 'Perhentian Bas', 'Jentera', 'Geoteknikal',
];

const MASTER_SHEET_NAMES: Record<string, string> = {
  'Permulaan': 'PERMULAAN',
  'Longkang': 'LONGKANG',
  'Penutup Longkang': 'PENUTUP LONGKANG',
  'Laluan Keluar Masuk': 'LALUAN KELUAR & MASUK',
  'Pejalan Kaki': 'PEJALAN KAKI',
  'Scupper Drain': 'SCUPPER DRAIN',
  'Pagar, Railling & Guardrail': 'PAGAR, RAILLING & GUARDRAIL',
  'Palang Penghadang': 'PALANG PENGHADANG',
  'Susur Jalan (Road Kerb)': 'SUSUR JALAN (ROAD KERB)',
  'Pelbagai': 'PELBAGAI',
  'Papan Tanda': 'PAPAN TANDA',
  'Jalan': 'JALAN',
  'Garisan Jalan': 'GARISAN JALAN',
  'Perhentian Bas': 'PERHENTIAN BAS',
  'Jentera': 'JENTERA',
  'Geoteknikal': 'GEOTEKNIKAL',
};

const MASTER_BILL_TITLES: Record<string, string> = {
  'Permulaan': 'BIL NO. 1 - KERJA-KERJA PERMULAAN',
  'Longkang': 'BIL NO. 2 - BUTIRAN KERJA LONGKANG',
  'Penutup Longkang': 'BIL NO. 3 - BUTIRAN KERJA PENUTUP LONGKANG',
  'Laluan Keluar Masuk': 'BIL NO. 4 - BUTIRAN KERJA LALUAN MASUK/KELUAR',
  'Pejalan Kaki': 'BIL NO. 5 - BUTIRAN KERJA PEJALAN KAKI',
  'Scupper Drain': 'BIL NO. 6 - BUTIRAN KERJA SCUPPER DRAIN',
  'Pagar, Railling & Guardrail': 'BIL NO. 7 - BUTIRAN KERJA PAGAR/RAILLING/GUARDRAIL',
  'Palang Penghadang': 'BIL NO. 8 - BUTIRAN KERJA PALANG PENGHADANG',
  'Susur Jalan (Road Kerb)': 'BIL NO. 9 - BUTIRAN KERJA SUSUR JALAN (ROAD KERB)',
  'Pelbagai': 'BIL NO. 10 - BUTIRAN KERJA PERABOT JALAN PELBAGAI',
  'Papan Tanda': 'BIL NO. 11 - BUTIRAN KERJA PAPAN TANDA',
  'Jalan': 'BIL NO. 12 - BUTIRAN KERJA JALAN',
  'Garisan Jalan': 'BIL NO. 13 - BUTIRAN KERJA PENANDAAN GARISAN JALAN',
  'Perhentian Bas': 'BIL NO. 14 - BUTIRAN KERJA PERHENTIAN BAS',
  'Jentera': 'BIL NO. 15 - BUTIRAN KERJA JENTERA',
  'Geoteknikal': 'BIL NO. 16 - BUTIRAN KERJA GEOTEKNIKAL',
};

const ROMAN_PAIRS: Array<[number, string]> = [[10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];

function roman(n: number): string {
  let out = '';
  let rem = n;
  for (const [val, sym] of ROMAN_PAIRS) {
    while (rem >= val) {
      out += sym;
      rem -= val;
    }
  }
  return out || 'i';
}

export function normalizeUnit(unit?: string | null): string {
  return (unit || '').toUpperCase().replace(/\u00b2/g, '2').replace(/\u00b3/g, '3').trim();
}

function wrap(text: string, width = WRAP_WIDTH): string[] {
  const trimmed = (text || '').trim();
  if (!trimmed) return [''];
  const out: string[] = [];
  for (const para of trimmed.split('\n')) {
    const clean = para.trim();
    if (!clean) continue;
    const lines = clean.match(new RegExp(`.{1,${width}}(?:\\s|$)|\\S{${width + 1},}`, 'g')) || [clean];
    for (const line of lines) {
      const t = line.trim();
      if (t) out.push(t);
    }
  }
  return out.length ? out : [''];
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  let clean = (name || 'SHEET').replace(/[/\\?*[\]:]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase().slice(0, 31) || 'SHEET';
  let candidate = clean;
  let i = 2;
  while (used.has(candidate)) {
    const suffix = ` (${i})`;
    candidate = clean.slice(0, 31 - suffix.length) + suffix;
    i++;
  }
  used.add(candidate);
  return candidate;
}

type BlockRow = Array<{ col: number; value: ExcelJS.CellValue; bold?: boolean; center?: boolean; right?: boolean; numFmt?: string; ref?: boolean; note?: boolean; topBorder?: boolean }>;

interface OrderedCategory {
  category: string;
  sheet: string;
  bill: string;
  groups: PresetGroup[];
}

export function orderCategories(groups: PresetGroup[]): OrderedCategory[] {
  const byCat = new Map<string, PresetGroup[]>();
  const catOrder: string[] = [];
  for (const g of groups) {
    if (!byCat.has(g.category)) {
      byCat.set(g.category, []);
      catOrder.push(g.category);
    }
    byCat.get(g.category)!.push(g);
  }
  const known = MASTER_ORDER.filter(c => byCat.has(c));
  const unknown = catOrder.filter(c => !MASTER_ORDER.includes(c));
  const ordered = [...known, ...unknown];

  const usedSheetNames = new Set<string>();
  return ordered.map((category, idx) => {
    const billNo = idx + 1;
    const bill = MASTER_BILL_TITLES[category] || `BIL NO. ${billNo} - BUTIRAN KERJA ${category.toUpperCase()}`;
    return {
      category,
      sheet: sanitizeSheetName(MASTER_SHEET_NAMES[category] || category, usedSheetNames),
      bill,
      groups: byCat.get(category)!,
    };
  });
}

function writeBlock(ws: ExcelJS.Worksheet, row: number, rows: BlockRow[]): number {
  for (const line of rows) {
    for (const cell of line) {
      const c = ws.getCell(row, cell.col);
      c.value = cell.value;
      c.font = { name: FONT, size: cell.ref ? 9 : FONT_SIZE, bold: !!cell.bold, italic: !!(cell.ref || cell.note), color: cell.ref ? { argb: 'FF808080' } : cell.note ? { argb: 'FF808080' } : undefined };
      if (cell.center) c.alignment = { horizontal: 'center', vertical: 'middle' };
      else if (cell.right) c.alignment = { horizontal: 'right', vertical: 'middle' };
      else c.alignment = { horizontal: 'left', vertical: 'middle', wrapText: cell.col === 2 };
      if (cell.numFmt) c.numFmt = cell.numFmt;
      c.border = cell.topBorder
        ? { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' } }
        : { left: { style: 'thin' }, right: { style: 'thin' } };
    }
    row++;
  }
  return row;
}

function writeCategory(ws: ExcelJS.Worksheet, cat: OrderedCategory, startRow: number, provisional: boolean): number {
  let row = startRow;
  if (provisional) {
    const c = ws.getCell(row, 2);
    c.value = 'ALL QUANTITY ARE PROVISIONAL';
    c.font = { name: FONT, size: FONT_SIZE, bold: true };
    row += 2;
  }
  row = writeBlock(ws, row, [Array.from({ length: 5 }, (_, i) => ({ col: i + 1, value: i === 1 ? cat.bill : null, bold: i === 1, topBorder: true }))]);
  row++;
  cat.groups.forEach((g, gIdx) => {
    const gnum = gIdx + 1;
    row = writeBlock(ws, row, [[
      { col: 1, value: gnum, center: true },
      { col: 2, value: (g.title || '').trim().toUpperCase(), bold: true },
      { col: 5, value: g.id, ref: true, center: true },
    ]]);
    const items = g.items || [];
    if (!items.length) {
      row = writeBlock(ws, row, [[
        { col: 2, value: '(Tiada item)', note: true },
        { col: 5, value: '-', ref: true, center: true },
      ]]);
      row++;
      return;
    }
    row++;
    items.forEach((it, iIdx) => {
      const bid = `${gnum}.${iIdx + 1}`;
      const descLines = wrap(it.description);
      const variants = it.variants || [];
      if (variants.length) {
        row = writeBlock(ws, row, descLines.map((dl, li) => [
          { col: 1, value: li === 0 ? bid : null, center: true },
          { col: 2, value: dl },
          { col: 5, value: li === 0 ? it.id : null, ref: true, center: true },
        ]));
        variants.forEach((v, vIdx) => {
          const label = `${roman(vIdx + 1)}) ${v.label || ''}`.trim();
          row = writeBlock(ws, row, [[
            { col: 2, value: label },
            { col: 3, value: normalizeUnit(v.unit), center: true },
            { col: 4, value: v.rate ?? null, right: true, numFmt: '#,##0.00' },
            { col: 5, value: v.id, ref: true, center: true },
          ]]);
        });
      } else {
        const lines = descLines.map((dl, li) => {
          const cells: BlockRow = [
            { col: 1, value: li === 0 ? bid : null, center: true },
            { col: 2, value: dl },
            { col: 5, value: li === 0 ? it.id : null, ref: true, center: true },
          ];
          if (li === 0) {
            cells.push({ col: 3, value: normalizeUnit(it.unit), center: true });
            cells.push({ col: 4, value: it.rate ?? null, right: true, numFmt: '#,##0.00' });
          }
          return cells;
        });
        row = writeBlock(ws, row, lines);
      }
      row++;
    });
    row++;
  });
  return row;
}

function initSheet(wb: ExcelJS.Workbook, title: string): ExcelJS.Worksheet {
  const ws = wb.addWorksheet(title, {
    views: [{ state: 'frozen', ySplit: 1 }],
    pageSetup: { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 },
  });
  ws.pageSetup.printTitlesRow = '1:1';
  COL_WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  HEADERS.forEach((h, i) => {
    const c = ws.getCell(1, i + 1);
    c.value = h;
    c.font = { name: FONT, size: FONT_SIZE, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: i === 3 };
    c.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });
  ws.getRow(1).height = HEADER_HEIGHT;
  return ws;
}

export async function buildLibraryWorkbook(libraryGroups: PresetGroup[]): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'InfraHub';
  wb.created = new Date();

  const cats = orderCategories(libraryGroups);
  cats.forEach((cat, idx) => {
    const ws = initSheet(wb, cat.sheet);
    writeCategory(ws, cat, 2, idx === 0);
  });

  const all = initSheet(wb, 'KESELURUHAN');
  const titleCell = all.getCell(2, 2);
  titleCell.value = 'PUSTAKA BQ - JADUAL KADAR KESELURUHAN';
  titleCell.font = { name: FONT, size: FONT_SIZE, bold: true };
  let row = 4;
  for (const cat of cats) {
    row = writeCategory(all, cat, row, false);
  }

  return wb.xlsx.writeBuffer();
}

export function libraryExportFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `Pustaka_BQ_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.xlsx`;
}

export async function exportLibraryToExcel(libraryGroups: PresetGroup[]): Promise<void> {
  const buffer = await buildLibraryWorkbook(libraryGroups);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = libraryExportFilename();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
