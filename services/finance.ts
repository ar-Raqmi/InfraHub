// Liquidated & Ascertained Damages (LAD) finance helpers.
// Single source of truth for the daily penalty rate used by the LAD/Notis
// PDF exporters and the LAD/NotisGenerator certificate pages.

// Pekeliling standard constants
export const LAD_SMALL_PROJECT_THRESHOLD = 20000;
export const LAD_SMALL_PROJECT_DAILY_RATE = 20.00;
export const LAD_BLR = 6.65;
export const LAD_TREASURY_RATE = 0.25;
export const LAD_EFFECTIVE_RATE = LAD_BLR - LAD_TREASURY_RATE; // 6.4

// Liquidated damages daily rate (RM/day) for a given contract sum, rounded to
// 2 decimal places. Small projects (< threshold) pay a flat daily rate.
export function calculateLADDailyRate(contractSum: number): number {
  const sum = contractSum || 0;
  let dailyRate: number;
  if (sum < LAD_SMALL_PROJECT_THRESHOLD) {
    dailyRate = LAD_SMALL_PROJECT_DAILY_RATE;
  } else {
    dailyRate = (sum * (LAD_EFFECTIVE_RATE / 100)) / 365;
  }
  return Math.round((dailyRate + Number.EPSILON) * 100) / 100;
}
