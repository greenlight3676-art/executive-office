# Forge Executive Office

Forge is TJ's personal AI operating layer. ChatGPT is the default reasoning brain; the executive profiles provide focused roles for strategy, building, growth, finance, and operations.

## Operator capabilities

- Executive chat with saved conversation history
- Browser microphone dictation and spoken replies
- Owner-controlled short-, long-, and project-memory
- Mission creation and task planning from normal conversation
- Boardroom review across the executive team
- Approval inbox for sensitive actions
- Read-only tool execution for inbox, calendar, GitHub, research, sandbox, and database inspection
- Approval-gated writes for email, calendar, GitHub, Google Docs, Sheets, Notion, Linear, and Supabase
- One-time trusted-device access through a private owner key, with Supabase sign-in as a fallback

## Safety model

Forge may prepare and run read-only actions automatically. External messages, code changes, publishing, database writes, deletes, spending, production changes, and other consequential actions require TJ's approval before execution.

## Required environment

```bash
OPENAI_API_KEY=
COMPOSIO_API_KEY=
FORGE_OWNER_KEY=
```

For persistent memory and mission data:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Optional specialist model routing is disabled by default. Enable it explicitly with:

```bash
FORGE_SPECIALIST_MODE=true
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

## Development

```bash
npm install
npm test
npm run build
npm run dev
```

The production verification workflow runs tests and a full Next.js build on every push and pull request.
