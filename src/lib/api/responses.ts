import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ServiceError } from "@/lib/services/errors";

/** Translate a thrown error into a JSON HTTP response for route handlers. */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request parameters", issues: error.flatten() },
      { status: 400 },
    );
  }

  if (error instanceof ServiceError) {
    // Upstream (database) failure. Message is safe/generic by construction.
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  console.error("Unexpected API error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
