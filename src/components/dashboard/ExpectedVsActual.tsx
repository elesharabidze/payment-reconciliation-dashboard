"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StateMessage } from "@/components/ui/StateMessage";
import type {
  CompanyReconciliation,
  ReconStatus,
  ReconciliationSummary,
} from "@/lib/types/domain";
import { cn } from "@/lib/utils/cn";
import { toCsv, downloadCsv } from "@/lib/utils/csv";
import { formatGel, formatSignedGel } from "@/lib/utils/format";

const RECON: Record<
  ReconStatus,
  { label: string; row: string; badge: string }
> = {
  met: {
    label: "On track",
    row: "bg-emerald-50/60",
    badge: "bg-emerald-100 text-emerald-700",
  },
  over: {
    label: "Overpaid",
    row: "bg-emerald-50/60",
    badge: "bg-emerald-100 text-emerald-700",
  },
  under: {
    label: "Short",
    row: "bg-red-50/60",
    badge: "bg-red-100 text-red-700",
  },
  unpaid: {
    label: "Unpaid",
    row: "bg-slate-50",
    badge: "bg-slate-200 text-slate-600",
  },
  no_contract: {
    label: "No active contract",
    row: "bg-amber-50/60",
    badge: "bg-amber-100 text-amber-700",
  },
};

function differenceClass(difference: number): string {
  if (difference > 0) return "text-emerald-600";
  if (difference < 0) return "text-red-600";
  return "text-slate-400";
}

function buildCsv(month: string, rows: CompanyReconciliation[]): string {
  const header = [
    "Company",
    "Tax ID",
    "Active contracts",
    "Expected",
    "Actual",
    "Difference",
    "Status",
  ];
  const body = rows.map((row) => [
    row.companyName,
    row.taxId,
    String(row.activeContractCount),
    row.expectedAmount.toFixed(2),
    row.actualAmount.toFixed(2),
    row.difference.toFixed(2),
    RECON[row.status].label,
  ]);
  return toCsv([[`Expected vs actual — ${month}`], header, ...body]);
}

export function ExpectedVsActual({
  summary,
  monthLabel,
  isLoading,
  error,
  onRetry,
}: {
  summary: ReconciliationSummary | undefined;
  monthLabel: string;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  const rows = summary?.companies ?? [];
  const totals = rows.reduce(
    (acc, row) => ({
      expected: acc.expected + row.expectedAmount,
      actual: acc.actual + row.actualAmount,
      difference: acc.difference + row.difference,
    }),
    { expected: 0, actual: 0, difference: 0 },
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Expected vs actual
          </h2>
          <p className="text-sm text-slate-500">
            Per company for {monthLabel} — expected counts only contracts active
            this month.
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={rows.length === 0}
          onClick={() =>
            summary &&
            downloadCsv(
              `expected-vs-actual-${summary.month}.csv`,
              buildCsv(summary.month, rows),
            )
          }
        >
          Export CSV
        </Button>
      </div>

      {error ? (
        <StateMessage
          tone="error"
          title="Couldn't load the summary"
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
      ) : isLoading && !summary ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-full animate-pulse rounded bg-slate-100"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <StateMessage
          title="Nothing to reconcile"
          description="No active contracts or payments for this month."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Company
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Expected
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actual
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Difference
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.companyId}
                  className={cn("border-t border-slate-100", RECON[row.status].row)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {row.companyName}
                    </div>
                    <div className="text-xs tabular-nums text-slate-400">
                      {row.taxId} ·{" "}
                      {row.activeContractCount === 1
                        ? "1 active contract"
                        : `${row.activeContractCount} active contracts`}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-slate-700">
                    {formatGel(row.expectedAmount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-slate-900">
                    {formatGel(row.actualAmount)}
                    {row.paymentCount > 1 ? (
                      <span className="ml-1 text-xs text-slate-400">
                        ({row.paymentCount}×)
                      </span>
                    ) : null}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-right text-sm font-medium tabular-nums",
                      differenceClass(row.difference),
                    )}
                  >
                    {formatSignedGel(row.difference)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        RECON[row.status].badge,
                      )}
                    >
                      {RECON[row.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <td className="px-4 py-3 text-sm text-slate-700">Total</td>
                <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-700">
                  {formatGel(totals.expected)}
                </td>
                <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-900">
                  {formatGel(totals.actual)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right text-sm tabular-nums",
                    differenceClass(totals.difference),
                  )}
                >
                  {formatSignedGel(totals.difference)}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}
