create extension if not exists pgcrypto;

create table if not exists public.forge_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  project_id text not null default 'forge',
  created_by text not null default 'tj',
  assigned_executives jsonb not null default '[]'::jsonb,
  priority text not null default 'medium',
  status text not null default 'active',
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forge_missions_created_at_idx
  on public.forge_missions (created_at desc);

alter table public.forge_missions enable row level security;

-- Server-side Forge requests use the service role key, which bypasses RLS.
-- No public client policies are required yet.
