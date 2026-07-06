import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function StateMessage({
  title,
  description,
  action,
  tone = "default",
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "error";
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <p
        className={cn(
          "text-sm font-semibold",
          tone === "error" ? "text-red-600" : "text-slate-700",
        )}
      >
        {title}
      </p>
      {description ? (
        <p className="max-w-md text-sm text-slate-500">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
