import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Required environment variables ──────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY;
const PORT               = process.env.PORT || '3000';

if (!TELEGRAM_BOT_TOKEN) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN environment variable is required');
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

// ── Write OpenClaw config from environment variables ─────────────────────────
const configDir = join(homedir(), '.openclaw');
mkdirSync(configDir, { recursive: true });

const TAVILY_API_KEY    = process.env.TAVILY_API_KEY;
const BRAVE_API_KEY     = process.env.BRAVE_API_KEY;
const GH_TOKEN          = process.env.GH_TOKEN || process.env.NIGHTLY_GITHUB_TOKEN;
const META_ACCESS_TOKEN = process.env.META_ADS_ACCESS_TOKEN;
const META_AD_ACCOUNT   = process.env.META_AD_ACCOUNT_ID;
const GROQ_API_KEY      = process.env.GROQ_API_KEY;
const OPENAI_API_KEY    = process.env.OPENAI_API_KEY;
const DEEPGRAM_API_KEY  = process.env.DEEPGRAM_API_KEY;

const config = {
  commands: {
    native: 'auto',
    nativeSkills: 'auto'
  },
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: 'open',
      botToken: TELEGRAM_BOT_TOKEN,
      allowFrom: ['*'],
      groupPolicy: 'allowlist',
      streaming: 'partial'
    }
  },
  gateway: {
    mode: 'remote',
    controlUi: {
      dangerouslyAllowHostHeaderOriginFallback: true
    }
  },
  plugins: {
    entries: {
      telegram: { enabled: true }
    }
  },
  tools: {
    web: {
      search: {
        provider: 'tavily',
        apiKey: TAVILY_API_KEY,
      }
    },
    media: {
      audio: {
        enabled: true,
        echoTranscript: true,
        echoFormat: '🎙️ "{transcript}"',
        models: [
          { provider: 'deepgram', model: 'nova-3' },
        ]
      }
    }
  },
  skills: {
    entries: {
      tavily: {
        enabled: true,
        apiKey: TAVILY_API_KEY,
        env: {
          TAVILY_API_KEY: TAVILY_API_KEY
        }
      },
      gh: {
        enabled: !!GH_TOKEN,
        env: {
          GH_TOKEN: GH_TOKEN
        }
      },
      'meta-ads-report': {
        enabled: !!(META_ACCESS_TOKEN && META_AD_ACCOUNT),
        env: {
          META_ACCESS_TOKEN: META_ACCESS_TOKEN,
          META_AD_ACCOUNT_ID: META_AD_ACCOUNT
        }
      },
      'gcal-pro': {
        enabled: !!process.env.GCAL_TOKEN_B64,
        env: {}
      },
      'gh-issues': {
        enabled: !!GH_TOKEN,
        env: {
          GH_TOKEN: GH_TOKEN
        }
      },
      'social-media-content-calendar': {
        enabled: true
      },
      'free-groq-voice': {
        enabled: false
      }
    }
  }
};

writeFileSync(
  join(configDir, 'openclaw.json'),
  JSON.stringify(config, null, 2)
);

// ── Write gcal-pro credentials from env vars (base64-encoded) ────────────────
const gcalDir = join(homedir(), '.config', 'gcal-pro');
mkdirSync(gcalDir, { recursive: true });

if (process.env.GCAL_CLIENT_SECRET_B64) {
  writeFileSync(
    join(gcalDir, 'client_secret.json'),
    Buffer.from(process.env.GCAL_CLIENT_SECRET_B64, 'base64').toString('utf8'),
    { mode: 0o600 }
  );
}
if (process.env.GCAL_TOKEN_B64) {
  writeFileSync(
    join(gcalDir, 'token.json'),
    Buffer.from(process.env.GCAL_TOKEN_B64, 'base64').toString('utf8'),
    { mode: 0o600 }
  );
}

// ── Write persistent workspace memory ────────────────────────────────────────
const workspaceDir = join(homedir(), '.openclaw', 'workspace');
mkdirSync(workspaceDir, { recursive: true });

writeFileSync(join(workspaceDir, 'AGENTS.md'), `# Agent Operating Instructions

You are an assistant for Nicholas Coleman (artist name: Felix Ames, Reunion Records).
You are his coding partner, music business advisor, and day-to-day operator.

## How to behave
- Be direct and concise — Nick is a musician, not an engineer. Plain English always.
- When discussing the Reunion Command Center, you have full context in MEMORY.md.
- For coding tasks on the Reunion app, write tasks to the nightly queue rather than doing them live unless asked.
- Always read MEMORY.md at the start of sessions to orient yourself.

## Nightly coding pipeline
Tasks go in \`nightly-tasks.md\` in the reunion-command-center repo root.
The pipeline runs at 2am CT. Changes are NOT auto-pushed — Nick gets a Telegram
summary in the morning with a run ID. To apply: GitHub Actions → "Apply Nightly
Changes" → enter the run ID (optionally specify individual files).

## Skill Installation Rules
- Never install a skill without Nick's explicit approval in the current conversation.
- When suggesting a skill, always provide the full GitHub URL so Nick can review it first.
- Only install skills from trusted sources: github.com/vercel-labs, or repos Nick has explicitly approved.
- Before suggesting \`npx skills add\`, summarize what the skill does in plain English.

## Code & Deployment Rules
- Never touch the main branch of any repo — always work on a dated branch (e.g. \`agent/2026-03-10\`).
- Never auto-deploy to Vercel. Changes go to a branch; Nick reviews and merges manually.
- Never modify: auth/login flows, Plaid integration, Supabase RLS policies, API routes handling financial data, .env files, or AGENTS.md itself.
- Always generate a plain-English summary of any code changes made.

## Data & Privacy Rules
- Never log or transmit user data, API keys, or secrets to any external service.
- Never make requests to unknown or unverified endpoints.
- Reunion Command Center API is read-only via /api/openclaw/ routes — never attempt writes through it.

## Communication Rules
- Always text Nick a summary when a task is complete.
- If unsure about an action, ask before proceeding — do not guess.
- Flag anything unexpected (unfamiliar files, config changes, errors) before acting on it.
`);

writeFileSync(join(workspaceDir, 'MEMORY.md'), `# Nick Coleman — Persistent Memory

## Identity
- **Name:** Nicholas Coleman
- **Artist name:** Felix Ames
- **Label:** Reunion Records
- **Focus:** Album rollout in progress (early 2026)

## Main Project: Reunion Command Center
- **Repo:** github.com/felixames3/reunion-command-center
- **Stack:** Next.js 16, Supabase (Postgres + Auth + RLS), Tailwind CSS, TypeScript
- **Deployed:** Vercel (project: reunion-app, account: felixames3-8602)
- **Dev server:** http://localhost:3000
- **Color theme:** ochre (ochre-600, ochre-700, etc.), dark/light class names, rounded-xl cards

## Features Built
- Release management (tracks, collaborators/splits, assets)
- BMI registration tracker (on track detail pages)
- Social calendar surface (on release detail pages, links ContentPiece to release)
- Release runway / timeline view (8-week countdown with milestone markers)
- Streaming analytics (DistroKid CSV import, Spotify API)
- Contract generator (AI-powered via Claude)
- Content planning/calendar
- UGC video studio (Replicate/Flux Pro, Creatomate)
- Financial tracking (Plaid integration)
- Social posting via Late API (Instagram @felixames 37.9k, TikTok @felixames 142.9k)
- Meta Ads campaign automation
- Multi-user auth with manager-artist relationships

## No-Touch Zones (nightly agent rules)
Never modify: auth flows (/src/app/(auth)/), Plaid integration, Supabase RLS policies,
middleware.ts, .env files, AGENT_RULES.md

## Nightly Coding Pipeline
- Tasks: add to \`nightly-tasks.md\` in repo root
- Runs: 2am CT via GitHub Actions
- Output: patch artifact + Telegram summary (nothing auto-pushed)
- Apply: GitHub Actions → "Apply Nightly Changes" → enter run ID
- Draft PR created for Nick to review before merging

## Key Environment & Services
- Supabase: Postgres DB + Auth + RLS
- Vercel: hosting (auto-deploys from main branch)
- Railway: this OpenClaw server (Hobby plan, 8GB RAM required)
- Telegram: primary interface for Nick ↔ agent
- Late API: social scheduling
- Resend: transactional email
- Replicate: AI image/video generation
- Creatomate: video rendering

## Known Accepted Risks
- xlsx package has moderate vulnerabilities — accepted, only used for trusted CSV imports
- Security scan threshold raised to "high" so Dependabot PRs don't fail CI

## Recent Milestones
- Privacy page live at /privacy (all 13 sections)
- Plaid security attestations completed (Feb 2026)
- Streaming dashboard overhauled (Amazon/Meta/TikTok platform grouping)
- Track-level collaborators and assets added
- Multi-user auth ready for first users
`);

// ── Copy bundled skills into ~/.openclaw/skills ───────────────────────────────
const bundledSkillsDir = join(__dirname, 'skills');
const openclawSkillsDir = join(homedir(), '.openclaw', 'skills');
mkdirSync(openclawSkillsDir, { recursive: true });

if (existsSync(bundledSkillsDir)) {
  const { readdirSync } = await import('fs');
  for (const skill of readdirSync(bundledSkillsDir)) {
    const src = join(bundledSkillsDir, skill);
    const dest = join(openclawSkillsDir, skill);
    cpSync(src, dest, { recursive: true });
    console.log(`Installed skill: ${skill}`);
  }
}

console.log('OpenClaw config and workspace memory written. Starting gateway...');

// ── Start the gateway ────────────────────────────────────────────────────────
const gateway = spawn(
  'node',
  [
    '--max-old-space-size=2048',
    './node_modules/openclaw/openclaw.mjs',
    'gateway',
    'run',
    '--bind', 'lan',
    '--port', PORT,
    '--allow-unconfigured'
  ],
  { stdio: 'inherit', env: { ...process.env, DEEPGRAM_API_KEY, GROQ_API_KEY, OPENAI_API_KEY: process.env.OPENAI_API_KEY } }
);

gateway.on('exit', (code) => {
  console.log(`Gateway exited with code ${code}`);
  process.exit(code ?? 1);
});
