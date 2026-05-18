-- FR-INFRA-001 concrete migration for infra/supabase/standard/migrations/20260517_029_push.sql
create table if not exists public.t_029_push (
  id text primary key,
  tenant_id text not null default 'mochi',
  owner_id text,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.t_029_push enable row level security;

drop policy if exists "t_029_push_tenant_read" on public.t_029_push;
create policy "t_029_push_tenant_read" on public.t_029_push
  for select using (tenant_id = current_setting('app.tenant_id', true));

drop policy if exists "t_029_push_tenant_write" on public.t_029_push;
create policy "t_029_push_tenant_write" on public.t_029_push
  for all using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));

create index if not exists t_029_push_tenant_status_idx on public.t_029_push (tenant_id, status);
