"use client";

import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import type { StatusFilter } from "@/lib/validation/schemas";

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "matched", label: "Matched" },
  { value: "unmatched", label: "Unmatched" },
  { value: "ignored", label: "Ignored" },
];

export function TableToolbar({
  status,
  onStatusChange,
  search,
  onSearchChange,
  isFetching,
}: {
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
  isFetching: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1"
        role="tablist"
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={status === option.value}
            onClick={() => onStatusChange(option.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              status === option.value
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search sender or tax ID…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 sm:w-72"
        />
        {isFetching ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner />
          </span>
        ) : null}
      </div>
    </div>
  );
}
