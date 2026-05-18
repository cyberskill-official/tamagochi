import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { TamagochiGameSession } from '../../src/index.ts';

test('E2E-006 game session orchestrator passes all product journeys', () => {
  const session = new TamagochiGameSession();
  const results = session.runAll();
  assert.equal(results.length, 5);
  assert.equal(results.every((result) => result.passed), true);
  assert.deepEqual(results.map((result) => result.name), [
    'standard-player-hatch-care-ai-share',
    'under-13-parent-gated-safe-mode',
    'friend-coparent-breed-trade-ceremony',
    'ledger-iap-sub-ads-battle-pass',
    'petos-tenant-isolation-reference-tenants'
  ]);
});

test('E2E-007 web QA console serves live browser-ready artifact', async () => {
  const port = 4174;
  const child = spawn(process.execPath, ['scripts/serve-web-qa.mjs'], {
    cwd: new URL('../..', import.meta.url).pathname,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await once(child.stdout, 'data');
  try {
    const html = await fetch(`http://localhost:${port}`).then((res) => res.text());
    const js = await fetch(`http://localhost:${port}/app.js`).then((res) => res.text());
    assert.match(html, /Tamagochi QA Console/);
    assert.match(html, /Run All FR Journeys/);
    assert.match(js, /FR-B2B-005/);
    assert.match(js, /standard-player-flow/);
  } finally {
    child.kill();
  }
});
