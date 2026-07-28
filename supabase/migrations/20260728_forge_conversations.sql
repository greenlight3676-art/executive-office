create extension if not exists pgcrypto;

create table if not exists public.forge_conversations (
  id uuid primary key default gen_random_uuid(),
  executive_id text not null check (executive_id in ('orynth','brayko','lunexa','vyreel','kavro')),
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forge_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.forge_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.forge_memories (
  id uuid primary key default gen_random_uuid(),
  executive_id text not null check (executive_id in ('orynth','brayko','lunexa','vyreel','kavro')),
  scope text not null check (scope in ('short-term','long-term','project')),
  content text not null,
  kind text not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists forge_conversations_executive_idx
  on public.forge_conversations (executive_id, updated_at desc);

create index if not exists forge_messages_conversation_idx
  on public.forge_messages (conversation_id, created_at asc);

create index if not exists forge_memories_executive_idx
  on public.forge_memories (executive_id, created_at desc);

alter table public.forge_conversations enable row level security;
alter table public.forge_messages enable row level security;
alter table public.forge_memories enable row level security;

comment on table public.forge_conversations is 'Persistent direct-message threads between TJ and Forge executives.';
comment on table public.forge_messages is 'Ordered messages inside Forge executive conversations.';
comment on table public.forge_memories is 'Executive-specific memory used to preserve decisions and working context.';
