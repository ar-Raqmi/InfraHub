// Word-level difference for showing what an officer is approving: old words dropped, new words added.
// Presentation only (the match itself is decided by domain/rateBook/matchItems).

export interface WordPart {
  text: string;
  changed: boolean;
}

const split = (s: string): string[] => s.split(/(\s+)/).filter(Boolean);
const norm = (w: string) => w.toLowerCase().replace(/[.,;:()]/g, '');
const MAX_CELLS = 250_000; // ~500 x 500 words; beyond that, show the text unmarked

/** Marks the words of `a` that are not in the longest common word sequence with `b`. */
export function markChanged(a: string, b: string): WordPart[] {
  const wa = split(a);
  const wb = split(b);
  if (wa.length * wb.length > MAX_CELLS) return [{ text: a, changed: false }];
  const n = wa.length, m = wb.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = norm(wa[i]) === norm(wb[j]) ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const parts: WordPart[] = [];
  let i = 0, j = 0;
  while (i < n) {
    if (j < m && norm(wa[i]) === norm(wb[j])) { parts.push({ text: wa[i], changed: false }); i++; j++; }
    else if (j < m && lcs[i][j + 1] >= lcs[i + 1][j]) j++;
    else { parts.push({ text: wa[i], changed: /\S/.test(wa[i]) }); i++; }
  }
  return parts;
}
