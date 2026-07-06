# Payment Reconciliation Dashboard

A reconciliation tool for a company that manages service contracts. Bank
transactions arrive from the Bank of Georgia API and need to be matched against
existing contracts — showing who paid, who didn't, and how actual payments
compare to what each contract expects for a given month.

Built with **Next.js 14 (App Router)**, **TypeScript** (strict), **Supabase**
(Postgres), **Tailwind CSS**, **TanStack Query v5**, and **Zod**.

---

## Quick start

### 1. Prerequisites

- Node.js 18.17+ (developed on Node 20/22)
- A free [Supabase](https://supabase.com) project

### 2. Install

```bash
npm install
```

### 3. Set up the database

In the Supabase **SQL Editor**, run the two files from [`sql/`](sql/) in order:

1. [`sql/01_seed_schema.sql`](sql/01_seed_schema.sql) — tables, indexes, the
   `updated_at` trigger, 15 companies and 18 contracts.
2. [`sql/02_seed_transactions.sql`](sql/02_seed_transactions.sql) — 89 bank
   transactions (April–June 2026), all starting as `unmatched`.

### 4. Configure environment variables

Copy the example and fill in your project's values
(Supabase → **Project Settings → API**):

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> All database access happens **server-side** (route handlers + server
> actions), so only the service-role key is needed and it never reaches the
> browser. See [Design decisions](#design-decisions).

### 5. Run

```bash
npm run dev          # http://localhost:3000
```

On first load the dashboard auto-runs matching (the seed data is entirely
unmatched); you can also re-run it anytime with **Run auto-match**.

### Useful scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit (strict)
npm run lint         # next lint
npm test             # runtime checks for the core reconciliation logic
```

---

## Where the matching logic lives (and why)

**The matching logic runs on the server, as a Next.js Server Action**, over a
typed service layer:

- Server action: [`runMatchingAction`](src/app/actions/matching.ts)
- Implementation: [`runInnMatching`](src/lib/services/reconciliation.service.ts)

The client calls the action through a TanStack Query mutation
([`useRunMatching`](src/hooks/useMatching.ts)), which invalidates the
`transactions` and `summary` query caches on success.

**Why server-side (not client, not a DB function):**

- **Keeps the service-role key on the server.** The browser never holds
  credentials or issues writes directly.
- **It's the natural home for "business logic."** Matching is a domain rule, not
  a UI concern. Putting it in a typed service function keeps it testable and
  reusable, and it reads clearly next to the rest of the service layer — instead
  of being hidden in SQL/PLpgSQL or scattered across components.
- **Efficient and idempotent.** Rather than fetching everything to the client
  and looping, it loads the `tax_id → company` map once and issues **one
  set-based `UPDATE` per matched tax ID** (`WHERE sender_inn = ? AND status =
  'unmatched'`) — at most one statement per company, and safe to re-run.

**What it does:** for every `unmatched` transaction whose `sender_inn` equals a
`company.tax_id`, it sets `matched_company_id`, `match_method = 'inn_exact'`,
`match_confidence = 1.00`, and `status = 'matched'`. Everything else stays
`unmatched`. Matching is **INN-only by design** — sender names vary on purpose
(e.g. `გეოტრანსი (ფილიალი)` vs `შპს გეოტრანსი` share INN `404871234`), so names
are never used to match.

> Trade-off: a Supabase RPC (Postgres function) would push the same set-based
> update fully into the database and is arguably the "purest" answer for this
> specific task (and would earn the bonus). I chose the server action because it
> keeps the logic in typed, testable app code alongside the rest of the service
> layer, at the cost of one extra round trip for the `companies` lookup.

---

## Architecture

Data flows one direction, with a clear seam between the database and the UI:

```
Browser (TanStack Query hooks)
    │  fetch /api/*                        server actions
    ▼                                          ▲
Route handlers  ──►  Service layer  ◄──────────┘
(Zod-validated)      (typed, client-injected)
                             │
                             ▼
                     Supabase (service role, server-only)
```

- **Service layer** ([`src/lib/services`](src/lib/services)) — typed functions
  that take a Supabase client and return **domain objects** (camelCase), mapping
  from raw rows and coercing numerics. Errors are wrapped in `ServiceError`.
- **Route handlers** ([`src/app/api`](src/app/api)) — read endpoints for
  `transactions`, `summary`, `months`, `companies`. Query params are validated
  with Zod; errors become `400` (invalid input) or `502` (upstream).
- **Server actions** ([`src/app/actions/matching.ts`](src/app/actions/matching.ts))
  — the write side: run matching, ignore/restore, manual match. Inputs are
  re-validated with Zod at the trust boundary.
- **Hooks** ([`src/hooks`](src/hooks)) — TanStack Query wrappers with a central
  [query-key factory](src/hooks/queryKeys.ts), `keepPreviousData` for smooth
  filtering, cache invalidation after mutations, and optimistic
  ignore/restore.
- **Components** ([`src/components`](src/components)) — presentational, named
  exports, composed by [`Dashboard`](src/components/dashboard/Dashboard.tsx).

```
src/
├─ app/
│  ├─ api/{transactions,summary,months,companies}/route.ts
│  ├─ actions/matching.ts        # server actions ('use server')
│  ├─ layout.tsx · providers.tsx · page.tsx
├─ components/
│  ├─ dashboard/                 # StatsBar, MonthNavigator, TransactionsTable, ExpectedVsActual, …
│  └─ ui/                        # Card, Button, Spinner, StateMessage
├─ hooks/                        # useTransactions, useSummary, useMonths, useMatching, …
└─ lib/
   ├─ services/                  # transactions · companies · reconciliation · errors
   ├─ types/                     # database (row types) · domain (app types)
   ├─ utils/                     # dates · contracts · format · similarity · csv · math
   ├─ validation/schemas.ts      # Zod
   └─ supabase/server.ts         # server-only client (service role)
```

---

## Design decisions

### Month-aware "expected" (the important one)

The expected-vs-actual summary must, for the **selected month**, count only the
contracts that were **active in that month**, honoring `end_date`. The rule
([`isContractActiveInMonth`](src/lib/utils/contracts.ts)):

> A contract counts toward month _M_ if it was active on the **first day of
> _M_**, treating `end_date` as **exclusive** (a contract is not active on its
> end/pause date):
> `start_date ≤ firstDay(M)` **and** (`end_date is null` **or** `firstDay(M) < end_date`).

This single rule produces exactly the behavior the dataset intends:

| Company | Contract | April | May | June |
| --- | --- | :---: | :---: | :---: |
| Safe Transport | 1800, paused `2026-05-15` | ✅ | ✅ | ❌ |
| Urban Movers | 1600, ended `2026-04-30` | ✅ | ❌ | ❌ |
| Rustavi (2nd) | 800, paused `2026-04-01` | ❌ | ❌ | ❌ |
| Eco Transport | 750 + 1100, both active | ✅ 1850 | ✅ 1850 | ✅ 1850 |
| Agmosavlet | 4500 active (+2000 ended `2025-10-31`) | ✅ 4500 | ✅ 4500 | ✅ 4500 |

The Rustavi case is the subtle one: its 800 contract paused on **April 1**, and
its April 800 payment is explicitly labelled "March remaining debt" — so April's
expected total is 1100, not 1900. The exclusive `end_date` handles this
correctly. These cases are locked down in [`npm test`](scripts/verify-logic.ts).

### Actual vs expected, and status colors

- **Actual** = sum of a company's `matched` transactions in the month. This
  includes partial, prepaid, and duplicate payments, so actual can exceed or
  fall short of expected.
- **Difference** = actual − expected.
- **Status / color**: `met`/`over` → green, `under` (partial) → red, `unpaid`
  → grey. There's a fourth, `no_contract` (amber): a company that **paid** in a
  month where it had **no active contract** (e.g. Safe Transport in June) — the
  spec's three colors don't cover "paid without an obligation," and flagging it
  is more useful than mislabelling it green or grey.

### Stats & match rate

Stats reflect the **whole month** (independent of the table's status filter).
**Match rate = matched / (matched + unmatched)** by count — `ignored` is
deliberately excluded from the denominator, since ignoring a transaction is an
explicit "this isn't ours" decision, not an unresolved item.

### Server-mediated data access

The browser never talks to Supabase directly — all reads go through route
handlers and all writes through server actions, using the service-role key
server-side. This keeps credentials off the client and means no RLS policies are
required for the app to work. In a real deployment you'd layer Auth + RLS on top;
Auth was optional for this task.

### Other choices

- **Domain vs DB types.** Raw snake_case rows ([`types/database.ts`](src/lib/types/database.ts))
  are mapped to camelCase domain objects ([`types/domain.ts`](src/lib/types/domain.ts))
  in the service layer, which is also where `NUMERIC` values are coerced to
  numbers.
- **Dates as strings.** Month math is done on ISO strings (`YYYY-MM`,
  `YYYY-MM-DD`) which sort/compare lexically — no timezone surprises.
- **No `any`.** Strict TypeScript with `noUncheckedIndexedAccess`; the Supabase
  client is fully typed via a hand-written `Database` type.

---

## Feature coverage

**Requirements**

- ✅ INN-exact auto-matching (server action) with `match_method` / `confidence`
- ✅ Stats bar: totals, matched, unmatched, match rate — per month
- ✅ Transactions table: status colors, sortable (date/amount), filterable
  (all/matched/unmatched/ignored)
- ✅ Month navigation — stats, table, and expected-vs-actual all follow the
  selected month
- ✅ Expected vs actual by company, month-aware with `end_date`, colored diffs
- ✅ Zod validation for filter/search params (route handlers + actions)
- ✅ TanStack Query throughout: query keys, cache invalidation after mutations,
  optimistic updates (ignore/restore), loading & error states

**Bonus**

- ✅ Search by company name or tax ID (also matches the resolved company name)
- ✅ CSV export of the expected-vs-actual summary
- ✅ Fuzzy company suggestion for unmatched transactions
  ([`suggestCompany`](src/lib/utils/similarity.ts), Sørensen–Dice on
  prefix-stripped names) surfaced in the manual-match dropdown
- ⚪️ Matching as a Supabase RPC — implemented as a server action instead (see
  rationale above)
- ➕ Manual match & ignore/restore actions; runtime tests for the core logic

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel (framework auto-detected as Next.js).
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`) in **Project Settings → Environment Variables**.
4. Deploy. Make sure the two SQL files have been run against your Supabase
   project.

---

## Notes

- The two SQL files are committed under [`sql/`](sql/) and are the source of
  truth for the schema and seed data.
- With placeholder credentials the app builds and runs, and the UI shows a clear
  "Can't reach Supabase" banner plus graceful per-section error states until
  real credentials are provided.
