import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Server-only Supabase client using the service-role key.
 *
 * Every database read/write in this app runs on the server (route handlers +
 * server actions), so the browser never talks to Supabase directly and the
 * service-role key never leaves the server. `import "server-only"` guarantees
 * this module can't be pulled into a client bundle.
 *
 * The client is created lazily on first use so that missing env vars fail at
 * request time with a clear message (rather than at build/import time).
 */
let cached: SupabaseClient<Database> | null = null;

export function getServerSupabase(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in .env.local (see .env.local.example).",
    );
  }

  cached = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
