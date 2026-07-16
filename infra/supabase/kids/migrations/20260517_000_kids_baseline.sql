-- TASK-INFRA-001 concrete migration for infra/supabase/kids/migrations/20260517_000_kids_baseline.sql
create table if not exists public.t_000_kids_baseline (
  id text primary key,
  tenant_id text not null default 'mochi',
  owner_id text,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.t_000_kids_baseline enable row level security;

drop policy if exists "t_000_kids_baseline_tenant_read" on public.t_000_kids_baseline;
create policy "t_000_kids_baseline_tenant_read" on public.t_000_kids_baseline
  for select using (tenant_id = current_setting('app.tenant_id', true));

drop policy if exists "t_000_kids_baseline_tenant_write" on public.t_000_kids_baseline;
create policy "t_000_kids_baseline_tenant_write" on public.t_000_kids_baseline
  for all using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));

create index if not exists t_000_kids_baseline_tenant_status_idx on public.t_000_kids_baseline (tenant_id, status);
