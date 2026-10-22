export interface IndenPdfRow {
  noFail: string;
  noPesanan: string;
  supplier: string;
  amount: number;
  tarikhLO: string;
}

export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
}

export interface PdfDocumentLike {
  numPages: number;
  getPage(n: number): Promise<{
    getTextContent(): Promise<{ items: object[] }>;
  }>;
}

interface Line {
  y: number;
  items: PdfTextItem[];
}

const LINE_Y_TOLERANCE = 3;
// Wrapped supplier lines sit ~8pt below the row; the next row is ~17pt below.
const MAX_CONTINUATION_GAP = 12;
const BIL = /^\d+\.$/;
const DATE = /^\d{2}\/\d{2}\/\d{4}$/;
const NO_PESANAN = /^A\d{8}$/;
const AMOUNT = /^-?[\d,]+\.\d{2}$/;
const DIGITS = /^\d+$/;

const joinText = (items: PdfTextItem[]) => items.map(i => i.str.trim()).filter(Boolean).join(' ');

function groupLines(items: PdfTextItem[]): Line[] {
  const sorted = [...items].filter(i => i.str.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Line[] = [];
  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last && last.y - item.y <= LINE_Y_TOLERANCE) last.items.push(item);
    else lines.push({ y: item.y, items: [item] });
  }
  lines.forEach(l => l.items.sort((a, b) => a.x - b.x));
  return lines;
}

interface RowDraft {
  row: IndenPdfRow;
  y: number;
  noFailX: number;
  noPermohonanX: number;
  supplierX: number;
}

// A data line reads: Bil. | date | No. Fail (1+ items) | No. Permohonan | No Pesanan | supplier (1+ items) | amount
function parseRowLine(line: Line): RowDraft | null {
  const { items } = line;
  const pesananIdx = items.findIndex(i => NO_PESANAN.test(i.str.trim()));
  const dateIdx = items.findIndex(i => DATE.test(i.str.trim()));
  const last = items[items.length - 1];
  if (pesananIdx < 0 || dateIdx < 0 || dateIdx > pesananIdx - 2) return null;
  if (!BIL.test(items[0].str.trim()) || !AMOUNT.test(last.str.trim())) return null;
  if (!DIGITS.test(items[pesananIdx - 1].str.trim()) || pesananIdx === items.length - 1) return null;

  const failItems = items.slice(dateIdx + 1, pesananIdx - 1);
  const supplierItems = items.slice(pesananIdx + 1, -1);
  if (failItems.length === 0) return null;

  return {
    row: {
      tarikhLO: items[dateIdx].str.trim(),
      noFail: joinText(failItems),
      noPesanan: items[pesananIdx].str.trim(),
      supplier: joinText(supplierItems),
      amount: parseFloat(last.str.trim().replace(/,/g, '')),
    },
    y: line.y,
    noFailX: failItems[0].x,
    noPermohonanX: items[pesananIdx - 1].x,
    supplierX: supplierItems[0]?.x ?? items[pesananIdx].x + 1,
  };
}

// A wrapped line has text only in the No. Fail or supplier columns (never a Bil., date or amount).
function applyContinuation(draft: RowDraft, line: Line): boolean {
  if (draft.y - line.y > MAX_CONTINUATION_GAP) return false;
  if (line.items.some(i => BIL.test(i.str.trim()) || AMOUNT.test(i.str.trim()) || DATE.test(i.str.trim()))) return false;
  if (line.items[0].x < draft.noFailX - 2) return false;

  const failPart = line.items.filter(i => i.x < draft.noPermohonanX - 2);
  const supplierPart = line.items.filter(i => i.x >= draft.supplierX - 2);
  if (failPart.length + supplierPart.length !== line.items.length) return false;

  if (failPart.length) draft.row.noFail = `${draft.row.noFail} ${joinText(failPart)}`;
  if (supplierPart.length) draft.row.supplier = `${draft.row.supplier} ${joinText(supplierPart)}`.trim();
  draft.y = line.y;
  return true;
}

export function parseIndenPage(items: PdfTextItem[]): IndenPdfRow[] {
  const rows: IndenPdfRow[] = [];
  let current: RowDraft | null = null;

  for (const line of groupLines(items)) {
    const draft = parseRowLine(line);
    if (draft) {
      rows.push(draft.row);
      current = draft;
    } else if (!current || !applyContinuation(current, line)) {
      current = null;
    }
  }
  return rows;
}

export async function parseIndenDocument(doc: PdfDocumentLike): Promise<IndenPdfRow[]> {
  const rows: IndenPdfRow[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const { items } = await page.getTextContent();
    const textItems = items
      .filter((i): i is { str: string; transform: number[] } => 'str' in i && 'transform' in i)
      .map(i => ({ str: i.str, x: i.transform[4], y: i.transform[5] }));
    rows.push(...parseIndenPage(textItems));
  }
  return rows;
}
