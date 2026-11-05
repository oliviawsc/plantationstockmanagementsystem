-- Plantation Stock: failed HQ sign-in counter (5 wrong passwords → 15-minute lock).
-- Only the stock-auth Edge Function (service role) reads or writes it.
-- Safe to apply any time: nothing else uses this table.
create table if not exists public.stock_login_attempts (
  email        text primary key,
  fails        integer     not null default 0,
  locked_until timestamptz,
  updated_at   timestamptz not null default now()
);

alter table public.stock_login_attempts enable row level security;
-- No policies: anon and authenticated users have no access.
revoke all on public.stock_login_attempts from anon, authenticated;
