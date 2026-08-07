# Forge Executive Office

Forge is a private AI operating layer. OpenAI is the default reasoning brain; focused executive profiles handle strategy, building, design, growth, finance, and operations.

## Operator capabilities

- Executive chat with saved conversation history
- Browser microphone dictation and spoken replies
- Owner-controlled short-, long-, and project-memory
- Mission creation and task planning from normal conversation
- Mission reconciliation, stuck-work detection, progress tracking, and ordered execution
- Boardroom review across the executive team
- Approval inbox for sensitive actions
- Read-only tool execution for inbox, calendar, GitHub, research, sandbox, and database inspection
- Approval-gated writes for email, calendar, GitHub, Google Docs, Sheets, Notion, Linear, and Supabase
- One-time trusted-device access through a private owner key
- Optional Supabase sign-in fallback restricted to the configured CEO email
- Installable mobile web-app manifest for iPhone/home-screen use

## Safety model

Forge may prepare and run read-only actions automatically. External messages, code changes, publishing, database writes, deletes, spending, production changes, and other consequential actions require owner approval before execution.

Production fails closed: Forge will not silently fall back to temporary in-memory mission, chat, memory, or approval storage when Supabase is missing, and API access is unavailable when production authentication is not securely configured.

## Required environment

Copy `.env.example` and provide real values through your deployment environment. Never commit secrets.

```bash
OPENAI_API_KEY=
COMPOSIO_API_KEY=
FORGE_OWNER_KEY=
```

For persistent production memory, missions, conversations, tasks, and approvals:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

If Supabase sign-in is enabled as an owner fallback, set an explicit allowlist identity:

```bash
FORGE_CEO_EMAIL=
```

Optional specialist model routing is disabled by default. Enable it explicitly with:

```bash
FORGE_SPECIALIST_MODE=true
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

Optional sandbox execution:

```bash
E2B_API_KEY=
```

## Database

The production schema uses these private Forge tables:

- `forge_missions`
- `forge_tasks`
- `forge_conversations`
- `forge_messages`
- `forge_memories`
- `approvals`
- `approval_events`

Row-level security is enabled. Server persistence uses the service-role key and keeps that key server-side. Apply the checked-in Supabase migrations before treating a new environment as production-ready.

## Development

```bash
npm install
npm test
npm run build
npm run dev
```

The production verification workflow runs tests and a full Next.js build on every push and pull request.

## Release gate

Before merging a release into `main`:

1. `npm test` passes.
2. `npm run build` passes.
3. Vercel preview is healthy.
4. Supabase migrations have been reviewed and applied to the intended production project.
5. Required production environment variables are configured.
6. No consequential action is executed without owner approval.
