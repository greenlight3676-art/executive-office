create table if not exists approvals (
  id uuid primary key,
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

create table if not exists approval_events (
  id uuid primary key,
  approval_request_id uuid not null references approvals(id) on delete cascade,
  event_type text not null,
  actor_id text not null,
  previous_status text not null,
  new_status text not null,
  timestamp timestamptz not null default now(),
  safe_metadata jsonb
);

create table if not exists missions (
  id uuid primary key,
  title text not null,
  description text not null,
  project_id text not null,
  created_by text not null,
  assigned_executives jsonb not null default '[]'::jsonb,
  status text not null check (status in ('draft','planned','active','blocked','waiting_approval','completed','cancelled','failed')),
  priority text not null check (priority in ('low','medium','high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  due_at timestamptz,
  metadata jsonb
);

create table if not exists tasks (
  id uuid primary key,
  mission_id uuid not null references missions(id) on delete cascade,
  title text not null,
  description text not null,
  assigned_executive text not null,
  status text not null check (status in ('todo','assigned','working','blocked','waiting_approval','completed','cancelled','failed')),
  priority text not null check (priority in ('low','medium','high')),
  dependency_ids jsonb not null default '[]'::jsonb,
  requires_approval boolean not null default false,
  approval_request_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  due_at timestamptz,
  metadata jsonb
);

create table if not exists conversations (
  id uuid primary key,
  executive_id text not null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb
);

create table if not exists messages (
  id uuid primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now(),
  metadata jsonb
);

create table if not exists memories (
  id uuid primary key,
  executive_id text not null,
  scope text not null check (scope in ('short-term','long-term','project')),
  content text not null,
  kind text not null,
  created_at timestamptz not null default now(),
  metadata jsonb
);

create index if not exists idx_approvals_status on approvals(status);
create index if not exists idx_approvals_executive on approvals(executive_id);
create index if not exists idx_approvals_project on approvals(project_id);
create index if not exists idx_approvals_risk on approvals(risk_level);
create index if not exists idx_approval_events_request on approval_events(approval_request_id);
create index if not exists idx_tasks_mission on tasks(mission_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_missions_status on missions(status);
create index if not exists idx_memories_executive on memories(executive_id);
