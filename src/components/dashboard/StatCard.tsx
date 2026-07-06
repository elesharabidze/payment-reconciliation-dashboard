import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

type Tone = "default" | "green" | "red" | "blue";

const ACCENT: Record<Tone, string> = {
  default: "text-slate-900",
  green: "text-emerald-600",
  red: "text-red-600",
  blue: "text-blue-600",
};

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  loading = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  loading?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-slate-200" />
      ) : (
        <p
          className={cn(
            "mt-1 text-2xl font-semibold tabular-nums",
            ACCENT[tone],
          )}
        >
          {value}
        </p>
      )}
      {sub && !loading ? (
        <p className="mt-1 text-sm tabular-nums text-slate-500">{sub}</p>
      ) : null}
    </Card>
  );
}
