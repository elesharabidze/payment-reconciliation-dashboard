/** Display formatting helpers. */

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("en-US");

/** `1500` → `1,500.00 ₾` */
export function formatGel(amount: number): string {
  return `${amountFormatter.format(amount)} ₾`;
}

/** `1500` → `+1,500.00 ₾` / `-300` → `-300.00 ₾` (signed, for differences) */
export function formatSignedGel(amount: number): string {
  const sign = amount > 0 ? "+" : "";
  return `${sign}${amountFormatter.format(amount)} ₾`;
}

/** `12` → `12` */
export function formatCount(value: number): string {
  return integerFormatter.format(value);
}

/** `0.842` → `84.2%` */
export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}
