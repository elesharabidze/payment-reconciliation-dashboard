import { type NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/responses";
import {
  getCompanies,
  getContracts,
} from "@/lib/services/companies.service";
import { computeSummary } from "@/lib/services/reconciliation.service";
import { getMonthTransactions } from "@/lib/services/transactions.service";
import { getServerSupabase } from "@/lib/supabase/server";
import { parseSearchParams, summaryQuerySchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { month } = parseSearchParams(
      summaryQuerySchema,
      request.nextUrl.searchParams,
    );
    const client = getServerSupabase();
    const [companies, contracts] = await Promise.all([
      getCompanies(client),
      getContracts(client),
    ]);
    const transactions = await getMonthTransactions(client, month, companies);
    const summary = computeSummary({ month, companies, contracts, transactions });
    return NextResponse.json({ summary });
  } catch (error) {
    return errorResponse(error);
  }
}
