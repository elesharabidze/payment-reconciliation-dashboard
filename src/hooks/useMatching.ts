"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { runMatchingAction } from "@/app/actions/matching";

import { queryKeys } from "./queryKeys";

/** Runs INN auto-matching (server action) and refreshes transactions + summary. */
export function useRunMatching() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => runMatchingAction(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.transactionsRoot,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.summaryRoot });
    },
  });
}
