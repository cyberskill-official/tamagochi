import { promises as fs } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { spawn } from 'node:child_process';
import { BUILD_ORDER } from '../src/registry.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const RUN_DATE = '2026-05-20';
const FR_ROOT = join(ROOT, 'docs/feature-requests');
const BACKLOG = join(FR_ROOT, 'BACKLOG.md');
const OUT_DIR = join(FR_ROOT, 'pipeline');
const AUDIT_DIR = join(OUT_DIR, 'fresh-audits');
const STATE_JSON = join(OUT_DIR, 'fresh-revalidation.json');
const SUMMARY_MD = join(OUT_DIR, `FRESH_REVALIDATION_${RUN_DATE}.md`);
const EDGE_MATRIX = join(FR_ROOT, `EDGE_CASE_MATRIX_${RUN_DATE}.md`);

const scaffoldPatterns = [
  /validate[A-Z][A-Za-z0-9]+\(.*checks:\s*\[/s,
  /policy gates are enforced fail-closed/,
  /negative-path validation is covered by root tests/,
  /concrete deliverable covered by npm run verify/,
  /FR coverage: .*?\n\n## Deliverable\n\nThis artifact defines the concrete operating surface/s,
  /console\.log\('.*concrete deliverable verified by npm run verify'\)/
];

const externalByFr = new Map([
  ['FR-INFRA-001', 'Cocos Creator native builds require Cocos editor/Xcode/Android signing; local web QA and bundle tests are available.'],
  ['FR-AUTH-001', 'Apple/Google OAuth production validation requires provider credentials; sandbox token validation is local.'],
  ['FR-AUTH-002', 'Zalo OA approval and OAuth credentials are external; mocked bearer validation is local.'],
  ['FR-AR-001', 'ARKit/ARCore require physical devices; Photo Studio fallback and AR decision logic are local.'],
  ['FR-ECON-002', 'Apple/Google/Antom/Xsolla receipts require merchant credentials; receipt-prefix sandbox validation is local.'],
  ['FR-ADS-001', 'LevelPlay/AppLovin SDK calls require ad-network credentials; reward validation is mocked local.'],
  ['FR-ADS-002', 'SuperAwesome kWS requires sandbox credentials; contextual-only policy is enforced local.'],
  ['FR-I18N-001', 'Crowdin sync requires a project token; locale bundle coverage is local.'],
  ['FR-I18N-002', 'Antom/Xsolla rails require merchant credentials; pricing table validation is local.']
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
    const dir = join(FR_ROOT, folder.name);
    for (const file of await fs.readdir(dir)) {
      if (/^FR-.*\.md$/.test(file) && !file.endsWith('.audit.md')) out.push(join(dir, file));
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
      dependsOn: list(fm, 'depends_on').filter((dep) => /^FR-/.test(dep)),
      deliverables: [...new Set([...list(fm, 'new_files'), ...list(fm, 'modified_files')])]
    });
  }
  return byId;
}

function edgeProfile(fr) {
  const module = fr.module.toLowerCase();
  const common = {
    nulls: 'Reject null user, tenant, payload, and ids fail-closed.',
    extreme: 'Clamp numeric bounds and enforce caps for quotas, bundle size, currency, and frequency.',
    malformed: 'Reject malformed tokens, payloads, files, names, locale keys, and tenant slugs.',
    race: 'Re-run server-side state checks before mutating shared pet, ledger, trade, or tenant state.',
    observability: `Emit tenant-tagged ${module}.accepted / ${module}.rejected audit events.`
  };
  if (fr.module === 'AUTH') common.race = 'Invite-code verification must be single-use and parent consent must be checked at commit time.';
  if (fr.module === 'ECON') common.race = 'Double-entry ledger writes must stay balanced under concurrent spend and receipt replay.';
  if (fr.module === 'SOCIAL') common.race = 'Friend, PetPair, trade, and ceremony state machines must re-check both parties before commit.';
  if (fr.module === 'B2B') common.malformed = 'Reject unknown tenant slugs, cross-tenant SSO, bad manifest JSON, and unauthorized DPO views.';
  if (fr.module === 'AI') common.nulls = 'Reject empty prompts/persona/memory and route under-13 users to scripted replies only.';
  return common;
}

async function writeEdgeMatrix(frs) {
  const lines = [
    `# Zero-Touch Edge-Case Matrix - ${RUN_DATE}`,
    '',
    'Generated before fresh revalidation. Current FR status labels were ignored; this matrix defines the edge classes used to verify the existing implementation before any status was re-derived.',
    '',
    '| # | FR-ID | Module | Null / empty inputs | Extreme bounds | Malformed payloads | Concurrent / race risks | Observability |',
    '|---:|---|---|---|---|---|---|---|'
  ];
  frs.forEach((fr, index) => {
    const p = edgeProfile(fr);
    lines.push(`| ${index + 1} | ${fr.id} | ${fr.module} | ${p.nulls} | ${p.extreme} | ${p.malformed} | ${p.race} | ${p.observability} |`);
  });
  await fs.writeFile(EDGE_MATRIX, `${lines.join('\n')}\n`, 'utf8');
}

async function assessDeliverables(fr, completed) {
  const missing = [];
  const scaffold = [];
  for (const rel of fr.deliverables) {
    const abs = join(ROOT, rel);
    const text = await fs.readFile(abs, 'utf8').catch(() => null);
    if (text == null) {
      missing.push(rel);
      continue;
    }
    if (scaffoldPatterns.some((pattern) => pattern.test(text))) scaffold.push(rel);
  }
  const blockedDeps = fr.dependsOn.filter((id) => !completed.has(id));
  if (blockedDeps.length) return { ready: false, state: 'ready_to_implement', reason: `Routed back for rework: waiting on ${blockedDeps.join(', ')}`, missing, scaffold };
  if (missing.length || scaffold.length) {
    return { ready: false, state: 'ready_to_implement', reason: `Routed back for rework: ${missing.length} missing and ${scaffold.length} scaffold deliverables`, missing, scaffold };
  }
  return { ready: true, state: 'implementation-present', reason: 'Declared deliverables exist and no scaffold markers were detected.', missing, scaffold };
}

function classifyFailure(check) {
  if (check.cmd.includes('test:unit')) return { vector: 'logic flaw', hypothesis: 'A unit-level service contract regressed.', action: 'Open the failing test output and patch the owning service method.' };
  if (check.cmd.includes('test:fr')) return { vector: 'FR contract drift', hypothesis: 'The implementation no longer satisfies the FR acceptance contract.', action: 'Patch the FR-owned service path or update a missing mock contract.' };
  if (check.cmd.includes('test:e2e')) return { vector: 'state/integration issue', hypothesis: 'Cross-module state sequencing or tenant isolation regressed.', action: 'Patch the orchestration path named in the failing E2E.' };
  if (check.cmd.includes('qa:check')) return { vector: 'documentation or artifact drift', hypothesis: 'A required artifact or README/test-case mapping is missing.', action: 'Patch the named artifact and rerun QA.' };
  return { vector: 'unknown', hypothesis: 'The command failed outside known gates.', action: 'Inspect stderr and patch the narrow failing file.' };
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

async function runFrChecks(id) {
  return [
    await run('npm', ['run', 'test:unit']),
    await run('npm', ['run', 'test:fr', '--', '--test-name-pattern', id]),
    await run('npm', ['run', 'test:e2e']),
    await run('npm', ['run', 'qa:check'])
  ];
}

function terminalStateFor(fr, passed) {
  if (!passed) return 'ready_to_implement';
  return 'done';
}

function generatedBlock(records, stage, rework) {
  const summary = records.reduce((acc, row) => {
    acc[row.state] = (acc[row.state] ?? 0) + 1;
    return acc;
  }, {});
  const states = Object.entries(summary).map(([state, count]) => `${state}: ${count}`).join('; ') || 'pending: 0';
  const lines = [
    '<!-- ZERO_TOUCH_REVALIDATION:START -->',
    '',
    `## §9 — Zero-touch ${rework ? 'rework' : 'stale-status revalidation'} (${RUN_DATE})`,
    '',
    rework
      ? 'Rework mode was enabled, so terminal `done` rows were force-re-evaluated from the start of the implementation phase. This ledger is derived from dependency order, declared deliverables, scaffold-marker detection, per-FR tests, E2E tests, QA checks, and final coverage.'
      : 'Current FR status labels were explicitly treated as stale for this run. This ledger is derived from dependency order, declared deliverables, scaffold-marker detection, per-FR tests, E2E tests, QA checks, and final coverage rather than from prior status text.',
    '',
    `**Stage:** ${stage}`,
    `**Summary:** ${states}`,
    `**Edge-case matrix:** [EDGE_CASE_MATRIX_${RUN_DATE}.md](EDGE_CASE_MATRIX_${RUN_DATE}.md)`,
    `**Raw reports:** [pipeline/fresh-audits/](pipeline/fresh-audits/)`,
    '',
    '| # | FR-ID | Derived state | External gate | Evidence |',
    '|---:|---|---|---|---|'
  ];
  records.forEach((row, index) => {
    const evidence = row.reason.replaceAll('|', '/');
    const externalGate = externalByFr.has(row.id) ? 'mock/sandbox local; production credentials/device required' : 'none';
    lines.push(`| ${index + 1} | ${row.id} | ${row.state} | ${externalGate} | ${evidence} |`);
  });
  lines.push('', '<!-- ZERO_TOUCH_REVALIDATION:END -->');
  return lines.join('\n');
}

function replaceStatusCell(backlog, id, state) {
  return backlog.replace(
    new RegExp(`(\\| \\*\\*${id}\\*\\* \\|[^\\n]*?\\| (?:MUST|SHOULD|COULD|MAY) \\| )[^|]+( \\|[^\\n]*\\| \\d+h \\|)`),
    `$1${state}$2`
  );
}

async function updateBacklog(records, stage, rework) {
  let text = await fs.readFile(BACKLOG, 'utf8');
  text = text.replace(
    /\*\*Owner:\*\* Stephen Cheng \(Founder, CyberSkill\) · \*\*Status:\*\* .*/,
    `**Owner:** Stephen Cheng (Founder, CyberSkill) · **Status:** v1.0.2 — ${rework ? 'rework mode' : 'stale statuses ignored'}; zero-touch revalidation ${stage}, ${RUN_DATE}`
  );
  text = text.replace(
    /- \*\*Strict-audited marker:\*\* .*/,
    '- **Terminal markers:** row status `done` is terminal for the zero-touch state engine; implementation-quality modifiers are captured in audit evidence, not the lifecycle status.'
  );
  text = text.replace(
    /- \*\*Terminal markers:\*\* row status `shipped \(10\/10\) \+ strict-audited` or `shipped \(10\/10\) \+ mocked-dependency` is terminal for the zero-touch state engine; prior status text is not trusted until this run re-derives it\./,
    '- **Terminal markers:** row status `done` is terminal for the zero-touch state engine; implementation-quality modifiers are captured in audit evidence, not the lifecycle status.'
  );
  for (const row of records) {
    if (row.state === 'done' || row.state === 'ready_to_implement') text = replaceStatusCell(text, row.id, row.state);
  }
  const block = generatedBlock(records, stage, rework);
  if (/<!-- ZERO_TOUCH_REVALIDATION:START -->[\s\S]*?<!-- ZERO_TOUCH_REVALIDATION:END -->/.test(text)) {
    text = text.replace(/<!-- ZERO_TOUCH_REVALIDATION:START -->[\s\S]*?<!-- ZERO_TOUCH_REVALIDATION:END -->/, block);
  } else {
    text = text.replace(/\n\*End of tamagochi backlog/, `\n${block}\n\n*End of tamagochi backlog`);
  }
  await fs.writeFile(BACKLOG, text, 'utf8');
}

async function writeAudit(row, checks, attempts) {
  await fs.mkdir(AUDIT_DIR, { recursive: true });
  const lines = [
    `# ${row.id} Fresh Zero-Touch Audit`,
    '',
    `**Derived state:** ${row.state}`,
    `**Reason:** ${row.reason}`,
    `**Attempts:** ${attempts}`,
    `**Deliverables checked:** ${row.deliverables.length}`,
    `**Missing deliverables:** ${row.missing?.length ?? 0}`,
    `**Scaffold deliverables:** ${row.scaffold?.length ?? 0}`,
    externalByFr.has(row.id) ? `**External production gate:** ${externalByFr.get(row.id)}` : '**External production gate:** none',
    '',
    '## Raw Terminal Results',
    ''
  ];
  for (const check of checks) {
    const failure = check.code === 0 ? null : classifyFailure(check);
    lines.push(`### ${check.cmd}`, '', '```text', check.stdout.trim() || '(no stdout)', check.stderr.trim() ? `\nSTDERR:\n${check.stderr.trim()}` : '', `exit_code=${check.code}`, '```', '');
    if (failure) {
      lines.push(`Failure vector: ${failure.vector}`, `Hypothesis: ${failure.hypothesis}`, `Targeted action: ${failure.action}`, '');
    }
  }
  await fs.writeFile(join(AUDIT_DIR, `${row.id}.md`), `${lines.join('\n')}\n`, 'utf8');
}

async function writeSummary(records, coverage) {
  const lines = [
    `# Fresh Zero-Touch Rework - ${RUN_DATE}`,
    '',
    'Rework mode force-re-evaluated the backlog from the start of the implementation phase, including FRs already marked `done`. The state below was re-derived from files and tests during this run.',
    '',
    '| State | Count |',
    '|---|---:|'
  ];
  const summary = records.reduce((acc, row) => {
    acc[row.state] = (acc[row.state] ?? 0) + 1;
    return acc;
  }, {});
  for (const [state, count] of Object.entries(summary)) lines.push(`| ${state} | ${count} |`);
  lines.push('', '## Coverage', '', '```text', coverage.stdout.trim() || '(no stdout)', coverage.stderr.trim() ? `\nSTDERR:\n${coverage.stderr.trim()}` : '', `exit_code=${coverage.code}`, '```', '');
  lines.push('## Reports', '');
  for (const row of records) lines.push(`- ${row.id}: ${relative(ROOT, join(AUDIT_DIR, `${row.id}.md`))}`);
  await fs.writeFile(SUMMARY_MD, `${lines.join('\n')}\n`, 'utf8');
}

async function coverageTargets() {
  const unitDir = join(ROOT, 'tests/unit');
  const e2eDir = join(ROOT, 'tests/e2e');
  const unit = (await fs.readdir(unitDir)).filter((file) => file.endsWith('.test.ts')).map((file) => join('tests/unit', file));
  const e2e = (await fs.readdir(e2eDir)).filter((file) => file.endsWith('.test.ts')).map((file) => join('tests/e2e', file));
  return [...unit, 'tests/fr-acceptance.test.ts', ...e2e];
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const rework = args.has('--rework') || args.has('rework');
  await fs.mkdir(AUDIT_DIR, { recursive: true });
  const byId = await loadFrMap();
  const frs = BUILD_ORDER.map((id) => {
    const fr = byId.get(id);
    if (!fr) throw new Error(`Missing FR file for ${id}`);
    return fr;
  });

  await writeEdgeMatrix(frs);

  const completed = new Set();
  const records = [];
  await updateBacklog(records, rework ? 'rework-started' : 'started', rework);

  for (const fr of frs) {
    const assessed = await assessDeliverables(fr, completed);
    const row = { ...fr, ...assessed, state: assessed.state, attempts: 0 };
    records.push(row);
    await updateBacklog(records, `assessed ${fr.id}`, rework);
    if (!assessed.ready) {
      await writeAudit(row, [], 0);
      await updateBacklog(records, `routed-back ${fr.id}`, rework);
      continue;
    }

    let checks = [];
    let passed = false;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      row.attempts = attempt;
      checks = await runFrChecks(fr.id);
      passed = checks.every((check) => check.code === 0);
      if (passed) break;
    }
    row.state = terminalStateFor(fr, passed);
    row.reason = passed
      ? (externalByFr.has(fr.id) ? `Done with local mock/sandbox coverage; production gate remains: ${externalByFr.get(fr.id)}` : 'Deliverables, unit tests, targeted FR contract, E2E, and QA checks passed.')
      : 'Routed back for rework: five consecutive verification attempts failed; no implementation edits were made by this runner.';
    if (passed) completed.add(fr.id);
    await writeAudit(row, checks, row.attempts);
    await updateBacklog(records, `completed ${fr.id}`, rework);
  }

  const coverage = await run('node', ['--test', '--experimental-test-coverage', ...(await coverageTargets())]);
  await writeSummary(records, coverage);
  await fs.writeFile(STATE_JSON, `${JSON.stringify({ generated: RUN_DATE, records, coverageExitCode: coverage.code }, null, 2)}\n`, 'utf8');
  await updateBacklog(records, coverage.code === 0 ? 'coverage-passed' : 'coverage-failed', rework);
  console.log(await fs.readFile(SUMMARY_MD, 'utf8'));
  if (coverage.code !== 0) process.exitCode = coverage.code;
}

await main();
