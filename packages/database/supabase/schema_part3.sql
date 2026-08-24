-- Migration: Encrypted Blob Cloud Sync
-- Stores the user's complete database as a single AES-256-GCM encrypted payload.
-- No plaintext financial data is ever written to Supabase (CRIT-02).
-- Required before cloud backup / cross-device sync can function.

-- 1. Encrypted user database table (one row per authenticated user)
create table if not exists public.user_dbs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload text not null,
  schema_version int not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.user_dbs enable row level security;

-- 2. RLS policies — users may only read / write their own encrypted row
--    (the payload is encrypted with the user's PIN-derived key; even the
--    database admin cannot read the data without the PIN.)

drop policy if exists "select own db" on public.user_dbs;
create policy "select own db" on public.user_dbs
  for select using (auth.uid() = user_id);

drop policy if exists "insert own db" on public.user_dbs;
create policy "insert own db" on public.user_dbs
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own db" on public.user_dbs;
create policy "update own db" on public.user_dbs
  for update using (auth.uid() = user_id);

drop policy if exists "delete own db" on public.user_dbs;
create policy "delete own db" on public.user_dbs
  for delete using (auth.uid() = user_id);
