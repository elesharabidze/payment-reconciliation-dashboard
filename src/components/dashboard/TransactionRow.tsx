"use client";

import { Spinner } from "@/components/ui/Spinner";
import type { Company, Transaction } from "@/lib/types/domain";
import { formatDate } from "@/lib/utils/dates";
import { formatGel } from "@/lib/utils/format";

import { ManualMatchControl } from "./ManualMatchControl";
import { StatusBadge } from "./StatusBadge";

const METHOD_LABELS: Record<string, string> = {
  inn_exact: "INN match",
  manual: "Manual",
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
    <tr className="border-t border-slate-100 hover:bg-slate-50">
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
              <button
                type="button"
                disabled={busy}
                onClick={() => onIgnore(transaction.id)}
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                Ignore
              </button>
            </>
          ) : null}

          {transaction.status === "matched" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onRestore(transaction.id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              Unmatch
            </button>
          ) : null}

          {transaction.status === "ignored" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onRestore(transaction.id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              Restore
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
