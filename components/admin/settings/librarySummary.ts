import { PresetGroup } from '../../../types';

export function librarySummary(groups: PresetGroup[]): string {
  const categories = new Set(groups.map(g => g.category)).size;
  const items = groups.reduce((n, g) => n + g.items.length, 0);
  return `${categories} kategori · ${groups.length} kumpulan · ${items} item`;
}
