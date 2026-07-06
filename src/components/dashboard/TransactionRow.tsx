"use client";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { Company, Transaction } from "@/lib/types/domain";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/dates";
import { formatGel } from "@/lib/utils/format";

import { ManualMatchControl } from "./ManualMatchControl";
import { StatusBadge } from "./StatusBadge";

const METHOD_LABELS: Record<string, string> = {
  inn_exact: "INN match",
  manual: "Manual",
};

const ROW_ACCENT: Record<Transaction["status"], string> = {
  matched: "border-l-emerald-400",
  unmatched: "border-l-red-400",
  ignored: "border-l-slate-300",
};

export function TransactionRow({
  transaction,
  companies,
  busy,
  onIgnore,
  onRestore,
  onManualMatch,
}: {
  transaction: Transaction;
  companies: Company[];
  busy: boolean;
  onIgnore: (transactionId: string) => void;
  onRestore: (transactionId: string) => void;
  onManualMatch: (transactionId: string, companyId: string) => void;
}) {
  return (
    <tr
      className={cn(
        "border-l-[3px] border-t border-slate-100 transition-colors hover:bg-slate-50/70",
        ROW_ACCENT[transaction.status],
      )}
    >
      <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-slate-600">
        {formatDate(transaction.entryDate)}
      </td>

      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">
          {transaction.senderName ?? "—"}
        </div>
        {transaction.senderAccount ? (
          <div className="text-xs tabular-nums text-slate-400">
            {transaction.senderAccount}
          </div>
        ) : null}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-slate-600">
        {transaction.senderInn ?? "—"}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium tabular-nums text-slate-900">
        {formatGel(transaction.amount)}
      </td>

      <td className="px-4 py-3">
        <StatusBadge status={transaction.status} />
      </td>

      <td className="px-4 py-3">
        {transaction.matchedCompanyName ? (
          <div>
            <div className="text-sm text-slate-900">
              {transaction.matchedCompanyName}
            </div>
            {transaction.matchMethod ? (
              <div className="text-xs text-slate-400">
                {METHOD_LABELS[transaction.matchMethod] ??
                  transaction.matchMethod}
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-sm text-slate-300">—</span>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {busy ? <Spinner /> : null}

          {transaction.status === "unmatched" ? (
            <>
              <ManualMatchControl
                transaction={transaction}
                companies={companies}
                onMatch={(companyId) =>
                  onManualMatch(transaction.id, companyId)
                }
                disabled={busy}
              />
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => onIgnore(transaction.id)}
                className="px-2 py-1 text-xs"
              >
                Ignore
              </Button>
            </>
          ) : null}

          {transaction.status === "matched" ? (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => onRestore(transaction.id)}
              className="px-2 py-1 text-xs"
            >
              Unmatch
            </Button>
          ) : null}

          {transaction.status === "ignored" ? (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => onRestore(transaction.id)}
              className="px-2 py-1 text-xs"
            >
              Restore
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
