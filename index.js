import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CREDENTIALS = path.join(os.homedir(), '.dsh', '.credentials.yaml');
const KEY_ORDER = ['DSH_IMAGE_API_KEY', 'OPENAI_API_KEY'];

function readStoredKeys() {
  if (!existsSync(CREDENTIALS)) return {};
  const found = {};
  try {
    const text = readFileSync(CREDENTIALS, 'utf8');
    const refs = text.split(/\r?\nrefs:\s*\r?\n/)[1];
    if (!refs) return {};
    for (const line of refs.split(/\r?\n/)) {
      const match = /^\s+([A-Za-z0-9_]+)\s*:\s*(\S+)\s*$/.exec(line);
      if (match && !line.trim().startsWith('#')) found[match[1]] = match[2];
    }
  } catch {
    return {};
  }
  return found;
}

function resolveApiKey() {
  for (const name of KEY_ORDER) {
    if (process.env[name]) return process.env[name];
  }
  const stored = readStoredKeys();
  for (const name of KEY_ORDER) {
    if (stored[name]) return stored[name];
  }
  return '';
}

function resolvePython() {
  if (process.env.DSH_IMAGE_PYTHON) return { command: process.env.DSH_IMAGE_PYTHON, args: ['-3'] };
  return { command: 'py', args: ['-3'] };
}

export function apply(ctx) {
  const script = path.join(here, 'server', 'image_http_server.py');
  if (!existsSync(script)) {
    ctx.logger?.warn?.(`guided-image-generation: server script missing at ${script}`);
    return;
  }

  const apiKey = resolveApiKey();
  const python = resolvePython();

  let child;
  try {
    child = spawn(python.command, python.args.concat([script]), {
      cwd: here,
      env: {
        ...process.env,
        DSH_IMAGE_ROOT: process.env.DSH_IMAGE_ROOT || process.cwd(),
        PYTHONIOENCODING: 'utf-8',
        ...(apiKey ? { OPENAI_API_KEY: apiKey } : {}),
      },
      stdio: 'ignore',
      windowsHide: true,
    });
    child.on('error', (error) => {
      ctx.logger?.warn?.(`guided-image-generation: failed to start bridge: ${error.message}`);
    });
  } catch (error) {
    ctx.logger?.warn?.(`guided-image-generation: failed to start bridge: ${error.message}`);
    return;
  }

  if (!apiKey) {
    ctx.logger?.warn?.('guided-image-generation: no API key in environment; users must set one in the panel');
  }

  ctx.effect(() => () => {
    try { child.kill(); } catch { /* already gone */ }
  });
}
