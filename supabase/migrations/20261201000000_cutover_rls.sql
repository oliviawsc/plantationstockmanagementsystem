-- =====================================================================
--  APPLY AT CUTOVER ONLY — NOT BEFORE.
--  Apply this only when the React app replaces the legacy app (and every
--  legacy page that writes with the anon key is gone). The legacy app reads
--  opp_users.password_hash and every opp_* table with the anon key; after
--  this migration it stops working. See docs/security-cutover.md.
--  The timestamp in the file name is a placeholder: rename the file to the
--  real cutover date before `supabase db push`.
-- =====================================================================

-- ── Helpers (security definer: they read opp_users without RLS) ───────
create or replace function public.stock_caller_email()
returns text language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.stock_is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.stock_caller_email() = 'hqadmin.puigroups@gmail.com'
      or exists (
        select 1 from public.opp_users u
        where lower(u.email) = public.stock_caller_email()
          and to_jsonb(u.permissions) ->> '__role' = 'superadmin'
          and coalesce(u.status, 'active') <> 'inactive')
$$;

-- True when the caller may read/write rows of `p_estate`: the Super Admin
-- always; HQ users and estate workers (Worker Portal) for their estates.
-- Works whether opp_users.estates is text[] or jsonb.
create or replace function public.stock_can_access_estate(p_estate text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.stock_is_superadmin()
      or exists (
        select 1
        from public.opp_users u,
             lateral jsonb_array_elements_text(coalesce(to_jsonb(u.estates), '[]'::jsonb)) as e(name)
        where lower(u.email) = public.stock_caller_email()
          and coalesce(u.status, 'active') <> 'inactive'
          and e.name = p_estate)
$$;

revoke all on function public.stock_is_superadmin() from public, anon;
revoke all on function public.stock_can_access_estate(text) from public, anon;
grant execute on function public.stock_is_superadmin() to authenticated;
grant execute on function public.stock_can_access_estate(text) to authenticated;

-- ── opp_users: no anon access, password_hash never readable ────────────
alter table public.opp_users enable row level security;
revoke all on public.opp_users from anon, authenticated;
grant select (id, name, email, estates, permissions, status, last_active) on public.opp_users to authenticated;
grant update (last_active) on public.opp_users to authenticated;

drop policy if exists opp_users_read on public.opp_users;
create policy opp_users_read on public.opp_users for select to authenticated
  using (lower(email) = public.stock_caller_email() or public.stock_is_superadmin());

drop policy if exists opp_users_touch on public.opp_users;
create policy opp_users_touch on public.opp_users for update to authenticated
  using (lower(email) = public.stock_caller_email())
  with check (lower(email) = public.stock_caller_email());
-- Creating users, setting passwords, permissions and status go through Edge
-- Functions (service role) from now on.

-- ── opp_estates: everyone signed in reads, Super Admin manages ─────────
alter table public.opp_estates enable row level security;
revoke all on public.opp_estates from anon;
grant select, insert, update, delete on public.opp_estates to authenticated;
drop policy if exists opp_estates_read on public.opp_estates;
create policy opp_estates_read on public.opp_estates for select to authenticated using (true);
drop policy if exists opp_estates_admin on public.opp_estates;
create policy opp_estates_admin on public.opp_estates for all to authenticated
  using (public.stock_is_superadmin()) with check (public.stock_is_superadmin());

-- ── Estate data: signed-in users limited to their estates ──────────────
do $$
declare t text;
begin
  foreach t in array array[
    'opp_items', 'opp_locations', 'opp_transactions', 'opp_manuring_rounds',
    'opp_fieldmaint_rounds', 'opp_maint_claims', 'opp_chem_ingredients', 'opp_rainfall_txns'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    -- remove any older permissive policies (e.g. "allow anon all")
    execute format('drop policy if exists stock_estate_rw on public.%I', t);
    execute format(
      'create policy stock_estate_rw on public.%I for all to authenticated '
      'using (public.stock_can_access_estate(estate)) '
      'with check (public.stock_can_access_estate(estate))', t);
  end loop;
end $$;

-- Before applying, list existing policies and drop the permissive legacy ones:
--   select tablename, policyname, roles, cmd, qual from pg_policies
--   where schemaname = 'public' and tablename like 'opp_%';
-- Policies are OR-ed: a leftover "using (true)" policy would undo all of this.
