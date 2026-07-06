/**
 * Date helpers that operate on ISO date strings (`YYYY-MM-DD`) and month keys
 * (`YYYY-MM`). We deliberately avoid the `Date` object for month math so there
 * are no timezone surprises — ISO date strings sort and compare lexically.
 */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** `2026-04-03` → `2026-04` */
export function monthKeyOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** `2026-04` → `2026-04-01` */
export function firstDayOfMonth(monthKey: string): string {
  return `${monthKey}-01`;
}

/** `2026-04` → `2026-05-01` (exclusive upper bound for range queries) */
export function firstDayOfNextMonth(monthKey: string): string {
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

/** `2026-04` → `April 2026` */
export function monthLabel(monthKey: string): string {
  const year = monthKey.slice(0, 4);
  const monthIndex = Number(monthKey.slice(5, 7)) - 1;
  const name = MONTH_NAMES[monthIndex] ?? monthKey;
  return `${name} ${year}`;
}

/** `2026-04-03` → `03 Apr 2026` */
export function formatDate(isoDate: string): string {
  const year = isoDate.slice(0, 4);
  const monthIndex = Number(isoDate.slice(5, 7)) - 1;
  const day = isoDate.slice(8, 10);
  const name = MONTH_NAMES[monthIndex]?.slice(0, 3) ?? "";
  return `${day} ${name} ${year}`;
}

/** Distinct month keys present in a list of ISO dates, sorted ascending. */
export function distinctMonthKeys(isoDates: readonly string[]): string[] {
  const set = new Set<string>();
  for (const date of isoDates) set.add(monthKeyOf(date));
  return [...set].sort();
}
