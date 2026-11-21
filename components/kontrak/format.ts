// Display helpers shared by the Kontrak screens (labels and dates only; no business rules).
import { Formatter } from '../../services/Formatter';
import type { ApiError } from '../../services/apiService';
import type { Contract, RateBookSource } from '../../types';

const MONTHS = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];

/** "12 Mac 2026" from an ISO date or timestamp; "-" when empty. */
export function shortDate(iso?: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "12 Mac 2026, 14:05" for commit-log entries. */
export function stamp(iso?: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${shortDate(iso)}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function validity(c: Pick<Contract, 'validFrom' | 'validTo'>): string {
  if (!c.validFrom && !c.validTo) return 'Tempoh sah belum ditetapkan';
  return `${shortDate(c.validFrom)} – ${c.validTo ? shortDate(c.validTo) : 'terbuka'}`;
}

export const KIND_LABEL: Record<Contract['kind'], string> = { PANEL: 'Panel', STANDALONE: 'Berasingan' };

export const SOURCE_LABEL: Record<RateBookSource, string> = {
  LEGACY: 'Migrasi data lama',
  IMPORT: 'Import Excel',
  CLONE: 'Salinan kontrak lain',
  EDIT: 'Suntingan Pustaka',
};

export const money = (n: number | null | undefined): string => Formatter.formatCurrency(n ?? null);

/** The server's own reason (e.g. "Kod … sudah wujud") when there is one, else the caller's text. */
export function errorText(err: unknown): string {
  const e = err as Partial<ApiError> | null;
  return e?.serverMessage || e?.message || 'Ralat tidak dijangka. Sila cuba lagi.';
}

export const plural = (n: number, word: string): string => `${n.toLocaleString('ms-MY')} ${word}`;
