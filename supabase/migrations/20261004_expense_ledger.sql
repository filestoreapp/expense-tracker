-- Expense tracker ledger. Run once in the Supabase SQL editor.
--
-- kind:
--   topup       her money handed over to hold        -> her balance += amount
--   her_expense spent from her money, on her        -> her balance -= amount
--   shared      he paid for both; her_share is debt -> she owes   += her_share
--   repayment   she paid him back                   -> she owes   -= amount
--   settle      debt cleared out of her balance     -> her balance -= amount AND she owes -= amount

create table if not exists expense_ledger (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  entry_date date not null default current_date,
  kind text not null check (kind in ('topup', 'her_expense', 'shared', 'repayment', 'settle')),
  amount numeric(12, 2) not null check (amount > 0),
  her_share numeric(12, 2),
  note text not null default ''
);

alter table expense_ledger enable row level security;

-- Intentionally no policies: only the service role can read/write this
-- table, and the service role is used solely by the /api/expenses routes,
-- which require the private link token on every call.
