"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api/fetcher";
import type { MonthOption } from "@/lib/types/domain";

import { queryKeys } from "./queryKeys";

export function useMonths() {
  return useQuery({
    queryKey: queryKeys.months,
    queryFn: async () => {
      const { months } = await fetchJson<{ months: MonthOption[] }>(
        "/api/months",
      );
      return months;
    },
    staleTime: 5 * 60 * 1000,
  });
}
