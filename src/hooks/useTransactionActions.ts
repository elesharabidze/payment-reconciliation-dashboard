"use client";

import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  ignoreTransactionAction,
  manualMatchAction,
  restoreTransactionAction,
} from "@/app/actions/matching";
import type { Transaction } from "@/lib/types/domain";
import type { ManualMatchInput } from "@/lib/validation/schemas";

import { queryKeys } from "./queryKeys";

function invalidateReconciliation(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.transactionsRoot });
  void queryClient.invalidateQueries({ queryKey: queryKeys.summaryRoot });
}

/** Patch a single transaction across every cached transactions query. */
function patchTransactionInCache(
  queryClient: QueryClient,
  transactionId: string,
  patch: Partial<Transaction>,
) {
  queryClient.setQueriesData<Transaction[]>(
    { queryKey: queryKeys.transactionsRoot },
    (current) =>
      current?.map((tx) =>
        tx.id === transactionId ? { ...tx, ...patch } : tx,
      ),
  );
}

/** Optimistically mark a transaction ignored, rolling back on error. */
export function useIgnoreTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) =>
      ignoreTransactionAction({ transactionId }),
    onMutate: async (transactionId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactionsRoot,
      });
      const previous = queryClient.getQueriesData<Transaction[]>({
        queryKey: queryKeys.transactionsRoot,
      });
      patchTransactionInCache(queryClient, transactionId, {
        status: "ignored",
      });
      return { previous };
    },
    onError: (_error, _transactionId, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => invalidateReconciliation(queryClient),
  });
}

/** Optimistically reset a transaction to unmatched, rolling back on error. */
export function useRestoreTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) =>
      restoreTransactionAction({ transactionId }),
    onMutate: async (transactionId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactionsRoot,
      });
      const previous = queryClient.getQueriesData<Transaction[]>({
        queryKey: queryKeys.transactionsRoot,
      });
      patchTransactionInCache(queryClient, transactionId, {
        status: "unmatched",
        matchedCompanyId: null,
        matchedCompanyName: null,
        matchMethod: null,
        matchConfidence: null,
      });
      return { previous };
    },
    onError: (_error, _transactionId, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => invalidateReconciliation(queryClient),
  });
}

type ManualMatchVariables = ManualMatchInput & { companyName: string };

/** Manually match a transaction to a company. */
export function useManualMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, companyId }: ManualMatchVariables) =>
      manualMatchAction({ transactionId, companyId }),
    onMutate: async ({ transactionId, companyId, companyName }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactionsRoot,
      });
      const previous = queryClient.getQueriesData<Transaction[]>({
        queryKey: queryKeys.transactionsRoot,
      });
      patchTransactionInCache(queryClient, transactionId, {
        status: "matched",
        matchedCompanyId: companyId,
        matchedCompanyName: companyName,
        matchMethod: "manual",
        matchConfidence: 1.0,
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => invalidateReconciliation(queryClient),
  });
}
