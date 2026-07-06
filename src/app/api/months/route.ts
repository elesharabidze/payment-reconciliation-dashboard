import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/responses";
import { getAvailableMonths } from "@/lib/services/transactions.service";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const client = getServerSupabase();
    const months = await getAvailableMonths(client);
    return NextResponse.json({ months });
  } catch (error) {
    return errorResponse(error);
  }
}
