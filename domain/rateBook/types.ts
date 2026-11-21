// Types shared by the master-BQ importer, the matcher and the diff.

export type Cell = string | number | null;

export interface SheetRows {
  name: string;
  rows: Cell[][];
}

export interface ParseOptions {
  /** Sheet names to read; default: every sheet. */
  sheets?: string[];
}

export interface ParseWarning {
  sheet: string;
  row: number; // 1-based, as Excel shows it
  message: string;
}

export type Rates = Record<string, number>;

export interface ParsedVariant {
  code: string;
  label: string;
  unit: string;
  rates: Rates;
  row: number;
}

export interface ParsedItem {
  code: string;
  description: string;
  unit?: string;
  rates?: Rates;
  variants: ParsedVariant[];
  notes: string[];
  row: number;
}

export interface ParsedGroup {
  code: string;
  title: string;
  row: number;
  items: ParsedItem[];
}

export interface ParsedBill {
  no: string;
  title: string;
  sheet: string;
  groups: ParsedGroup[];
}

export interface ParsedSheet {
  name: string;
  title?: string;
  rateColumns: string[];
  pricedRows: number;
}

export interface BookStats {
  bills: number;
  groups: number;
  items: number;
  variants: number;
  pricedRows: number;
  warnings: number;
}

export interface ParsedBook {
  sheets: ParsedSheet[];
  rateColumns: string[];
  bills: ParsedBill[];
  warnings: ParseWarning[];
  stats: BookStats;
}
