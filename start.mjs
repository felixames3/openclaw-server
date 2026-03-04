import { writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { spawn } from 'child_process';

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
    mode: 'remote'
  },
  plugins: {
    entries: {
      telegram: { enabled: true }
    }
  }
};

writeFileSync(
  join(configDir, 'openclaw.json'),
  JSON.stringify(config, null, 2)
);

console.log('OpenClaw config written. Starting gateway...');

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
  { stdio: 'inherit' }
);

gateway.on('exit', (code) => {
  console.log(`Gateway exited with code ${code}`);
  process.exit(code ?? 1);
});
