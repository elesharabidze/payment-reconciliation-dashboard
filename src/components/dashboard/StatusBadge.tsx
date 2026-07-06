import type { TransactionStatus } from "@/lib/types/domain";
import { cn } from "@/lib/utils/cn";

const STYLES: Record<TransactionStatus, string> = {
  matched: "bg-matched-bg text-matched-text ring-matched-border",
  unmatched: "bg-unmatched-bg text-unmatched-text ring-unmatched-border",
  ignored: "bg-ignored-bg text-ignored-text ring-ignored-border",
};

const DOT: Record<TransactionStatus, string> = {
  matched: "bg-emerald-500",
  unmatched: "bg-red-500",
  ignored: "bg-slate-400",
};

const LABELS: Record<TransactionStatus, string> = {
  matched: "Matched",
  unmatched: "Unmatched",
  ignored: "Ignored",
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STYLES[status],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} />
      {LABELS[status]}
    </span>
  );
}
