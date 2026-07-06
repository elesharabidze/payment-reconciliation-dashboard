"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api/fetcher";
import type { Transaction } from "@/lib/types/domain";
import type { TransactionQuery } from "@/lib/validation/schemas";

import { queryKeys } from "./queryKeys";

function toSearchString(params: TransactionQuery): string {
  const search = new URLSearchParams({
    month: params.month,
    status: params.status,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  });
  if (params.search) search.set("search", params.search);
  return search.toString();
}

export function useTransactions(params: TransactionQuery) {
  return useQuery({
    queryKey: queryKeys.transactions(params),
    queryFn: async () => {
      const { transactions } = await fetchJson<{ transactions: Transaction[] }>(
        `/api/transactions?${toSearchString(params)}`,
      );
      return transactions;
    },
    enabled: params.month.length > 0,
    placeholderData: keepPreviousData,
  });
}
