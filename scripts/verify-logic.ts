/**
 * Runtime verification of the core reconciliation logic against the tricky
 * cases in the seed data. Run with: `npx tsx scripts/verify-logic.ts`.
 *
 * This exercises the REAL code (computeSummary + isContractActiveInMonth), not
 * a copy — the service layer takes the DB client as a parameter and
 * computeSummary is pure, so no database is needed.
 */
import { computeSummary } from "../src/lib/services/reconciliation.service";
import type { Company, Contract, Transaction } from "../src/lib/types/domain";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `${ok ? "✓" : "✗"} ${label} → ${JSON.stringify(actual)}${
      ok ? "" : ` (expected ${JSON.stringify(expected)})`
    }`,
  );
}

const companies: Company[] = [
  { id: "geo", name: "შპს გეოტრანსი", taxId: "404871234" },
  { id: "safe", name: "შპს სეიფ ტრანსპორტი", taxId: "405234567" },
  { id: "urban", name: "შპს ურბან მუვერსი", taxId: "404553311" },
  { id: "rustavi", name: "შპს რუსთავი ტრანსი", taxId: "404112299" },
  { id: "eco", name: "შპს ეკო ტრანსპორტი", taxId: "405111222" },
  { id: "agmo", name: "სს აღმოსავლეთ გადაზიდვები", taxId: "204112233" },
];

const contracts: Contract[] = [
  { id: "c-geo", companyId: "geo", monthlyAmount: 1500, status: "active", startDate: "2025-03-01", endDate: null },
  { id: "c-safe", companyId: "safe", monthlyAmount: 1800, status: "paused", startDate: "2025-04-01", endDate: "2026-05-15" },
  { id: "c-urban", companyId: "urban", monthlyAmount: 1600, status: "ended", startDate: "2024-12-01", endDate: "2026-04-30" },
  { id: "c-rust1", companyId: "rustavi", monthlyAmount: 1100, status: "active", startDate: "2025-08-01", endDate: null },
  { id: "c-rust2", companyId: "rustavi", monthlyAmount: 800, status: "paused", startDate: "2025-03-01", endDate: "2026-04-01" },
  { id: "c-eco1", companyId: "eco", monthlyAmount: 750, status: "active", startDate: "2025-05-01", endDate: null },
  { id: "c-eco2", companyId: "eco", monthlyAmount: 1100, status: "active", startDate: "2025-07-01", endDate: null },
  { id: "c-agmo1", companyId: "agmo", monthlyAmount: 4500, status: "active", startDate: "2025-11-01", endDate: null },
  { id: "c-agmo2", companyId: "agmo", monthlyAmount: 2000, status: "ended", startDate: "2024-06-01", endDate: "2025-10-31" },
];

function tx(over: Partial<Transaction> & { id: string; entryDate: string; amount: number }): Transaction {
  return {
    docKey: over.id, currency: "GEL", senderName: null, senderInn: null,
    senderAccount: null, purpose: null, matchedCompanyId: null,
    matchedCompanyName: null, matchMethod: null, matchConfidence: null,
    status: "unmatched", ...over,
  };
}

function expectedFor(month: string, companyId: string): number {
  const row = computeSummary({ month, companies, contracts, transactions: [] })
    .companies.find((c) => c.companyId === companyId);
  return row?.expectedAmount ?? 0;
}

console.log("— Expected amount by month (contract end_date edge cases) —");
check("Safe Transport expected April", expectedFor("2026-04", "safe"), 1800);
check("Safe Transport expected May", expectedFor("2026-05", "safe"), 1800);
check("Safe Transport expected June (paused May 15)", expectedFor("2026-06", "safe"), 0);
check("Urban Movers expected April", expectedFor("2026-04", "urban"), 1600);
check("Urban Movers expected May (ended Apr 30)", expectedFor("2026-05", "urban"), 0);
check("Rustavi expected April (800 paused Apr 1 excluded)", expectedFor("2026-04", "rustavi"), 1100);
check("Eco Transport expected (two active contracts)", expectedFor("2026-06", "eco"), 1850);
check("Agmosavlet expected (ended 2000 excluded)", expectedFor("2026-06", "agmo"), 4500);

console.log("\n— Stats + reconciliation status (June) —");
const juneTx: Transaction[] = [
  tx({ id: "t1", entryDate: "2026-06-03", amount: 1500, status: "matched", matchedCompanyId: "geo" }),
  tx({ id: "t2", entryDate: "2026-06-20", amount: 3000, status: "matched", matchedCompanyId: "geo" }),
  tx({ id: "t3", entryDate: "2026-06-06", amount: 1800, status: "matched", matchedCompanyId: "safe" }),
  tx({ id: "t4", entryDate: "2026-06-06", amount: 1100, status: "matched", matchedCompanyId: "rustavi" }),
  tx({ id: "t5", entryDate: "2026-06-07", amount: 2500, status: "unmatched", senderInn: "409999888" }),
  tx({ id: "t6", entryDate: "2026-06-14", amount: 500, status: "ignored", senderInn: "01234567890" }),
];
const summary = computeSummary({ month: "2026-06", companies, contracts, transactions: juneTx });
const byId = (id: string) => summary.companies.find((c) => c.companyId === id);

check("total count", summary.stats.totalCount, 6);
check("matched count", summary.stats.matchedCount, 4);
check("unmatched count", summary.stats.unmatchedCount, 1);
check("ignored count", summary.stats.ignoredCount, 1);
check("match rate (4 / 5 actionable)", summary.stats.matchRate, 0.8);
check("Geo overpaid (4500 vs 1500) → over", byId("geo")?.status, "over");
check("Geo actual", byId("geo")?.actualAmount, 4500);
check("Safe paid but no active contract → no_contract", byId("safe")?.status, "no_contract");
check("Rustavi met (1100 vs 1100) → met", byId("rustavi")?.status, "met");
check("Urban unpaid (expected 0 June, no pay) → not listed", byId("urban"), undefined);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
