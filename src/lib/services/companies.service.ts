import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CompanyRow,
  ContractRow,
  Database,
} from "@/lib/types/database";
import type { Company, Contract } from "@/lib/types/domain";

import { ServiceError } from "./errors";

type Client = SupabaseClient<Database>;

function mapCompany(row: CompanyRow): Company {
  return { id: row.id, name: row.name, taxId: row.tax_id };
}

function mapContract(row: ContractRow): Contract {
  return {
    id: row.id,
    companyId: row.company_id,
    monthlyAmount: Number(row.monthly_amount),
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

/** All companies, ordered by name. */
export async function getCompanies(client: Client): Promise<Company[]> {
  const { data, error } = await client
    .from("companies")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new ServiceError("Failed to load companies", error);
  return data.map(mapCompany);
}

/** All contracts (small table — fetched whole and grouped in memory). */
export async function getContracts(client: Client): Promise<Contract[]> {
  const { data, error } = await client.from("contracts").select("*");

  if (error) throw new ServiceError("Failed to load contracts", error);
  return data.map(mapContract);
}
