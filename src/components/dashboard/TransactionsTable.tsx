"use client";

import { Card } from "@/components/ui/Card";
import { StateMessage } from "@/components/ui/StateMessage";
import type { Company, Transaction } from "@/lib/types/domain";
import { cn } from "@/lib/utils/cn";
import type { SortBy, SortDir, StatusFilter } from "@/lib/validation/schemas";

import { TableToolbar } from "./TableToolbar";
import { TransactionRow } from "./TransactionRow";

const COLUMN_COUNT = 7;

function SortHeader({
  label,
  column,
  sortBy,
  sortDir,
  onSort,
  align = "left",
}: {
  label: string;
  column: SortBy;
  sortBy: SortBy;
  sortDir: SortDir;
  onSort: (column: SortBy) => void;
  align?: "left" | "right";
}) {
  const active = sortBy === column;
  return (
    <th className={cn("px-4 py-3", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors",
          active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
        )}
      >
        {label}
        <span className="text-[10px] leading-none">
          {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

function PlainHeader({
  label,
  align = "left",
}: {
  label: string;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
        align === "right" && "text-right",
      )}
    >
      {label}
    </th>
  );
}

export interface TransactionsTableProps {
  transactions: Transaction[] | undefined;
  companies: Company[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  onRetry: () => void;
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
  sortBy: SortBy;
  sortDir: SortDir;
  onSort: (column: SortBy) => void;
  isRowBusy: (transactionId: string) => boolean;
  onIgnore: (transactionId: string) => void;
  onRestore: (transactionId: string) => void;
  onManualMatch: (transactionId: string, companyId: string) => void;
}

export function TransactionsTable({
  transactions,
  companies,
  isLoading,
  isFetching,
  error,
  onRetry,
  status,
  onStatusChange,
  search,
  onSearchChange,
  sortBy,
  sortDir,
  onSort,
  isRowBusy,
  onIgnore,
  onRestore,
  onManualMatch,
}: TransactionsTableProps) {
  const showSkeleton = isLoading && !transactions;
  const isEmpty = !error && !showSkeleton && transactions?.length === 0;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-4">
        <TableToolbar
          status={status}
          onStatusChange={onStatusChange}
          search={search}
          onSearchChange={onSearchChange}
          isFetching={isFetching}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-slate-50">
            <tr>
              <SortHeader
                label="Date"
                column="date"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
              />
              <PlainHeader label="Sender" />
              <PlainHeader label="Tax ID" />
              <SortHeader
                label="Amount"
                column="amount"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                align="right"
              />
              <PlainHeader label="Status" />
              <PlainHeader label="Matched company" />
              <PlainHeader label="Action" align="right" />
            </tr>
          </thead>

          <tbody
            className={cn(
              "transition-opacity",
              isFetching && transactions ? "opacity-60" : "opacity-100",
            )}
          >
            {error ? (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <StateMessage
                    tone="error"
                    title="Couldn't load transactions"
                    description={error.message}
                    action={
                      <button
                        type="button"
                        onClick={onRetry}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                      >
                        Retry
                      </button>
                    }
                  />
                </td>
              </tr>
            ) : null}

            {showSkeleton
              ? Array.from({ length: 6 }).map((_, rowIndex) => (
                  <tr
                    key={`skeleton-${rowIndex}`}
                    className="border-t border-slate-100"
                  >
                    {Array.from({ length: COLUMN_COUNT }).map((__, cellIndex) => (
                      <td key={`cell-${cellIndex}`} className="px-4 py-3">
                        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}

            {isEmpty ? (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <StateMessage
                    title="No transactions"
                    description="No transactions match the current filters for this month."
                  />
                </td>
              </tr>
            ) : null}

            {!error && !showSkeleton
              ? transactions?.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    companies={companies}
                    busy={isRowBusy(transaction.id)}
                    onIgnore={onIgnore}
                    onRestore={onRestore}
                    onManualMatch={onManualMatch}
                  />
                ))
              : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
