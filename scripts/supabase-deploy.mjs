import { constants, promises as fs } from 'node:fs';
import { join, relative } from 'node:path';
import { spawn } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const target = process.argv[2] ?? process.env.TAMAGOCHI_DEPLOY_TARGET ?? 'standard';

const targets = {
  standard: {
    projectRefEnv: 'SUPABASE_PROJECT_REF',
    sourceRoot: 'infra/supabase/standard',
    sharedFunctionsRoot: 'infra/supabase/edge-functions',
    functionNames: ['parental-consent-webhook', 'breach-draft-flush']
  },
  kids: {
    projectRefEnv: 'SUPABASE_KIDS_PROJECT_REF',
    fallbackProjectRefEnv: 'SUPABASE_PROJECT_REF',
    sourceRoot: 'infra/supabase/kids',
    sharedFunctionsRoot: 'infra/supabase/kids/edge-functions',
    functionNames: ['safe-harbor-webhook']
  }
};

const config = targets[target];
if (!config) {
  fail(`Unknown Supabase target "${target}". Expected one of: ${Object.keys(targets).join(', ')}`);
}

const required = [
  'SUPABASE_ACCESS_TOKEN',
  config.projectRefEnv,
  'SUPABASE_DB_PASSWORD'
];
if (config.fallbackProjectRefEnv && !process.env[config.projectRefEnv]) {
  required.splice(required.indexOf(config.projectRefEnv), 1, config.fallbackProjectRefEnv);
}

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  fail(`Missing required environment variables: ${missing.join(', ')}`);
}

const projectRef = process.env[config.projectRefEnv] ?? process.env[config.fallbackProjectRefEnv];
const workdir = join(root, `.supabase-deploy/${target}`);
const supabaseDir = join(workdir, 'supabase');

await fs.rm(workdir, { recursive: true, force: true });
await fs.mkdir(join(supabaseDir, 'migrations'), { recursive: true });
await fs.mkdir(join(supabaseDir, 'functions'), { recursive: true });

await fs.copyFile(join(root, config.sourceRoot, 'config.toml'), join(supabaseDir, 'config.toml'));
await copyDir(join(root, config.sourceRoot, 'migrations'), join(supabaseDir, 'migrations'));

if (target === 'standard') {
  await copyDir(join(root, 'infra/supabase/edge-functions/_shared'), join(supabaseDir, 'functions/_shared'));
}
await copyDir(join(root, config.sharedFunctionsRoot), join(supabaseDir, 'functions'));

const supabaseBin = await resolveSupabaseBin();
await run(supabaseBin.command, [
  ...supabaseBin.args,
  'link',
  '--project-ref',
  projectRef,
  '--password',
  process.env.SUPABASE_DB_PASSWORD,
  '--workdir',
  workdir
]);
await run(supabaseBin.command, [...supabaseBin.args, 'db', 'push', '--workdir', workdir]);

for (const name of config.functionNames) {
  await run(supabaseBin.command, [
    ...supabaseBin.args,
    'functions',
    'deploy',
    name,
    '--project-ref',
    projectRef,
    '--workdir',
    workdir
  ]);
}

await fs.rm(workdir, { recursive: true, force: true });
console.log(`Supabase ${target} deploy completed for project ${projectRef}.`);

async function resolveSupabaseBin() {
  const local = await commandExists('supabase');
  if (local) return { command: 'supabase', args: [] };
  const npx = await commandExists('npx');
  if (!npx) fail('Neither supabase nor npx is available. Install Supabase CLI or Node/npm.');
  return { command: 'npx', args: ['supabase@latest'] };
}

async function commandExists(command) {
  return await new Promise((resolve) => {
    const child = spawn(command, ['--version'], { stdio: 'ignore' });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

async function copyDir(source, destination) {
  await fs.access(source, constants.R_OK);
  await fs.mkdir(destination, { recursive: true });
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const destinationPath = join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyDir(sourcePath, destinationPath);
      continue;
    }
    await fs.copyFile(sourcePath, destinationPath);
  }
}

async function run(command, args) {
  console.log(`$ ${command} ${args.map((arg) => redact(arg)).join(' ')}`);
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: 'inherit'
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function redact(value) {
  if (value === process.env.SUPABASE_DB_PASSWORD) return '<SUPABASE_DB_PASSWORD>';
  if (value === process.env.SUPABASE_ACCESS_TOKEN) return '<SUPABASE_ACCESS_TOKEN>';
  return value;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
