import { z } from "zod";

/**
 * Zod schemas for validating request/query parameters at the server boundary
 * (route handlers + server actions). Filter/search inputs are parsed here so
 * the rest of the code works with trusted, typed values.
 */

/** `YYYY-MM` month key. */
export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must be in YYYY-MM format");

/** Status filter for the transactions table (includes the "all" sentinel). */
export const statusFilterSchema = z
  .enum(["all", "matched", "unmatched", "ignored"])
  .default("all");
export type StatusFilter = z.infer<typeof statusFilterSchema>;

export const sortBySchema = z.enum(["date", "amount"]).default("date");
export type SortBy = z.infer<typeof sortBySchema>;

export const sortDirSchema = z.enum(["asc", "desc"]).default("desc");
export type SortDir = z.infer<typeof sortDirSchema>;

/** Query params for `GET /api/transactions`. */
export const transactionQuerySchema = z.object({
  month: monthKeySchema,
  status: statusFilterSchema,
  search: z.string().trim().max(120).catch("").default(""),
  sortBy: sortBySchema,
  sortDir: sortDirSchema,
});
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;

/** Query params for `GET /api/summary`. */
export const summaryQuerySchema = z.object({ month: monthKeySchema });
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;

/** Payload for the manual-match server action. */
export const manualMatchSchema = z.object({
  transactionId: z.string().uuid(),
  companyId: z.string().uuid(),
});
export type ManualMatchInput = z.infer<typeof manualMatchSchema>;

/** Payload for ignore / restore server actions. */
export const transactionIdSchema = z.object({
  transactionId: z.string().uuid(),
});
export type TransactionIdInput = z.infer<typeof transactionIdSchema>;

/**
 * Parse a `URLSearchParams`-like object against a schema, ignoring absent keys
 * so schema defaults apply. Throws `ZodError` on invalid values.
 */
export function parseSearchParams<T extends z.ZodTypeAny>(
  schema: T,
  params: URLSearchParams,
): z.infer<T> {
  const raw: Record<string, string> = {};
  for (const [key, value] of params.entries()) raw[key] = value;
  return schema.parse(raw);
}
