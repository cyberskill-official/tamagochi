-- TASK-INFRA-001 concrete migration for infra/supabase/standard/migrations/20260517_028_battle_pass.sql
create table if not exists public.t_028_battle_pass (
  id text primary key,
  tenant_id text not null default 'mochi',
  owner_id text,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.t_028_battle_pass enable row level security;

drop policy if exists "t_028_battle_pass_tenant_read" on public.t_028_battle_pass;
create policy "t_028_battle_pass_tenant_read" on public.t_028_battle_pass
  for select using (tenant_id = current_setting('app.tenant_id', true));

drop policy if exists "t_028_battle_pass_tenant_write" on public.t_028_battle_pass;
create policy "t_028_battle_pass_tenant_write" on public.t_028_battle_pass
  for all using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));

create index if not exists t_028_battle_pass_tenant_status_idx on public.t_028_battle_pass (tenant_id, status);
