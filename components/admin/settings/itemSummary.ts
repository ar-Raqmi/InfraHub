import { PresetItem } from '../../../types';
import { formatRM } from './format';

export function itemSummary(item: PresetItem): string {
  const variants = item.variants || [];
  if (variants.length === 0) return [item.unit, formatRM(item.rate ?? 0)].filter(Boolean).join(' · ');
  const rates = variants.map(v => v.rate || 0);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const range = min === max ? formatRM(min) : `${formatRM(min)} – ${formatRM(max)}`;
  return [`${variants.length} varian`, variants[0].unit, range].filter(Boolean).join(' · ');
}
