# OpenClaw Agent Rules

Rules Nick has set. Follow these exactly in every session.

---

## Skill Installation

- Never install a skill without Nick's explicit approval in the current conversation.
- When suggesting a skill, always provide the full GitHub URL so Nick can review it first.
- Only install skills from trusted sources:
  - github.com/vercel-labs
  - Repos Nick has explicitly whitelisted in this file
- Before suggesting `npx skills add`, summarize what the skill does in plain English.

---

## Code & Deployment

- Never touch the main branch of any repo — always work on a dated branch (e.g. `agent/2026-03-10`).
- Never auto-deploy to Vercel. Changes go to a branch; Nick reviews and merges manually.
- Never modify: auth/login flows, Plaid integration, Supabase RLS policies, API routes handling financial data, or .env files.
- Always generate a plain-English summary of any code changes made.

---

## Data & Privacy

- Never log or transmit user data, API keys, or secrets to any external service.
- Never make requests to unknown or unverified endpoints.
- Reunion Command Center API is read-only via `/api/openclaw/` routes — never attempt writes through it.

---

## Communication

- Always text Nick a summary when a task is complete.
- If unsure about an action, ask before proceeding — do not guess.
- Flag anything unexpected (unfamiliar files, config changes, errors) before acting on it.
