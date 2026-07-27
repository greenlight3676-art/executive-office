create table if not exists public.forge_missions (
  id uuid primary key,
  title text not null,
  description text not null default '',
  project_id text not null,
  created_by text not null,
  assigned_executives text[] not null default '{}',
  status text not null default 'planned' check (status in ('draft','planned','active','blocked','waiting_approval','completed','cancelled','failed')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.forge_tasks (
  id uuid primary key,
  mission_id uuid not null references public.forge_missions(id) on delete cascade,
  title text not null,
  description text not null default '',
  assigned_executive text not null,
  status text not null default 'todo' check (status in ('todo','assigned','working','blocked','waiting_approval','completed','cancelled','failed')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  dependency_ids text[] not null default '{}',
  requires_approval boolean not null default false,
  approval_request_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists forge_missions_updated_at_idx on public.forge_missions(updated_at desc);
create index if not exists forge_tasks_mission_id_idx on public.forge_tasks(mission_id);
create index if not exists forge_tasks_status_idx on public.forge_tasks(status);

alter table public.forge_missions enable row level security;
alter table public.forge_tasks enable row level security;

comment on table public.forge_missions is 'Forge Executive Office missions. Server access uses the Supabase service role.';
comment on table public.forge_tasks is 'Tasks assigned to Forge executives within a mission.';
