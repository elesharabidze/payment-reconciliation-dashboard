"use client";

import { useMemo } from "react";

import type { Company, Transaction } from "@/lib/types/domain";
import { suggestCompany } from "@/lib/utils/similarity";

export function ManualMatchControl({
  transaction,
  companies,
  onMatch,
  disabled = false,
}: {
  transaction: Transaction;
  companies: Company[];
  onMatch: (companyId: string) => void;
  disabled?: boolean;
}) {
  const suggestion = useMemo(
    () => suggestCompany(transaction.senderName, companies),
    [transaction.senderName, companies],
  );

  const others = useMemo(
    () => companies.filter((company) => company.id !== suggestion?.company.id),
    [companies, suggestion],
  );

  return (
    <select
      value=""
      disabled={disabled}
      aria-label="Match to a company"
      onChange={(event) => {
        if (event.target.value) onMatch(event.target.value);
      }}
      className="max-w-[12rem] cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="" disabled>
        Match to…
      </option>
      {suggestion ? (
        <option value={suggestion.company.id}>
          ★ {suggestion.company.name} (suggested)
        </option>
      ) : null}
      {others.map((company) => (
        <option key={company.id} value={company.id}>
          {company.name}
        </option>
      ))}
    </select>
  );
}
