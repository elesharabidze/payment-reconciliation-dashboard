/**
 * Hand-written database types mirroring `sql/01_seed_schema.sql`.
 *
 * These match the shape Supabase / PostgREST returns and are used to type the
 * server Supabase client (`SupabaseClient<Database>`). Numeric columns are
 * typed as `number`; PostgREST may serialize them as strings, so the service
 * layer coerces with `Number(...)` when mapping rows to domain objects.
 *
 * NOTE: the row/schema types below are declared with `type` (not `interface`)
 * on purpose. supabase-js requires each table's `Row/Insert/Update` to satisfy
 * `Record<string, unknown>`, and interfaces have no implicit index signature —
 * so using `interface` would make the whole schema resolve to `never`.
 */

export type ContractStatus = "active" | "paused" | "ended";
export type TransactionStatus = "matched" | "unmatched" | "ignored";
export type MatchMethod = "inn_exact" | "manual";

export type CompanyRow = {
  id: string;
  name: string;
  tax_id: string;
  created_at: string;
};

export type ContractRow = {
  id: string;
  company_id: string;
  monthly_amount: number;
  status: ContractStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
};

export type BankTransactionRow = {
  id: string;
  doc_key: string;
  entry_date: string;
  amount: number;
  currency: string;
  sender_name: string | null;
  sender_inn: string | null;
  sender_account: string | null;
  purpose: string | null;
  matched_company_id: string | null;
  match_method: MatchMethod | null;
  match_confidence: number | null;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: CompanyRow;
        Insert: Omit<CompanyRow, "id" | "created_at"> &
          Partial<Pick<CompanyRow, "id" | "created_at">>;
        Update: Partial<CompanyRow>;
        Relationships: [];
      };
      contracts: {
        Row: ContractRow;
        Insert: Omit<ContractRow, "id" | "created_at"> &
          Partial<Pick<ContractRow, "id" | "created_at">>;
        Update: Partial<ContractRow>;
        Relationships: [];
      };
      bank_transactions: {
        Row: BankTransactionRow;
        Insert: Omit<BankTransactionRow, "id" | "created_at" | "updated_at"> &
          Partial<Pick<BankTransactionRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<BankTransactionRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
