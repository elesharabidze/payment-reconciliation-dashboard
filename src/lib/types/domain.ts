/**
 * Domain types used across the app (camelCase). The service layer maps raw
 * database rows (snake_case, see `database.ts`) into these shapes.
 */

import type {
  ContractStatus,
  MatchMethod,
  TransactionStatus,
} from "./database";

export type { ContractStatus, MatchMethod, TransactionStatus };

export interface Company {
  id: string;
  name: string;
  taxId: string;
}

export interface Contract {
  id: string;
  companyId: string;
  monthlyAmount: number;
  status: ContractStatus;
  startDate: string;
  endDate: string | null;
}

export interface Transaction {
  id: string;
  docKey: string;
  entryDate: string;
  amount: number;
  currency: string;
  senderName: string | null;
  senderInn: string | null;
  senderAccount: string | null;
  purpose: string | null;
  matchedCompanyId: string | null;
  matchedCompanyName: string | null;
  matchMethod: MatchMethod | null;
  matchConfidence: number | null;
  status: TransactionStatus;
}

/** Aggregate stats for the stats bar — computed over ALL transactions in a
 * month, independent of the table's active status filter. */
export interface MonthlyStats {
  month: string;
  totalCount: number;
  totalAmount: number;
  matchedCount: number;
  matchedAmount: number;
  unmatchedCount: number;
  unmatchedAmount: number;
  ignoredCount: number;
  ignoredAmount: number;
  /** matched / (matched + unmatched) by count, 0..1. Ignored is excluded. */
  matchRate: number;
}

/**
 * Reconciliation status for a company in a given month:
 * - `over`   — paid more than expected (prepayment / duplicate) → green
 * - `met`    — paid at least the expected amount → green
 * - `under`  — paid something but less than expected (partial) → red
 * - `unpaid` — expected a payment but received nothing → grey
 * - `no_contract` — no active contract this month but a payment arrived → grey
 */
export type ReconStatus = "over" | "met" | "under" | "unpaid" | "no_contract";

export interface CompanyReconciliation {
  companyId: string;
  companyName: string;
  taxId: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  activeContractCount: number;
  paymentCount: number;
  status: ReconStatus;
}

export interface ReconciliationSummary {
  month: string;
  stats: MonthlyStats;
  companies: CompanyReconciliation[];
}

export interface MonthOption {
  key: string;
  label: string;
}
