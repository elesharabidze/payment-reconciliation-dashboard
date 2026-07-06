"use client";

import type { MonthOption } from "@/lib/types/domain";
import { cn } from "@/lib/utils/cn";

export function MonthNavigator({
  months,
  selected,
  onSelect,
  isLoading,
}: {
  months: MonthOption[];
  selected: string | undefined;
  onSelect: (monthKey: string) => void;
  isLoading: boolean;
}) {
  const index = months.findIndex((m) => m.key === selected);
  const canGoPrev = index > 0;
  const canGoNext = index >= 0 && index < months.length - 1;

  const goPrev = () => {
    const prev = months[index - 1];
    if (prev) onSelect(prev.key);
  };
  const goNext = () => {
    const next = months[index + 1];
    if (next) onSelect(next.key);
  };

  if (isLoading && months.length === 0) {
    return <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-sm font-medium text-slate-500">Period</span>
      <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className="rounded-lg px-2.5 py-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
        >
          ‹
        </button>
        {months.map((month) => (
          <button
            key={month.key}
            type="button"
            onClick={() => onSelect(month.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              month.key === selected
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {month.label}
          </button>
        ))}
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="Next month"
          className="rounded-lg px-2.5 py-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
        >
          ›
        </button>
      </div>
    </div>
  );
}
