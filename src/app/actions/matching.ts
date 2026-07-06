"use server";

/**
 * Server actions — the mutation half of the app. The matching logic lives here
 * (server-side, in TypeScript, over the typed service layer) rather than on the
 * client or in the database. Inputs are re-validated with Zod at this trust
 * boundary even though callers are typed.
 */

import {
  runInnMatching,
  type MatchRunResult,
} from "@/lib/services/reconciliation.service";
import {
  ignoreTransaction,
  restoreTransaction,
  setManualMatch,
} from "@/lib/services/transactions.service";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  type ManualMatchInput,
  manualMatchSchema,
  type TransactionIdInput,
  transactionIdSchema,
} from "@/lib/validation/schemas";

/** Run INN-exact auto-matching across all currently unmatched transactions. */
export async function runMatchingAction(): Promise<MatchRunResult> {
  const client = getServerSupabase();
  return runInnMatching(client);
}

/** Mark a transaction as ignored. */
export async function ignoreTransactionAction(
  input: TransactionIdInput,
): Promise<void> {
  const { transactionId } = transactionIdSchema.parse(input);
  const client = getServerSupabase();
  await ignoreTransaction(client, transactionId);
}

/** Reset a transaction back to unmatched. */
export async function restoreTransactionAction(
  input: TransactionIdInput,
): Promise<void> {
  const { transactionId } = transactionIdSchema.parse(input);
  const client = getServerSupabase();
  await restoreTransaction(client, transactionId);
}

/** Manually match a transaction to a company. */
export async function manualMatchAction(
  input: ManualMatchInput,
): Promise<void> {
  const { transactionId, companyId } = manualMatchSchema.parse(input);
  const client = getServerSupabase();
  await setManualMatch(client, transactionId, companyId);
}
