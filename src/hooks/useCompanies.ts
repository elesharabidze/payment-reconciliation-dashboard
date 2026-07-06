"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api/fetcher";
import type { Company } from "@/lib/types/domain";

import { queryKeys } from "./queryKeys";

export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies,
    queryFn: async () => {
      const { companies } = await fetchJson<{ companies: Company[] }>(
        "/api/companies",
      );
      return companies;
    },
    staleTime: 5 * 60 * 1000,
  });
}
