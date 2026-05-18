import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { BUILD_ORDER } from '../src/registry.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const FR_ROOT = join(ROOT, 'docs/feature-requests');

function fail(message) {
  throw new Error(message);
}

function parseFrontmatter(text) {
  return text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function parseScalar(frontmatter, key) {
  return frontmatter.match(new RegExp(`^${key}:\\s*\"?([^\"\\n]+)\"?`, 'm'))?.[1]?.trim();
}

function parseList(frontmatter, key) {
  const lines = frontmatter.split('\n');
  const out = [];
  let inList = false;
  for (const line of lines) {
    if (line.startsWith(`${key}:`)) {
      inList = true;
      continue;
    }
    if (inList && /^[a-zA-Z_]+:/.test(line)) break;
    if (!inList) continue;
    const match = line.match(/^  - "?([^"\n]+)"?$/);
    if (match) out.push(match[1]);
  }
  return out;
}

async function listFrFiles() {
  const folders = await fs.readdir(FR_ROOT, { withFileTypes: true });
  const files = [];
  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    const dir = join(FR_ROOT, folder.name);
    for (const file of await fs.readdir(dir)) {
      if (/^FR-.*\.md$/.test(file) && !file.endsWith('.audit.md')) files.push(join(dir, file));
    }
  }
  return files.sort();
}

const frFiles = await listFrFiles();
if (frFiles.length !== BUILD_ORDER.length) fail(`FR file count ${frFiles.length} did not match build order ${BUILD_ORDER.length}`);

const seen = new Set();
let materialized = 0;
for (const file of frFiles) {
  const text = await fs.readFile(file, 'utf8');
  const fm = parseFrontmatter(text);
  const id = parseScalar(fm, 'id');
  if (!BUILD_ORDER.includes(id)) fail(`Unexpected FR id ${id}`);
  if (parseScalar(fm, 'status') !== 'shipped') fail(`${id} is not shipped`);
  if (parseScalar(fm, 'shipped') !== '2026-05-17') fail(`${id} missing shipped date`);
  const auditPath = file.replace(/\.md$/, '.audit.md');
  const audit = await fs.readFile(auditPath, 'utf8');
  if (!/score_post_revision_2: 10\/10/.test(audit)) fail(`${id} audit not 10/10`);
  const paths = [...new Set([...parseList(fm, 'new_files'), ...parseList(fm, 'modified_files')])];
  for (const rel of paths) {
    await fs.access(join(ROOT, rel)).catch(() => fail(`${id} declared missing file ${rel}`));
    materialized += 1;
  }
  seen.add(id);
}

for (const id of BUILD_ORDER) {
  if (!seen.has(id)) fail(`Build order id ${id} has no FR file`);
}

const backlog = await fs.readFile(join(FR_ROOT, 'BACKLOG.md'), 'utf8');
for (const id of BUILD_ORDER) {
  const row = backlog.split('\n').find((line) => line.includes(`**${id}**`));
  if (!row || !row.includes('shipped (10/10)')) fail(`Backlog row for ${id} is not shipped`);
}
if (/accepted \(10\/10\)/.test(backlog)) fail('Backlog still contains accepted rows');
const totalRow = backlog.split('\n').find((line) => line.startsWith('| **Total** |'));
if (!totalRow || !/\|\s*\**53\**\s*\|/.test(totalRow)) fail('Backlog total was not corrected to 53 FRs');

const manifest = JSON.parse(await fs.readFile(join(FR_ROOT, 'MANIFEST.json'), 'utf8'));
if (manifest.totals.fr_count_shipped !== 53) fail('Manifest shipped count is not 53');
if (!String(manifest.totals.project_status).includes('shipped')) fail('Manifest project status is not shipped');

const implementationLog = await fs.readFile(join(FR_ROOT, 'IMPLEMENTATION_LOG.md'), 'utf8');
const logRows = implementationLog.split('\n').filter((line) => /^\| \d+ \| FR-/.test(line));
if (logRows.length !== 53) fail(`Implementation log rows ${logRows.length} != 53`);

console.log(`FR check passed: ${frFiles.length} FRs shipped, ${materialized} declared file references present.`);
