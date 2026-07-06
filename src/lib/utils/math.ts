/** Round to 2 decimal places to avoid floating-point drift in money sums. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
