# Forge Executive Office

Forge is TJ's lightweight AI operating layer. **ChatGPT is the default reasoning brain**; Forge handles the surrounding work that makes the assistant useful day to day:

- persistent conversations and memory
- missions and task tracking
- approvals for sensitive actions
- connected tools through Composio
- sandboxed code checks through E2B
- a mobile-first command center

## Operating principle

> ChatGPT thinks. Forge remembers, organizes, asks for approval, and acts.

Forge does not need five models debating every normal request. Executive profiles still provide roles, prompts, and perspectives, but OpenAI is the default provider for ordinary reasoning.

To explicitly restore executive-specific providers, set:

```bash
FORGE_SPECIALIST_MODE=true
```

Without that setting, Forge uses OpenAI whenever an OpenAI API key is configured.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm test
npm run lint
npm run build
```

## Deployment

The application is designed for Vercel with Supabase-backed persistence. Keep secrets in the deployment environment and never commit API keys to the repository.
