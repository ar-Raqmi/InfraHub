// ParsedBook -> PresetGroup[] (the shape the BQ editor already reads), priced from one chosen rate column.
import type { PresetGroup, PresetItem, PresetVariant } from '../../types';
import type { ParsedBill, ParsedBook, ParsedItem, Rates } from './types';

const BILL_PREFIX_RE = /^(BUTIRAN\s+KERJA(-KERJA)?|KERJA-KERJA|KERJA)\s+/i;

export function defaultRateColumn(book: ParsedBook): string | undefined {
  return book.rateColumns.find((c) => /KONTRAKTOR/i.test(c)) ?? book.rateColumns[book.rateColumns.length - 1];
}

export function billCategory(billTitle: string): string {
  const core = billTitle.replace(BILL_PREFIX_RE, '').trim() || billTitle.trim();
  return core.toLowerCase().replace(/(^|[\s(/&-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

const rateOf = (rates: Rates | undefined, column: string): number | undefined => {
  const v = rates?.[column];
  return typeof v === 'number' ? v : undefined;
};

function toItem(item: ParsedItem, itemId: string, column: string): PresetItem | null {
  const base: PresetItem = { id: itemId, code: item.code, description: item.description };
  if (item.notes.length) base.notes = item.notes;
  if (item.variants.length) {
    const variants: PresetVariant[] = item.variants
      .filter((v) => rateOf(v.rates, column) !== undefined)
      .map((v, i) => ({ id: `${itemId}-v${i + 1}`, code: v.code, label: v.label, unit: v.unit, rate: rateOf(v.rates, column)! }));
    return variants.length ? { ...base, variants } : null;
  }
  const rate = rateOf(item.rates, column);
  return rate === undefined ? null : { ...base, unit: item.unit ?? '', rate };
}

// Ids are positional inside this import; matching later swaps in old ids for rows an officer accepts.
function billPrefix(bill: ParsedBill, index: number, bills: ParsedBill[]): string {
  const clash = bills.findIndex((b) => b.no === bill.no) !== index;
  return clash ? `B${bill.no}s${index}` : `B${bill.no}`;
}

export function toPresetGroups(book: ParsedBook, rateColumn: string, opts: { idPrefix?: string } = {}): PresetGroup[] {
  const out: PresetGroup[] = [];
  book.bills.forEach((bill, billIndex) => {
    const prefix = (opts.idPrefix ?? '') + billPrefix(bill, billIndex, book.bills);
    const category = billCategory(bill.title);
    bill.groups.forEach((group, groupIndex) => {
      const groupId = `${prefix}-G${groupIndex + 1}`;
      const items = group.items
        .map((item, itemIndex) => toItem(item, `${groupId}-I${itemIndex + 1}`, rateColumn))
        .filter((i): i is PresetItem => i !== null);
      if (items.length) out.push({ id: groupId, code: group.code, bill: bill.no, title: group.title, category, items });
    });
  });
  return out;
}
