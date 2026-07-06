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
        className="inline-flex flex-wrap rounded-xl border border-slate-200/80 bg-slate-50 p-1"
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
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              status === option.value
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative sm:min-w-[18rem]">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search sender or tax ID…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm shadow-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
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
