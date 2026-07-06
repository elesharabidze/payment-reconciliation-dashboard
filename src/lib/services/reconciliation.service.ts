import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import type {
  Company,
  CompanyReconciliation,
  Contract,
  MonthlyStats,
  ReconciliationSummary,
  ReconStatus,
  Transaction,
} from "@/lib/types/domain";
import {
  expectedAmountForMonth,
  isContractActiveInMonth,
} from "@/lib/utils/contracts";
import { round2 } from "@/lib/utils/math";

import { getCompanies } from "./companies.service";
import { ServiceError } from "./errors";

type Client = SupabaseClient<Database>;

export interface MatchRunResult {
  /** Transactions newly matched in this run. */
  matchedCount: number;
  /** Unmatched transactions scanned. */
  totalScanned: number;
  /** Still unmatched after the run (unknown senders). */
  unmatchedRemaining: number;
}

/**
 * INN-exact auto-matching. Runs on the server (Next.js server action → this
 * function), in TypeScript, over the typed service layer.
 *
 * Strategy: load the tax_id → company map, find which unmatched INNs are
 * matchable, then issue one set-based UPDATE per matched tax_id
 * (`WHERE sender_inn = ? AND status = 'unmatched'`). This is idempotent and
 * touches only the rows that need changing — at most one UPDATE per company.
 *
 * Matching is INN-only by design: sender names vary (e.g. "გეოტრანსი (ფილიალი)"
 * vs "შპს გეოტრანსი" share INN 404871234) so they are never used to match.
 * `ignored` transactions are left untouched.
 */
export async function runInnMatching(client: Client): Promise<MatchRunResult> {
  const companies = await getCompanies(client);
  const companyIdByTaxId = new Map(companies.map((c) => [c.taxId, c.id]));

  const { data: unmatched, error } = await client
    .from("bank_transactions")
    .select("id, sender_inn")
    .eq("status", "unmatched");

  if (error) {
    throw new ServiceError("Failed to load unmatched transactions", error);
  }

  const taxIdsToMatch = new Set<string>();
  for (const row of unmatched) {
    if (row.sender_inn && companyIdByTaxId.has(row.sender_inn)) {
      taxIdsToMatch.add(row.sender_inn);
    }
  }

  let matchedCount = 0;
  for (const taxId of taxIdsToMatch) {
    const companyId = companyIdByTaxId.get(taxId);
    if (!companyId) continue;

    const { data: updated, error: updateError } = await client
      .from("bank_transactions")
      .update({
        matched_company_id: companyId,
        match_method: "inn_exact",
        match_confidence: 1.0,
        status: "matched",
      })
      .eq("sender_inn", taxId)
      .eq("status", "unmatched")
      .select("id");

    if (updateError) {
      throw new ServiceError("Failed to apply INN match", updateError);
    }
    matchedCount += updated?.length ?? 0;
  }

  return {
    matchedCount,
    totalScanned: unmatched.length,
    unmatchedRemaining: unmatched.length - matchedCount,
  };
}

function computeStats(
  month: string,
  transactions: readonly Transaction[],
): MonthlyStats {
  let totalAmount = 0;
  let matchedCount = 0;
  let matchedAmount = 0;
  let unmatchedCount = 0;
  let unmatchedAmount = 0;
  let ignoredCount = 0;
  let ignoredAmount = 0;

  for (const tx of transactions) {
    totalAmount += tx.amount;
    if (tx.status === "matched") {
      matchedCount += 1;
      matchedAmount += tx.amount;
    } else if (tx.status === "unmatched") {
      unmatchedCount += 1;
      unmatchedAmount += tx.amount;
    } else {
      ignoredCount += 1;
      ignoredAmount += tx.amount;
    }
  }

  // Match rate is measured over actionable transactions; ignored ones are
  // intentionally set aside and excluded from the denominator.
  const actionable = matchedCount + unmatchedCount;
  const matchRate = actionable === 0 ? 0 : matchedCount / actionable;

  return {
    month,
    totalCount: transactions.length,
    totalAmount: round2(totalAmount),
    matchedCount,
    matchedAmount: round2(matchedAmount),
    unmatchedCount,
    unmatchedAmount: round2(unmatchedAmount),
    ignoredCount,
    ignoredAmount: round2(ignoredAmount),
    matchRate,
  };
}

function resolveStatus(expected: number, actual: number): ReconStatus {
  if (expected === 0) return "no_contract";
  if (actual === 0) return "unpaid";
  if (actual > expected) return "over";
  if (actual === expected) return "met";
  return "under";
}

/**
 * Pure computation of the month's reconciliation summary from already-loaded
 * data. Kept side-effect-free so it is trivial to reason about and test.
 *
 * - `expected` = Σ monthly_amount of the company's contracts active in `month`
 *   (see `isContractActiveInMonth`).
 * - `actual`   = Σ amount of the company's matched transactions in `month`
 *   (includes partial, prepaid and duplicate payments — so actual may exceed
 *   or fall short of expected).
 * A company is listed if it has an active contract OR a payment this month.
 */
export function computeSummary(input: {
  month: string;
  companies: readonly Company[];
  contracts: readonly Contract[];
  transactions: readonly Transaction[];
}): ReconciliationSummary {
  const { month, companies, contracts, transactions } = input;

  const contractsByCompany = new Map<string, Contract[]>();
  for (const contract of contracts) {
    const list = contractsByCompany.get(contract.companyId);
    if (list) list.push(contract);
    else contractsByCompany.set(contract.companyId, [contract]);
  }

  const paidByCompany = new Map<string, { amount: number; count: number }>();
  for (const tx of transactions) {
    if (tx.status !== "matched" || !tx.matchedCompanyId) continue;
    const agg = paidByCompany.get(tx.matchedCompanyId) ?? {
      amount: 0,
      count: 0,
    };
    agg.amount += tx.amount;
    agg.count += 1;
    paidByCompany.set(tx.matchedCompanyId, agg);
  }

  const companyRows: CompanyReconciliation[] = [];
  for (const company of companies) {
    const companyContracts = contractsByCompany.get(company.id) ?? [];
    const expected = round2(expectedAmountForMonth(companyContracts, month));
    const paid = paidByCompany.get(company.id) ?? { amount: 0, count: 0 };
    const actual = round2(paid.amount);

    // Skip companies with no activity this month (no expected, no payment).
    if (expected === 0 && actual === 0) continue;

    companyRows.push({
      companyId: company.id,
      companyName: company.name,
      taxId: company.taxId,
      expectedAmount: expected,
      actualAmount: actual,
      difference: round2(actual - expected),
      activeContractCount: companyContracts.filter((c) =>
        isContractActiveInMonth(c, month),
      ).length,
      paymentCount: paid.count,
      status: resolveStatus(expected, actual),
    });
  }

  companyRows.sort((a, b) => a.companyName.localeCompare(b.companyName, "ka"));

  return {
    month,
    stats: computeStats(month, transactions),
    companies: companyRows,
  };
}
