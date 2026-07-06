import { type NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/responses";
import { getCompanies } from "@/lib/services/companies.service";
import { queryTransactions } from "@/lib/services/transactions.service";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  parseSearchParams,
  transactionQuerySchema,
} from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const query = parseSearchParams(
      transactionQuerySchema,
      request.nextUrl.searchParams,
    );
    const client = getServerSupabase();
    const companies = await getCompanies(client);
    const transactions = await queryTransactions(client, query, companies);
    return NextResponse.json({ transactions });
  } catch (error) {
    return errorResponse(error);
  }
}
