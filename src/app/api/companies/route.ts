import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/responses";
import { getCompanies } from "@/lib/services/companies.service";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const client = getServerSupabase();
    const companies = await getCompanies(client);
    return NextResponse.json({ companies });
  } catch (error) {
    return errorResponse(error);
  }
}
