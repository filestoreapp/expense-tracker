# Expense Tracker

Private expense + repayment tracker for two people. One of them holds the
other's money; the tracker shows **her balance** (money left) and **what she
owes**, with a full history.

## How it works

- The tracker lives at `/<token>` — the token is the password. Wrong token
  gets a 404; the page is unlisted and `noindex`.
- Every `/api/expenses` call must send the token in the `x-expense-token`
  header.
- Data lives in the `expense_ledger` table in Supabase (RLS enabled, no anon
  policies — only the service role touches it, server-side).

## Setup

1. Run `supabase/migrations/20261004_expense_ledger.sql` once in the Supabase
   SQL editor.
2. Set these env vars on the host (Koyeb):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `EXPENSE_TOKEN` — long random string; this becomes the private link
   - `FRIEND_NAME` — display name (optional, defaults to "Friend")
3. Build: `npm install && npm run build` · Run: `npm start` (port 3000).

## Entry types

| Type | Effect |
|---|---|
| Money added | her balance += amount |
| Spent from her money | her balance −= amount |
| Shared expense (I paid) | she owes += her share |
| She repaid me | she owes −= amount |
| Settled from her balance | her balance −= amount **and** she owes −= amount |
