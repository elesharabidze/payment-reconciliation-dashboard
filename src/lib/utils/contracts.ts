import type { Contract } from "@/lib/types/domain";

import { firstDayOfMonth } from "./dates";

/**
 * Whether a contract counts toward a month's EXPECTED billing.
 *
 * A contract is considered active for a month if it was active on the **first
 * day** of that month, with `end_date` treated as **exclusive** — i.e. the
 * contract is no longer active on its end/pause date.
 *
 *   active_on(d)  ⟺  start_date <= d  AND  (end_date IS NULL OR d < end_date)
 *
 * We evaluate this at `d = first day of the month`. This single, documented
 * rule produces the behaviour the dataset intends:
 *
 *   • Safe Transport (paused 2026-05-15): active in April & May, NOT June.
 *   • Urban Movers   (ended  2026-04-30): active in April, NOT May/June.
 *   • Rustavi 2nd    (paused 2026-04-01): NOT active in April
 *       (its April payment is labelled "March remaining debt", so the
 *        contract is correctly excluded from April's expected total).
 */
export function isContractActiveInMonth(
  contract: Contract,
  monthKey: string,
): boolean {
  const firstDay = firstDayOfMonth(monthKey);
  const hasStarted = contract.startDate <= firstDay;
  const notEnded = contract.endDate === null || firstDay < contract.endDate;
  return hasStarted && notEnded;
}

/** Sum of monthly amounts for a company's contracts active in the month. */
export function expectedAmountForMonth(
  contracts: readonly Contract[],
  monthKey: string,
): number {
  return contracts.reduce(
    (total, contract) =>
      isContractActiveInMonth(contract, monthKey)
        ? total + contract.monthlyAmount
        : total,
    0,
  );
}
