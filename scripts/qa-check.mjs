import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { BUILD_ORDER } from '../src/registry.ts';

const ROOT = new URL('..', import.meta.url).pathname;

function fail(message) {
  throw new Error(message);
}

async function requireFile(path, includes = []) {
  const full = join(ROOT, path);
  const text = await fs.readFile(full, 'utf8').catch(() => fail(`Missing ${path}`));
  for (const value of includes) {
    if (!text.includes(value)) fail(`${path} does not include required text: ${value}`);
  }
  return text;
}

await requireFile('README.md', ['Quick Start', 'Run The Live QA Console', 'Deployment Strategy']);
await requireFile('docs/PRD.md', ['Tamagochi Product Requirements Document', '53 feature requests', 'Release Gates']);
await requireFile('docs/SRS.md', ['Software Requirements Specification', 'External Interfaces', 'Verification Requirements']);
const testCases = await requireFile('docs/testing/TEST_CASES.md', ['Coverage Matrix', 'E2E-001', 'TC-053']);
await requireFile('docs/marketing/SOCIAL_CONTENT_SCHEDULE.md', ['Weekly Manual Schedule', 'Manual Posting Checklist']);
await requireFile('docs/feature-requests/IMPLEMENTATION_AUDIT_2026-05-18.md', ['Per-FR Audit Table', 'External Deployment Gates']);
await requireFile('apps/web-qa/index.html', ['Tamagochi QA Console', 'Run All FR Journeys']);
await requireFile('apps/web-game/index.html', ['Grove Quest Care Loop', 'virtual pet device', 'pet care controls']);

for (const id of BUILD_ORDER) {
  if (!testCases.includes(id)) fail(`TEST_CASES.md does not reference ${id}`);
}

const unitFiles = (await fs.readdir(join(ROOT, 'tests/unit'))).filter((file) => file.endsWith('.test.ts'));
const e2eFiles = (await fs.readdir(join(ROOT, 'tests/e2e'))).filter((file) => file.endsWith('.test.ts'));
if (unitFiles.length < 3) fail('Expected at least 3 unit test files');
if (e2eFiles.length < 2) fail('Expected at least 2 E2E test files');

const packageJson = JSON.parse(await fs.readFile(join(ROOT, 'package.json'), 'utf8'));
for (const script of ['test:unit', 'test:fr', 'test:e2e', 'fr:manifest', 'fr:audit', 'fr:check', 'qa:check', 'web:qa', 'web:game', 'verify']) {
  if (!packageJson.scripts?.[script]) fail(`package.json missing script ${script}`);
}

const markers = [
  ['implementationStatus', " = 'shipped'"].join(''),
  ['generated', 'For'].join(''),
  ['shipped migration', ' placeholder'].join(''),
  ['implementation', ' artifact'].join(''),
  ['shipped', ' artifact:'].join('')
];

async function allFiles(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.code-review-graph'].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await allFiles(path));
    else out.push(path);
  }
  return out;
}

for (const file of await allFiles(ROOT)) {
  if (file.endsWith('scripts/qa-check.mjs') || file.endsWith('scripts/harden-generated-artifacts.mjs')) continue;
  const text = await fs.readFile(file, 'utf8').catch(() => '');
  if (markers.some((marker) => text.includes(marker))) fail(`Generated placeholder marker remains in ${file}`);
}

console.log(`QA check passed: README, PRD, SRS, social schedule, ${BUILD_ORDER.length} test-case mappings, ${unitFiles.length} unit files, ${e2eFiles.length} E2E files, no placeholder markers.`);
