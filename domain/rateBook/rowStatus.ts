// Indicator for one BQ row against the project's rate book: has its source line changed or gone?
import type { BQItem, BQRowStatus, PresetGroup } from '../../types';
import { findSource, indexBook, normText, normUnit, sameMoney, type BookIndex } from './rows';

export type RowStatus = BQRowStatus;

export function rowStatus(bqItem: BQItem, book: PresetGroup[] | BookIndex): RowStatus {
  if (bqItem.type !== 'ITEM' || !bqItem.sourceItemId) return 'OK';
  const index = Array.isArray(book) ? indexBook(book) : book;
  const source = findSource(index, bqItem.sourceItemId, bqItem.sourceVariantId);
  if (!source) return 'TIADA';
  if (!sameMoney(bqItem.rate, source.rate)) return 'KADAR_BERUBAH';
  // createItem copies the variant label (or the item description) into description.
  const wording = source.variantId ? source.label : source.itemDescription;
  if (normText(bqItem.description) !== normText(wording) || normUnit(bqItem.unit) !== normUnit(source.unit)) return 'PERKATAAN_BERUBAH';
  return 'OK';
}
