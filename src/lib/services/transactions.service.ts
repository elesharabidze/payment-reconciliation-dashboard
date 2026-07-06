import type { SupabaseClient } from "@supabase/supabase-js";

import type { BankTransactionRow, Database } from "@/lib/types/database";
import type { Company, MonthOption, Transaction } from "@/lib/types/domain";
import {
  distinctMonthKeys,
  firstDayOfMonth,
  firstDayOfNextMonth,
  monthLabel,
} from "@/lib/utils/dates";
import type { TransactionQuery } from "@/lib/validation/schemas";

import { ServiceError } from "./errors";

type Client = SupabaseClient<Database>;

function mapTransaction(
  row: BankTransactionRow,
  companyNameById: Map<string, string>,
): Transaction {
  return {
    id: row.id,
    docKey: row.doc_key,
    entryDate: row.entry_date,
    amount: Number(row.amount),
    currency: row.currency,
    senderName: row.sender_name,
    senderInn: row.sender_inn,
    senderAccount: row.sender_account,
    purpose: row.purpose,
    matchedCompanyId: row.matched_company_id,
    matchedCompanyName: row.matched_company_id
      ? (companyNameById.get(row.matched_company_id) ?? null)
      : null,
    matchMethod: row.match_method,
    matchConfidence:
      row.match_confidence === null ? null : Number(row.match_confidence),
    status: row.status,
  };
}

/** Remove characters that would break PostgREST's `or()` filter grammar. */
function sanitizeSearch(term: string): string {
  return term.replace(/[%,()*\\]/g, " ").trim();
}

/** Distinct months present in the data, ascending, with display labels. */
export async function getAvailableMonths(
  client: Client,
): Promise<MonthOption[]> {
  const { data, error } = await client
    .from("bank_transactions")
    .select("entry_date")
    .order("entry_date", { ascending: true });

  if (error) throw new ServiceError("Failed to load available months", error);
  return distinctMonthKeys(data.map((row) => row.entry_date)).map((key) => ({
    key,
    label: monthLabel(key),
  }));
}

/**
 * All transactions in a month, unfiltered — the basis for the stats bar and the
 * expected-vs-actual summary (which must reflect the whole month, not the
 * table's active filter).
 */
export async function getMonthTransactions(
  client: Client,
  month: string,
  companies: readonly Company[],
): Promise<Transaction[]> {
  const nameById = new Map(companies.map((c) => [c.id, c.name]));
  const { data, error } = await client
    .from("bank_transactions")
    .select("*")
    .gte("entry_date", firstDayOfMonth(month))
    .lt("entry_date", firstDayOfNextMonth(month))
    .order("entry_date", { ascending: true });

  if (error) throw new ServiceError("Failed to load transactions", error);
  return data.map((row) => mapTransaction(row, nameById));
}

/**
 * Transactions for the table: month-scoped, status-filtered, searchable, and
 * sorted server-side. Search matches sender name/INN and — so "search by
 * company name" works even when the sender name differs — matched company name.
 */
export async function queryTransactions(
  client: Client,
  query: TransactionQuery,
  companies: readonly Company[],
): Promise<Transaction[]> {
  const nameById = new Map(companies.map((c) => [c.id, c.name]));

  let builder = client
    .from("bank_transactions")
    .select("*")
    .gte("entry_date", firstDayOfMonth(query.month))
    .lt("entry_date", firstDayOfNextMonth(query.month));

  if (query.status !== "all") {
    builder = builder.eq("status", query.status);
  }

  const search = sanitizeSearch(query.search);
  if (search.length > 0) {
    const pattern = `%${search}%`;
    const conditions = [
      `sender_name.ilike.${pattern}`,
      `sender_inn.ilike.${pattern}`,
    ];
    const term = search.toLowerCase();
    const matchedCompanyIds = companies
      .filter(
        (c) => c.name.toLowerCase().includes(term) || c.taxId.includes(search),
      )
      .map((c) => c.id);
    if (matchedCompanyIds.length > 0) {
      conditions.push(`matched_company_id.in.(${matchedCompanyIds.join(",")})`);
    }
    builder = builder.or(conditions.join(","));
  }

  const sortColumn = query.sortBy === "amount" ? "amount" : "entry_date";
  builder = builder
    .order(sortColumn, { ascending: query.sortDir === "asc" })
    .order("doc_key", { ascending: true });

  const { data, error } = await builder;
  if (error) throw new ServiceError("Failed to query transactions", error);
  return data.map((row) => mapTransaction(row, nameById));
}

/** Mark a transaction as ignored (excluded from match-rate). */
export async function ignoreTransaction(
  client: Client,
  transactionId: string,
): Promise<void> {
  const { error } = await client
    .from("bank_transactions")
    .update({ status: "ignored" })
    .eq("id", transactionId);

  if (error) throw new ServiceError("Failed to ignore transaction", error);
}

/** Reset a transaction back to unmatched, clearing any match metadata. */
export async function restoreTransaction(
  client: Client,
  transactionId: string,
): Promise<void> {
  const { error } = await client
    .from("bank_transactions")
    .update({
      status: "unmatched",
      matched_company_id: null,
      match_method: null,
      match_confidence: null,
    })
    .eq("id", transactionId);

  if (error) throw new ServiceError("Failed to restore transaction", error);
}

/** Manually attach a transaction to a company (match_method = 'manual'). */
export async function setManualMatch(
  client: Client,
  transactionId: string,
  companyId: string,
): Promise<void> {
  const { data, error } = await client
    .from("bank_transactions")
    .update({
      matched_company_id: companyId,
      match_method: "manual",
      match_confidence: 1.0,
      status: "matched",
    })
    .eq("id", transactionId)
    .select("id");

  if (error) throw new ServiceError("Failed to set manual match", error);
  if (!data || data.length === 0) {
    throw new ServiceError("Transaction not found or could not be matched");
  }
}
