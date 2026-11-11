-- =====================================================================
-- Management Report: monthly figures per estate
--   One row per estate + year + month. Filled by hand on the Management
--   Report page ("Input figures") or later by the mill-statement import.
--   Charts that read it: Hasil FFB Bulanan, Kumulatif Hasil FFB,
--   Kumulatif Hasil Sehektar, Grading Buah, Jumlah Penombak.
-- Safe to run more than once.
-- =====================================================================

create table if not exists public.opp_mgmt_monthly (
  id            uuid primary key default gen_random_uuid(),
  estate        text not null,
  year          int  not null check (year between 2000 and 2100),
  month         int  not null check (month between 1 and 12),
  ffb_mt        numeric(12,3) check (ffb_mt is null or ffb_mt >= 0),        -- Hasil FFB (MT)
  grading_pct   numeric(6,2)  check (grading_pct is null or (grading_pct between 0 and 100)),
  harvesters    int           check (harvesters is null or harvesters >= 0), -- Jumlah Penombak
  harvest_days  int           check (harvest_days is null or harvest_days >= 0),
  downgraded_bunches int      check (downgraded_bunches is null or downgraded_bunches >= 0),
  penalty_rm    numeric(12,2) check (penalty_rm is null or penalty_rm >= 0),
  carlos_open   int, carlos_closed int, carlos_pending int,
  notes         text check (notes is null or char_length(notes) <= 500),
  source        text not null default 'manual',   -- manual | mill_statement
  updated_by    text,
  updated_at    timestamptz not null default now(),
  unique (estate, year, month)
);
create index if not exists opp_mgmt_monthly_estate_year_idx on public.opp_mgmt_monthly (estate, year);

-- Same access as the other opp_* tables while the classic app is live
-- (it signs in with the anon key). The cutover RLS migration locks it to
-- the estates a user may open, like opp_rainfall_txns.
alter table public.opp_mgmt_monthly enable row level security;
grant select, insert, update, delete on public.opp_mgmt_monthly to anon, authenticated;
drop policy if exists opp_mgmt_monthly_all on public.opp_mgmt_monthly;
create policy opp_mgmt_monthly_all on public.opp_mgmt_monthly
  for all to anon, authenticated using (true) with check (true);
