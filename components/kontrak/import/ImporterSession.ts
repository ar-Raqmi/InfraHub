// The browser half of a master-BQ import: holds the workbook the officer uploaded, the sheet choice
// and the rate column, and answers "what would be imported". Parsing itself is domain/rateBook.
import { parseMasterBq } from '../../../domain/rateBook/parseMasterBq';
import { defaultRateColumn, toPresetGroups } from '../../../domain/rateBook/toPresetGroups';
import { flattenBook, type BookRow } from '../../../domain/rateBook/rows';
import type { ParsedBook, SheetRows } from '../../../domain/rateBook/types';

export interface SheetSummary {
  name: string;
  title?: string;
  bills: number;
  pricedRows: number;
  rateColumns: string[];
}

export interface SheetChoice {
  id: 'summary' | 'categories' | 'custom';
  label: string;
  hint: string;
  sheets: string[];
  pricedRows: number;
  rateColumns: string[];
}

export interface BillPreview {
  no: string;
  title: string;
  sheet: string;
  rows: number;
  minRate: number;
  maxRate: number;
}

export interface ImportPreview {
  book: ParsedBook;
  rateColumn: string;
  rows: BookRow[];
  /** Priced rows that have no value in the chosen column; they are left out. */
  missingInColumn: number;
  bills: BillPreview[];
}

const SUMMARY_NAME_RE = /KESELURUHAN|SEMUA|RINGKASAN|INDUK|MASTER/i;

export class ImporterSession {
  private readonly parsed = new Map<string, ParsedBook>();
  readonly summaries: SheetSummary[];

  constructor(readonly fileName: string, private readonly sheets: SheetRows[]) {
    this.summaries = sheets.map(s => this.summarise(s.name)).filter(s => s.pricedRows > 0);
  }

  private summarise(name: string): SheetSummary {
    const book = this.parse([name]);
    return { name, title: book.sheets[0]?.title, bills: book.stats.bills, pricedRows: book.stats.pricedRows, rateColumns: book.rateColumns };
  }

  parse(sheetNames: string[]): ParsedBook {
    const key = [...sheetNames].sort().join('\u0000');
    let book = this.parsed.get(key);
    if (!book) {
      book = parseMasterBq(this.sheets, { sheets: sheetNames });
      this.parsed.set(key, book);
    }
    return book;
  }

  /** The sheet that already holds every bill (e.g. KESELURUHAN), if the workbook has one. */
  get summarySheet(): SheetSummary | undefined {
    const byName = this.summaries.find(s => SUMMARY_NAME_RE.test(s.name));
    if (byName) return byName;
    const [first, second] = [...this.summaries].sort((a, b) => b.bills - a.bills);
    return first && first.bills >= 3 && (!second || first.bills >= second.bills * 2) ? first : undefined;
  }

  /** Two ready-made choices (the summary sheet vs. the category sheets) plus "pilih sendiri". */
  choices(): SheetChoice[] {
    const summary = this.summarySheet;
    const rest = this.summaries.filter(s => s !== summary);
    const out: SheetChoice[] = [];
    if (summary) {
      out.push({ id: 'summary', label: summary.name, hint: summary.title ?? 'Helaian yang memuatkan semua bil', sheets: [summary.name], pricedRows: summary.pricedRows, rateColumns: summary.rateColumns });
    }
    if (rest.length) {
      const book = this.parse(rest.map(s => s.name));
      out.push({ id: 'categories', label: `Helaian kategori (${rest.length})`, hint: rest.map(s => s.name).join(', '), sheets: rest.map(s => s.name), pricedRows: book.stats.pricedRows, rateColumns: book.rateColumns });
    }
    return out;
  }

  /** Default: the summary sheet when it carries a KONTRAKTOR column, else the first choice. */
  defaultChoice(): SheetChoice | undefined {
    const all = this.choices();
    return all.find(c => c.rateColumns.some(col => /KONTRAKTOR/i.test(col))) ?? all[0];
  }

  defaultRateColumn(sheetNames: string[]): string | undefined {
    return defaultRateColumn(this.parse(sheetNames));
  }

  preview(sheetNames: string[], rateColumn: string): ImportPreview {
    const book = this.parse(sheetNames);
    const rows = flattenBook(toPresetGroups(book, rateColumn));
    const bills = book.bills.map(bill => {
      const rates = flattenBook(toPresetGroups({ ...book, bills: [bill] }, rateColumn)).map(r => r.rate);
      return { no: bill.no, title: bill.title, sheet: bill.sheet, rows: rates.length, minRate: rates.length ? Math.min(...rates) : 0, maxRate: rates.length ? Math.max(...rates) : 0 };
    });
    return { book, rateColumn, rows, missingInColumn: Math.max(0, book.stats.pricedRows - rows.length), bills };
  }
}
