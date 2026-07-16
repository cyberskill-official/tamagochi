import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { BUILD_ORDER } from '../src/registry.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const FR_ROOT = join(ROOT, 'docs/tasks');

function fail(message) {
  throw new Error(message);
}

function parseFrontmatter(text) {
  return text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function parseScalar(frontmatter, key) {
  return frontmatter.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, 'm'))?.[1]?.trim();
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

/**
 * CyberOS task layout (post FR→TASK migration):
 *   docs/tasks/<module>/TASK-<ID>-slug/{spec.md,audit.md}
 * Legacy flat layout still accepted:
 *   docs/tasks/<module>/TASK-*.md + TASK-*.audit.md
 */
async function listTaskSpecs() {
  const folders = await fs.readdir(FR_ROOT, { withFileTypes: true });
  const specs = [];
  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    if (folder.name.startsWith('.') || folder.name === 'pipeline' || folder.name === '_audits') continue;
    const moduleDir = join(FR_ROOT, folder.name);
    for (const entry of await fs.readdir(moduleDir, { withFileTypes: true })) {
      // New layout: TASK-* directory with spec.md
      if (entry.isDirectory() && /^TASK-/.test(entry.name)) {
        const specPath = join(moduleDir, entry.name, 'spec.md');
        const auditPath = join(moduleDir, entry.name, 'audit.md');
        try {
          await fs.access(specPath);
          specs.push({ specPath, auditPath, kind: 'dir' });
        } catch {
          // incomplete task dir — skip
        }
        continue;
      }
      // Legacy layout: TASK-*.md (not audit)
      if (entry.isFile() && /^TASK-.*\.md$/.test(entry.name) && !entry.name.endsWith('.audit.md')) {
        const specPath = join(moduleDir, entry.name);
        const auditPath = specPath.replace(/\.md$/, '.audit.md');
        specs.push({ specPath, auditPath, kind: 'file' });
      }
    }
  }
  return specs.sort((a, b) => a.specPath.localeCompare(b.specPath));
}

const taskSpecs = await listTaskSpecs();
if (taskSpecs.length !== BUILD_ORDER.length) {
  fail(`task file count ${taskSpecs.length} did not match build order ${BUILD_ORDER.length}`);
}

const seen = new Set();
let materialized = 0;
for (const { specPath, auditPath } of taskSpecs) {
  const text = await fs.readFile(specPath, 'utf8');
  const fm = parseFrontmatter(text);
  const id = parseScalar(fm, 'id');
  if (!id) fail(`Missing id in ${specPath}`);
  if (!BUILD_ORDER.includes(id)) fail(`Unexpected task id ${id}`);
  if (parseScalar(fm, 'status') !== 'done') fail(`${id} is not done`);
  if (parseScalar(fm, 'shipped') !== '2026-05-17') fail(`${id} missing shipped date`);
  const audit = await fs.readFile(auditPath, 'utf8').catch(() => {
    fail(`${id} missing audit at ${auditPath}`);
  });
  if (!/score_post_revision_2: 10\/10/.test(audit)) fail(`${id} audit not 10/10`);
  const paths = [...new Set([...parseList(fm, 'new_files'), ...parseList(fm, 'modified_files')])];
  for (const rel of paths) {
    await fs.access(join(ROOT, rel)).catch(() => fail(`${id} declared missing file ${rel}`));
    materialized += 1;
  }
  seen.add(id);
}

for (const id of BUILD_ORDER) {
  if (!seen.has(id)) fail(`Build order id ${id} has no task file`);
}

const backlog = await fs.readFile(join(FR_ROOT, 'BACKLOG.md'), 'utf8');
for (const id of BUILD_ORDER) {
  const row = backlog.split('\n').find((line) => line.includes(`**${id}**`));
  if (!row || !/\|\s*done\s*\|/.test(row)) fail(`Backlog row for ${id} is not done`);
}
if (/accepted \(10\/10\)/.test(backlog)) fail('Backlog still contains accepted rows');
if (/shipped \(10\/10\)/.test(backlog)) fail('Backlog still contains retired shipped-with-modifier statuses');
const totalRow = backlog.split('\n').find((line) => line.startsWith('| **Total** |'));
if (!totalRow || !/\|\s*\**53\**\s*\|/.test(totalRow)) fail('Backlog total was not corrected to 53 tasks');

const manifest = JSON.parse(await fs.readFile(join(FR_ROOT, 'MANIFEST.json'), 'utf8'));
if (manifest.totals.fr_count_shipped !== 53) fail('Manifest shipped count is not 53');
if (!String(manifest.totals.project_status).includes('shipped')) fail('Manifest project status is not shipped');

const implementationLog = await fs.readFile(join(FR_ROOT, 'IMPLEMENTATION_LOG.md'), 'utf8');
const logRows = implementationLog.split('\n').filter((line) => /^\| \d+ \| TASK-/.test(line));
if (logRows.length !== 53) fail(`Implementation log rows ${logRows.length} != 53`);

console.log(`task check passed: ${taskSpecs.length} tasks done, ${materialized} declared file references present.`);
