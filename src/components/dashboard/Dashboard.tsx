"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useCompanies } from "@/hooks/useCompanies";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRunMatching } from "@/hooks/useMatching";
import { useMonths } from "@/hooks/useMonths";
import { useSummary } from "@/hooks/useSummary";
import {
  useIgnoreTransaction,
  useManualMatch,
  useRestoreTransaction,
} from "@/hooks/useTransactionActions";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCount } from "@/lib/utils/format";
import type {
  SortBy,
  SortDir,
  StatusFilter,
  TransactionQuery,
} from "@/lib/validation/schemas";

import { ExpectedVsActual } from "./ExpectedVsActual";
import { MonthNavigator } from "./MonthNavigator";
import { StatsBar } from "./StatsBar";
import { TransactionsTable } from "./TransactionsTable";

function AlertBanner({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "warning";
}) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm ${styles}`}
    >
      {children}
    </div>
  );
}

export function Dashboard() {
  const monthsQuery = useMonths();
  const companiesQuery = useCompanies();

  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Default to the most recent month once the month list arrives.
  useEffect(() => {
    if (selectedMonth || !monthsQuery.data || monthsQuery.data.length === 0) {
      return;
    }
    const latest = monthsQuery.data[monthsQuery.data.length - 1];
    if (latest) setSelectedMonth(latest.key);
  }, [monthsQuery.data, selectedMonth]);

  const query = useMemo<TransactionQuery>(
    () => ({
      month: selectedMonth ?? "",
      status: statusFilter,
      search: debouncedSearch.trim(),
      sortBy,
      sortDir,
    }),
    [selectedMonth, statusFilter, debouncedSearch, sortBy, sortDir],
  );

  const transactionsQuery = useTransactions(query);
  const summaryQuery = useSummary(selectedMonth);

  const runMatching = useRunMatching();
  const ignore = useIgnoreTransaction();
  const restore = useRestoreTransaction();
  const manualMatch = useManualMatch();

  // Auto-run matching once on first load if the seed data is all unmatched.
  const autoRunDone = useRef(false);
  useEffect(() => {
    if (autoRunDone.current) return;
    const stats = summaryQuery.data?.stats;
    if (!stats) return;
    autoRunDone.current = true;
    if (stats.matchedCount === 0 && stats.unmatchedCount > 0) {
      runMatching.mutate();
    }
  }, [summaryQuery.data, runMatching]);

  const handleSort = useCallback((column: SortBy) => {
    setSortBy((currentColumn) => {
      if (currentColumn === column) {
        setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
        return currentColumn;
      }
      setSortDir("desc");
      return column;
    });
  }, []);

  const isRowBusy = useCallback(
    (id: string) =>
      (ignore.isPending && ignore.variables === id) ||
      (restore.isPending && restore.variables === id) ||
      (manualMatch.isPending && manualMatch.variables?.transactionId === id),
    [
      ignore.isPending,
      ignore.variables,
      restore.isPending,
      restore.variables,
      manualMatch.isPending,
      manualMatch.variables,
    ],
  );

  const companies = companiesQuery.data ?? [];
  const months = monthsQuery.data ?? [];
  const selectedMonthLabel =
    months.find((month) => month.key === selectedMonth)?.label ?? "";

  const actionError = runMatching.error ?? manualMatch.error;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-slate-200/60 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Bank of Georgia
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Payment Reconciliation
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
              Match incoming transactions to service contracts by tax ID and
              compare actual payments against monthly expectations.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <Button
              onClick={() => runMatching.mutate()}
              disabled={runMatching.isPending}
              className="min-w-[10.5rem]"
            >
              {runMatching.isPending ? (
                <>
                  <Spinner className="border-white/40 border-t-white" />
                  Matching…
                </>
              ) : (
                "Run auto-match"
              )}
            </Button>
            {runMatching.data ? (
              <p className="text-xs text-slate-500">
                Matched {formatCount(runMatching.data.matchedCount)} ·{" "}
                {formatCount(runMatching.data.unmatchedRemaining)} still
                unmatched
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Matches by exact tax ID (INN)
              </p>
            )}
          </div>
        </div>
      </header>

      {monthsQuery.isError ? (
        <div className="mt-6">
          <AlertBanner tone="warning">
            <p className="font-medium">Can&apos;t reach Supabase.</p>
            <p className="mt-1 text-amber-800/90">
              Set <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
              and{" "}
              <code className="rounded bg-amber-100/80 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
              in <code className="rounded bg-amber-100/80 px-1">.env.local</code>, then run
              the SQL in <code className="rounded bg-amber-100/80 px-1">/sql</code>. (
              {monthsQuery.error.message})
            </p>
          </AlertBanner>
        </div>
      ) : null}

      <div className="mt-8">
        <MonthNavigator
          months={months}
          selected={selectedMonth}
          onSelect={setSelectedMonth}
          isLoading={monthsQuery.isLoading}
        />
      </div>

      <div className="mt-6">
        <StatsBar
          stats={summaryQuery.data?.stats}
          isLoading={summaryQuery.isLoading}
        />
      </div>

      {actionError ? (
        <div className="mt-6">
          <AlertBanner>
            <p className="font-medium">Action failed</p>
            <p className="mt-0.5 opacity-90">{actionError.message}</p>
          </AlertBanner>
        </div>
      ) : null}

      <div className="mt-6">
        <TransactionsTable
          transactions={transactionsQuery.data}
          companies={companies}
          isLoading={transactionsQuery.isLoading}
          isFetching={transactionsQuery.isFetching}
          error={transactionsQuery.error}
          onRetry={() => {
            void transactionsQuery.refetch();
          }}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          search={searchInput}
          onSearchChange={setSearchInput}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          isRowBusy={isRowBusy}
          resultCount={transactionsQuery.data?.length}
          onIgnore={(id) => ignore.mutate(id)}
          onRestore={(id) => restore.mutate(id)}
          onManualMatch={(transactionId, companyId) => {
            const company = companies.find((c) => c.id === companyId);
            if (!company) return;
            manualMatch.mutate({
              transactionId,
              companyId,
              companyName: company.name,
            });
          }}
        />
      </div>

      <div className="mt-6">
        <ExpectedVsActual
          summary={summaryQuery.data}
          monthLabel={selectedMonthLabel}
          isLoading={summaryQuery.isLoading}
          error={summaryQuery.error}
          onRetry={() => {
            void summaryQuery.refetch();
          }}
        />
      </div>
    </main>
  );
}
