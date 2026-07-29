import { useState } from 'react';
import { getQueryNumber } from './appUrl';

export function useSelectedYear(): [number, (y: number) => void] {
  const fallback = new Date().getFullYear();
  const [year, setYear] = useState<number>(() => getQueryNumber('year') ?? fallback);

  const changeYear = (y: number) => {
    setYear(y);
    const u = new URL(window.location.href);
    u.searchParams.set('year', String(y));
    window.history.replaceState({}, '', u.toString());
  };

  return [year, changeYear];
}
