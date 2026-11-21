// Reads a master BQ ("Jadual Kadar Harga") workbook into bills -> groups -> items -> variants.
// Every rate and unit is copied from its cell; nothing is inferred or recomputed.
import { collapse } from './rows';
import type { BookStats, Cell, ParseOptions, ParseWarning, ParsedBill, ParsedBook, ParsedGroup, ParsedItem, ParsedSheet, Rates, SheetRows } from './types';

const BILL_RE = /^BILL?\s*NO\.?\s*(\d+)\s*[-–:]\s*(.+)$/i;
const SAMBUNGAN_RE = /\(\s*SAMBUNGAN\s*\)\s*$/i;
// A marker needs whitespace after it, so "M.S. Plate" is text, not variant "m".
const VARIANT_RE = /^\(?([ivxlcdm]+|[a-z])\s*(?:\.\s*\)|\.|\))\s+(.*)$/i;
const GROUP_CODE_RE = /^\d+$/;
const WHOLE_CODE_RE = /^(\d+)\.0+$/; // "1.0" is how the schedule numbers a group heading
const ITEM_CODE_RE = /^\d+(?:\.\d+)+$/;
const IGNORED_TEXT_RE = /^ALL QUANTIT(Y|IES) ARE PROVISIONAL/i;
const NOTE_RE = /^nota\b/i;

interface Columns {
  code: number;
  desc: number;
  unit: number;
  rates: { index: number; header: string }[];
}

interface Line {
  row: number;
  code: string;
  raw: string;
  text: string;
  unit: string;
  rates: Rates;
  priced: boolean;
}

interface PendingVariant {
  marker: string;
  label: string;
  text: string;
  row: number;
  // Unpriced lettered lines before any priced variant are a specification list, not variants.
  afterVariants: boolean;
}

const cellText = (c: Cell): string => (c === null || c === undefined ? '' : String(c));

function parseNumber(c: Cell): number | null {
  if (typeof c === 'number') return Number.isFinite(c) ? c : null;
  const s = cellText(c).replace(/RM|,|\s/gi, '');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const isIndented = (raw: string): boolean => /^\s{2,}\S/.test(raw);

function isTitleLike(text: string): boolean {
  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length < 2) return false;
  return letters.replace(/[^A-Z]/g, '').length / letters.length >= 0.8;
}

function findColumns(row: Cell[]): Columns | null {
  const headers = row.map((c) => collapse(cellText(c)).toUpperCase());
  if (headers[0] !== 'BIL') return null;
  const desc = headers.findIndex((h) => h.includes('KETERANGAN'));
  if (desc < 0) return null;
  const unit = headers.findIndex((h) => h.includes('UNIT'));
  const rates = row
    .map((c, index) => ({ index, header: collapse(cellText(c)) }))
    .filter(({ index, header }) => index !== desc && index !== unit && /KADAR|HARGA|\(RM\)/i.test(header));
  return { code: 0, desc, unit, rates };
}

/** Parser for one sheet; owns the "where am I" state while walking rows top to bottom. */
class SheetParser {
  private cols: Columns | null = null;
  private title?: string;
  private bill: ParsedBill | null = null;
  private group: ParsedGroup | null = null;
  private item: ParsedItem | null = null;
  private groupLead: string[] = [];
  private pending: PendingVariant | null = null;
  private trailing: string[] = [];
  private lastVariant: ParsedItem['variants'][number] | null = null;
  private pricedRows = 0;

  constructor(
    private readonly sheet: SheetRows,
    private readonly bills: ParsedBill[],
    private readonly warnings: ParseWarning[],
  ) {}

  run(): ParsedSheet {
    this.sheet.rows.forEach((row, i) => this.visit(row ?? [], i + 1));
    this.closeItem();
    return { name: this.sheet.name, title: this.title, rateColumns: (this.cols?.rates ?? []).map((r) => r.header), pricedRows: this.pricedRows };
  }

  private warn(row: number, message: string): void {
    this.warnings.push({ sheet: this.sheet.name, row, message });
  }

  private visit(row: Cell[], rowNo: number): void {
    const header = findColumns(row);
    if (header) {
      this.cols ??= header;
      return;
    }
    if (!this.cols) {
      this.title ??= row.map(cellText).map(collapse).find((t) => t !== '' && !/^\d+$/.test(t));
      return;
    }
    const line = this.readLine(row, rowNo);
    if (!line.code && !line.text && !line.priced) return;
    if (line.priced) this.pricedRows++;
    this.dispatch(line);
  }

  private readLine(row: Cell[], rowNo: number): Line {
    const cols = this.cols!;
    const raw = cellText(row[cols.desc]);
    const rates: Rates = {};
    for (const { index, header } of cols.rates) {
      const n = parseNumber(row[index]);
      if (n !== null) rates[header] = n;
      else if (cellText(row[index]).trim() !== '') this.warn(rowNo, `Kadar bukan nombor dalam lajur "${header}": ${cellText(row[index]).trim()}`);
    }
    return {
      row: rowNo,
      code: collapse(cellText(row[cols.code])).replace(WHOLE_CODE_RE, '$1'),
      raw,
      text: collapse(raw),
      unit: cols.unit >= 0 ? collapse(cellText(row[cols.unit])) : '',
      rates,
      priced: Object.keys(rates).length > 0,
    };
  }

  private dispatch(line: Line): void {
    const bill = BILL_RE.exec(line.text);
    if (!line.code && bill) return this.onBill(bill[1], bill[2], line.row);
    if (!line.code && IGNORED_TEXT_RE.test(line.text)) return;
    if (GROUP_CODE_RE.test(line.code)) return this.onGroup(line);
    if (ITEM_CODE_RE.test(line.code)) return this.onItem(line);
    if (line.code) this.warn(line.row, `Nombor BIL tidak dikenali: ${line.code}`);
    const variant = VARIANT_RE.exec(line.text);
    if (variant) return this.onVariant(line, variant[1].toLowerCase(), collapse(variant[2]));
    this.onText(line);
  }

  private onBill(no: string, rawTitle: string, row: number): void {
    const continued = SAMBUNGAN_RE.test(rawTitle);
    const title = collapse(rawTitle.replace(SAMBUNGAN_RE, ''));
    const existing = this.bills.find((b) => b.sheet === this.sheet.name && b.no === no);
    if (continued && existing) {
      this.bill = existing;
      return;
    }
    this.closeItem();
    if (continued) this.warn(row, `BIL ${no} (SAMBUNGAN) tanpa bil asal`);
    const elsewhere = this.bills.find((b) => b.no === no && b.sheet !== this.sheet.name);
    if (elsewhere) this.warn(row, `BIL ${no} juga ada dalam sheet "${elsewhere.sheet}"`);
    this.bill = existing ?? { no, title, sheet: this.sheet.name, groups: [] };
    if (!existing) this.bills.push(this.bill);
    this.group = null;
  }

  private ensureBill(row: number): ParsedBill {
    if (!this.bill) {
      this.warn(row, 'Baris sebelum tajuk BIL NO.; dimasukkan ke bil tanpa nama');
      this.bill = { no: '?', title: this.sheet.name, sheet: this.sheet.name, groups: [] };
      this.bills.push(this.bill);
    }
    return this.bill;
  }

  private onGroup(line: Line): void {
    this.closeItem();
    this.group = { code: line.code, title: line.text, row: line.row, items: [] };
    this.ensureBill(line.row).groups.push(this.group);
    if (line.priced) {
      this.startItem(line.code, line.text, line);
    } else if (!isTitleLike(line.text)) {
      this.groupLead.push(line.text);
    }
  }

  private onItem(line: Line): void {
    this.closeItem();
    if (!this.group) {
      const code = line.code.split('.')[0];
      this.warn(line.row, `Item ${line.code} tanpa kumpulan ${code}`);
      this.group = { code, title: line.text, row: line.row, items: [] };
      this.ensureBill(line.row).groups.push(this.group);
    }
    this.startItem(line.code, line.text, line.priced ? line : null, line.row);
  }

  private startItem(code: string, description: string, priced: Line | null, row = priced?.row ?? 0): ParsedItem {
    this.flushTrailing();
    const item: ParsedItem = { code, description, variants: [], notes: [], row };
    if (priced) this.setRate(item, priced);
    this.group!.items.push(item);
    this.item = item;
    this.groupLead = [];
    this.lastVariant = null;
    return item;
  }

  private setRate(item: ParsedItem, line: Line): void {
    item.rates = line.rates;
    item.unit = line.unit;
    if (!line.unit) this.warn(line.row, 'Baris berkadar tetapi tiada unit');
  }

  private implicitItem(lead: string[], priced: Line | null, row: number): ParsedItem {
    if (!this.group) {
      this.warn(row, 'Item tanpa nombor kumpulan; kumpulan baharu dibuat');
      this.group = { code: String((this.bill?.groups.length ?? 0) + 1), title: lead[0] ?? '', row, items: [] };
      this.ensureBill(row).groups.push(this.group);
    }
    const n = this.group.items.length;
    const code = n === 0 ? this.group.code : `${this.group.code}-${n + 1}`;
    const description = lead.length ? lead.join(' ') : this.group.title;
    return this.startItem(code, description, priced, row);
  }

  private onVariant(line: Line, marker: string, label: string): void {
    if (!line.priced) {
      if (this.item?.rates) return this.appendDescription(line.text);
      this.dropPending();
      this.pending = { marker, label, text: line.text, row: line.row, afterVariants: !!this.item?.variants.length };
      return;
    }
    this.dropPending();
    this.addVariant(marker, label, line);
  }

  private addVariant(marker: string, label: string, line: Line): void {
    const item = this.targetForVariant(line.row);
    if (item.rates) this.warn(line.row, `Item ${item.code} ada kadar sendiri dan juga varian`);
    const variant = { code: `${item.code}(${marker})`, label, unit: line.unit, rates: line.rates, row: line.row };
    if (!line.unit) this.warn(line.row, 'Baris berkadar tetapi tiada unit');
    item.variants.push(variant);
    this.lastVariant = variant;
  }

  // A text block after a finished variant list that is followed by new variants is a new, unnumbered item.
  private targetForVariant(row: number): ParsedItem {
    if (!this.item) return this.implicitItem(this.groupLead, null, row);
    const startsNewBlock = this.item.variants.length > 0 && this.trailing.length > 0 && !NOTE_RE.test(this.trailing[0]);
    if (startsNewBlock) {
      const lead = this.trailing;
      this.trailing = [];
      return this.implicitItem(lead, null, row);
    }
    this.flushTrailing();
    return this.item;
  }

  private onText(line: Line): void {
    if (this.pending && (line.priced || isIndented(line.raw) || line.text.startsWith('('))) {
      const pending = this.pending;
      if (!line.priced) {
        pending.label = `${pending.label} ${line.text}`;
        pending.text = `${pending.text} ${line.text}`;
        return;
      }
      this.pending = null;
      return this.addVariant(pending.marker, `${pending.label} ${line.text}`, line);
    }
    this.dropPending();
    if (line.priced) return this.onPricedText(line);
    this.onPlainText(line);
  }

  private onPricedText(line: Line): void {
    const item = this.item;
    if (item && !item.rates && item.variants.length === 0) {
      this.setRate(item, line);
      return this.appendDescription(line.text);
    }
    if (!item) {
      this.implicitItem([...this.groupLead, line.text], line, line.row);
      return;
    }
    this.flushTrailing();
    this.implicitItem([line.text], line, line.row);
  }

  private onPlainText(line: Line): void {
    if (this.lastVariant && this.trailing.length === 0 && (isIndented(line.raw) || line.text.startsWith('('))) {
      this.lastVariant.label = `${this.lastVariant.label} ${line.text}`;
    } else if (this.trailing.length > 0 && isIndented(line.raw)) {
      this.trailing[this.trailing.length - 1] += ` ${line.text}`;
    } else if (this.item?.variants.length) {
      this.trailing.push(line.text);
    } else if (this.item) {
      this.appendDescription(line.text);
    } else if (this.group) {
      this.groupLead.push(line.text);
    } else {
      this.warn(line.row, `Teks di luar kumpulan diabaikan: ${line.text.slice(0, 60)}`);
    }
  }

  private appendDescription(text: string): void {
    this.item!.description = collapse(`${this.item!.description} ${text}`);
  }

  private dropPending(): void {
    const pending = this.pending;
    if (!pending) return;
    this.pending = null;
    if (pending.afterVariants) this.warn(pending.row, `Varian "${pending.label.slice(0, 60)}" tiada kadar; diabaikan`);
    else if (this.item) this.appendDescription(pending.text);
    else this.groupLead.push(pending.text);
  }

  private flushTrailing(): void {
    if (this.item && this.trailing.length) this.item.notes.push(...this.trailing);
    this.trailing = [];
  }

  private closeItem(): void {
    this.dropPending();
    this.flushTrailing();
    this.item = null;
    this.lastVariant = null;
    this.groupLead = [];
  }
}

function bookStats(bills: ParsedBill[], warnings: number): BookStats {
  const groups = bills.flatMap((b) => b.groups);
  const items = groups.flatMap((g) => g.items);
  const variants = items.reduce((n, i) => n + i.variants.length, 0);
  const pricedItems = items.filter((i) => i.rates).length;
  return { bills: bills.length, groups: groups.length, items: items.length, variants, pricedRows: pricedItems + variants, warnings };
}

export function parseMasterBq(sheets: SheetRows[], opts: ParseOptions = {}): ParsedBook {
  const wanted = opts.sheets ? sheets.filter((s) => opts.sheets!.includes(s.name)) : sheets;
  const bills: ParsedBill[] = [];
  const warnings: ParseWarning[] = [];
  const parsedSheets = wanted.map((s) => new SheetParser(s, bills, warnings).run());
  const rateColumns = [...new Set(parsedSheets.flatMap((s) => s.rateColumns))];
  return { sheets: parsedSheets, rateColumns, bills, warnings, stats: bookStats(bills, warnings.length) };
}
