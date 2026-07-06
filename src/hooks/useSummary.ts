"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api/fetcher";
import type { ReconciliationSummary } from "@/lib/types/domain";

import { queryKeys } from "./queryKeys";

export function useSummary(month: string | undefined) {
  return useQuery({
    queryKey: queryKeys.summary(month ?? ""),
    queryFn: async () => {
      const { summary } = await fetchJson<{ summary: ReconciliationSummary }>(
        `/api/summary?month=${month}`,
      );
      return summary;
    },
    enabled: Boolean(month),
    placeholderData: keepPreviousData,
  });
}
