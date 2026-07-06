import type { MonthlyStats } from "@/lib/types/domain";
import { formatCount, formatGel, formatPercent } from "@/lib/utils/format";

import { StatCard } from "./StatCard";

export function StatsBar({
  stats,
  isLoading,
}: {
  stats: MonthlyStats | undefined;
  isLoading: boolean;
}) {
  const loading = isLoading && !stats;
  const actionable = stats ? stats.matchedCount + stats.unmatchedCount : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        loading={loading}
        label="Total transactions"
        value={stats ? formatCount(stats.totalCount) : "—"}
        sub={stats ? formatGel(stats.totalAmount) : undefined}
      />
      <StatCard
        loading={loading}
        tone="green"
        label="Matched"
        value={stats ? formatCount(stats.matchedCount) : "—"}
        sub={stats ? formatGel(stats.matchedAmount) : undefined}
      />
      <StatCard
        loading={loading}
        tone="red"
        label="Unmatched"
        value={stats ? formatCount(stats.unmatchedCount) : "—"}
        sub={stats ? formatGel(stats.unmatchedAmount) : undefined}
      />
      <StatCard
        loading={loading}
        tone="blue"
        label="Match rate"
        value={stats ? formatPercent(stats.matchRate) : "—"}
        sub={
          stats
            ? `${formatCount(stats.matchedCount)} of ${formatCount(actionable)}${
                stats.ignoredCount > 0
                  ? ` · ${formatCount(stats.ignoredCount)} ignored`
                  : ""
              }`
            : undefined
        }
      />
    </div>
  );
}
