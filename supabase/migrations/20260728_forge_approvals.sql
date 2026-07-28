create extension if not exists pgcrypto;

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  executive_id text not null,
  action text not null,
  reason text not null,
  risk_level text not null check (risk_level in ('low','medium','high')),
  estimated_cost integer,
  project_id text,
  conversation_id text,
  payload_summary text,
  status text not null check (status in ('pending','approved','rejected','expired','cancelled','executed','failed')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  decided_at timestamptz,
  decided_by text,
  decision_reason text,
  execution_status text not null check (execution_status in ('pending','ready','blocked','executed','failed'))
);

create table if not exists public.approval_events (
  id uuid primary key default gen_random_uuid(),
  approval_request_id uuid not null references public.approvals(id) on delete cascade,
  event_type text not null,
  actor_id text not null,
  previous_status text not null,
  new_status text not null,
  timestamp timestamptz not null default now(),
  safe_metadata jsonb not null default '{}'::jsonb
);

create index if not exists approvals_status_idx on public.approvals(status);
create index if not exists approvals_executive_idx on public.approvals(executive_id);
create index if not exists approval_events_request_idx on public.approval_events(approval_request_id);

alter table public.approvals enable row level security;
alter table public.approval_events enable row level security;

comment on table public.approvals is 'CEO approval requests created by Forge executives.';
comment on table public.approval_events is 'Immutable decision trail for Forge approval requests.';
