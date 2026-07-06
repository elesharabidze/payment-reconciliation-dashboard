import type { TransactionQuery } from "@/lib/validation/schemas";

/**
 * Central query-key factory. Prefixes (`["transactions"]`, `["summary"]`) are
 * shared so mutations can invalidate whole families at once.
 */
export const queryKeys = {
  months: ["months"] as const,
  companies: ["companies"] as const,
  transactions: (params: TransactionQuery) =>
    ["transactions", params] as const,
  transactionsRoot: ["transactions"] as const,
  summary: (month: string) => ["summary", month] as const,
  summaryRoot: ["summary"] as const,
};
