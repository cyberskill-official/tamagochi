import { promises as fs } from 'node:fs';
import { basename, join } from 'node:path';
import { spawn } from 'node:child_process';
import { BUILD_ORDER } from '../src/registry.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const FR_ROOT = join(ROOT, 'docs/tasks');
const OUT_DIR = join(ROOT, 'docs/tasks/pipeline');
const MANIFEST = join(OUT_DIR, 'TASK_MANIFEST.md');
const STATE_JSON = join(OUT_DIR, 'task-manifest.json');
const AUDIT_DIR = join(OUT_DIR, 'audits');

const scaffoldPatterns = [
  /validate[A-Z][A-Za-z0-9]+\(.*checks:\s*\[/s,
  /policy gates are enforced fail-closed/,
  /negative-path validation is covered by root tests/,
  /concrete deliverable covered by npm run verify/,
  /task coverage: .*?\n\n## Deliverable\n\nThis artifact defines the concrete operating surface/s,
  /console\.log\('.*concrete deliverable verified by npm run verify'\)/
];

const externalByFr = new Map([
  ['TASK-INFRA-001', 'Cocos Creator native builds require Cocos editor/Xcode/Android signing. Local web QA and bundle tests are available.'],
  ['TASK-AUTH-001', 'Apple/Google OAuth production validation requires provider credentials. Signed local provider assertions are enforced in tests.'],
  ['TASK-AUTH-002', 'Zalo OA approval and OAuth credentials are external. Signed local provider assertions are enforced in tests.'],
  ['TASK-AR-001', 'ARKit/ARCore require physical supported devices. Photo Studio and AR decision logic are locally tested.'],
  ['TASK-ECON-002', 'Apple/Google/Antom/Xsolla receipts require merchant credentials. Signed local receipt assertions are enforced in tests.'],
  ['TASK-ADS-001', 'LevelPlay/AppLovin SDK calls require ad-network credentials. Local reward validation adapter is enforced in tests.'],
  ['TASK-ADS-002', 'SuperAwesome kWS requires vendor credentials. Contextual-only policy is locally enforced.'],
  ['TASK-I18N-001', 'Crowdin sync requires project token. Locale key coverage and local bundles are tested.'],
  ['TASK-I18N-002', 'Antom/Xsolla rails require merchant credentials. Pricing table validation is local.']
]);

function parseFrontmatter(text) {
  return text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
}

function scalar(frontmatter, key) {
  return frontmatter.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, 'm'))?.[1]?.trim();
}

function list(frontmatter, key) {
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

async function frFiles() {
  const out = [];
  for (const folder of await fs.readdir(FR_ROOT, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    for (const file of await fs.readdir(join(FR_ROOT, folder.name))) {
      if (/^TASK-.*\.md$/.test(file) && !file.endsWith('.audit.md')) out.push(join(FR_ROOT, folder.name, file));
    }
  }
  return out;
}

async function loadFrMap() {
  const byId = new Map();
  for (const file of await frFiles()) {
    const text = await fs.readFile(file, 'utf8');
    const fm = parseFrontmatter(text);
    const id = scalar(fm, 'id');
    byId.set(id, {
      id,
      file,
      title: scalar(fm, 'title') ?? basename(file),
      module: scalar(fm, 'module') ?? 'UNKNOWN',
      phase: scalar(fm, 'phase') ?? 'UNKNOWN',
      dependsOn: list(fm, 'depends_on').filter((dep) => /^TASK-/.test(dep)),
      deliverables: [...new Set([...list(fm, 'new_files'), ...list(fm, 'modified_files')])]
    });
  }
  return byId;
}

async function assess(task, completed = new Set()) {
  const missing = [];
  const scaffold = [];
  for (const rel of task.deliverables) {
    const path = join(ROOT, rel);
    const text = await fs.readFile(path, 'utf8').catch(() => null);
    if (text == null) {
      missing.push(rel);
      continue;
    }
    if (scaffoldPatterns.some((pattern) => pattern.test(text))) scaffold.push(rel);
  }
  const blockedDeps = task.dependsOn.filter((id) => !completed.has(id));
  if (blockedDeps.length) return { state: 'Blocked', reason: `Waiting on ${blockedDeps.join(', ')}`, missing, scaffold };
  if (missing.length || scaffold.length) return { state: 'Unimplemented', reason: `${missing.length} missing, ${scaffold.length} scaffold deliverables`, missing, scaffold };
  return {
    state: 'Implemented-Pending-Audit',
    reason: externalByFr.has(task.id) ? `Local signed/device adapter branch available; production gate: ${externalByFr.get(task.id)}` : 'Deliverables exist and need strict audit',
    missing,
    scaffold
  };
}

async function run(command, args) {
  return await new Promise((resolve) => {
    const child = spawn(command, args, { cwd: ROOT, shell: false });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ code, stdout, stderr, cmd: [command, ...args].join(' ') }));
  });
}

async function writeManifest(records, label) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const summary = records.reduce((acc, row) => {
    acc[row.state] = (acc[row.state] ?? 0) + 1;
    return acc;
  }, {});
  const states = ['Unimplemented', 'Implemented-Pending-Audit', 'Blocked', 'Completed', 'MANUAL INTERVENTION REQUIRED'];
  const lines = [
    '# Tamagochi Strict task Task Manifest',
    '',
    '**Generated:** 2026-05-18',
    `**Stage:** ${label}`,
    '',
    '## State Summary',
    '',
    '| State | Count |',
    '|---|---:|',
    ...states.map((state) => `| ${state} | ${summary[state] ?? 0} |`),
    '',
    '## task States',
    '',
    '| # | TASK-ID | Phase | Module | State | Reason |',
    '|---:|---|---|---|---|---|',
    ...records.map((row, index) => `| ${index + 1} | ${row.id} | ${row.phase} | ${row.module} | ${row.state} | ${String(row.reason).replaceAll('|', '/')} |`)
  ];
  await fs.writeFile(MANIFEST, `${lines.join('\n')}\n`, 'utf8');
  await fs.writeFile(STATE_JSON, `${JSON.stringify({ generated: '2026-05-18', stage: label, summary, records }, null, 2)}\n`, 'utf8');
}

async function writeAudit(row, checks) {
  await fs.mkdir(AUDIT_DIR, { recursive: true });
  const lines = [
    `# ${row.id} Strict Audit Report`,
    '',
    `**State:** ${row.state}`,
    `**Reason:** ${row.reason}`,
    `**Deliverables checked:** ${row.deliverables.length}`,
    `**Missing deliverables:** ${row.missing?.length ?? 0}`,
    `**Scaffold deliverables:** ${row.scaffold?.length ?? 0}`,
    '',
    '## Raw Terminal Results',
    ''
  ];
  for (const check of checks) {
    lines.push(`### ${check.cmd}`, '', '```text', check.stdout.trim() || '(no stdout)', check.stderr.trim() ? `\nSTDERR:\n${check.stderr.trim()}` : '', `exit_code=${check.code}`, '```', '');
  }
  await fs.writeFile(join(AUDIT_DIR, `${row.id}.md`), `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  const mode = process.argv[2] ?? 'init';
  const byId = await loadFrMap();
  const completed = new Set();
  const records = [];
  for (const id of BUILD_ORDER) {
    const task = byId.get(id);
    if (!task) throw new Error(`Missing ${id}`);
    const row = { ...fr, ...(await assess(task, completed)), attempts: 0 };
    records.push(row);
    await writeManifest(records.concat(BUILD_ORDER.slice(records.length).map((pendingId) => {
      const pending = byId.get(pendingId);
      return { ...pending, state: 'Blocked', reason: 'Pending earlier one-by-one processing', attempts: 0, missing: [], scaffold: [] };
    })), `after scan ${id}`);

    if (mode !== 'audit-all') continue;
    if (row.state !== 'Implemented-Pending-Audit') {
      await writeAudit(row, []);
      continue;
    }
    const checks = [
      await run('npm', ['run', 'test:unit']),
      await run('npm', ['run', 'test:task', '--', '--test-name-pattern', row.id]),
      await run('npm', ['run', 'test:e2e']),
      await run('npm', ['run', 'task:check']),
      await run('npm', ['run', 'qa:check'])
    ];
    const passed = checks.every((check) => check.code === 0);
    row.state = passed ? 'Completed' : 'Unimplemented';
    row.reason = passed
      ? (externalByFr.has(id) ? `Completed with local signed/device adapter validation; production gate: ${externalByFr.get(id)}` : 'Completed with passing unit, targeted task, E2E, task check, and QA check')
      : 'Audit failed; implementation requires refactor';
    if (passed) completed.add(id);
    await writeAudit(row, checks);
    await writeManifest(records.concat(BUILD_ORDER.slice(records.length).map((pendingId) => {
      const pending = byId.get(pendingId);
      return { ...pending, state: 'Blocked', reason: 'Pending earlier one-by-one processing', attempts: 0, missing: [], scaffold: [] };
    })), `after ${id}`);
  }
  await writeManifest(records, mode === 'init' ? 'initial scan' : mode);
  console.log(await fs.readFile(MANIFEST, 'utf8'));
}

await main();
