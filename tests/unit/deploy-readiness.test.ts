import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../..', import.meta.url).pathname;

test('Vercel and Supabase deployment surfaces are concrete', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const vercel = JSON.parse(await read('vercel.json'));
  const envExample = await read('.env.example');
  const standardConfig = await read('infra/supabase/standard/config.toml');
  const kidsConfig = await read('infra/supabase/kids/config.toml');
  const supabaseDeploy = await read('scripts/supabase-deploy.mjs');
  const vercelWorkflow = await read('.github/workflows/vercel-deploy.yml');
  const supabaseWorkflow = await read('.github/workflows/supabase-migrate.yml');
  const supabaseHealth = await read('api/supabase/health.js');
  const deployRunbook = await read('docs/deployment/VERCEL_SUPABASE.md');

  assert.equal(vercel.outputDirectory, 'dist/vercel-static');
  assert.equal(pkg.scripts['build:vercel'], 'node scripts/build-vercel-static.mjs');
  assert.equal(pkg.scripts['deploy:ready'], 'npm run verify && npm run build:vercel');
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(envExample, /SUPABASE_SERVICE_ROLE_KEY=/);
  assert.match(envExample, /SUPABASE_KIDS_PROJECT_REF=/);
  assert.match(standardConfig, /\[functions\.parental-consent-webhook\]/);
  assert.match(kidsConfig, /\[functions\.safe-harbor-webhook\]/);
  assert.match(supabaseDeploy, /supabase@latest/);
  assert.match(supabaseDeploy, /db', 'push'/);
  assert.match(vercelWorkflow, /vercel@54\.1\.0 build/);
  assert.match(supabaseWorkflow, /Deploy Supabase target/);
  assert.match(supabaseHealth, /missing_supabase_env/);
  assert.match(deployRunbook, /integration_terms_acceptance_required/);
  assert.match(deployRunbook, /supabase:deploy:standard/);
  assert.doesNotMatch(supabaseWorkflow, /generated_for/);
});

async function read(path: string): Promise<string> {
  return await readFile(new URL(path, `file://${root}/`), 'utf8');
}
