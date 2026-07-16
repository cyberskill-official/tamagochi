-- TASK-INFRA-001 concrete migration for infra/supabase/kids/migrations/20260517_001_invite_codes.sql
create table if not exists public.t_001_invite_codes (
  id text primary key,
  tenant_id text not null default 'mochi',
  owner_id text,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.t_001_invite_codes enable row level security;

drop policy if exists "t_001_invite_codes_tenant_read" on public.t_001_invite_codes;
create policy "t_001_invite_codes_tenant_read" on public.t_001_invite_codes
  for select using (tenant_id = current_setting('app.tenant_id', true));

drop policy if exists "t_001_invite_codes_tenant_write" on public.t_001_invite_codes;
create policy "t_001_invite_codes_tenant_write" on public.t_001_invite_codes
  for all using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));

create index if not exists t_001_invite_codes_tenant_status_idx on public.t_001_invite_codes (tenant_id, status);
