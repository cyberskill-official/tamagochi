-- FR-INFRA-001 concrete migration for infra/supabase/standard/migrations/20260517_010_care_actions.sql
create table if not exists public.t_010_care_actions (
  id text primary key,
  tenant_id text not null default 'mochi',
  owner_id text,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.t_010_care_actions enable row level security;

drop policy if exists "t_010_care_actions_tenant_read" on public.t_010_care_actions;
create policy "t_010_care_actions_tenant_read" on public.t_010_care_actions
  for select using (tenant_id = current_setting('app.tenant_id', true));

drop policy if exists "t_010_care_actions_tenant_write" on public.t_010_care_actions;
create policy "t_010_care_actions_tenant_write" on public.t_010_care_actions
  for all using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));

create index if not exists t_010_care_actions_tenant_status_idx on public.t_010_care_actions (tenant_id, status);
