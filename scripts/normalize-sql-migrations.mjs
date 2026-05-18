import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

async function allSql(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await allSql(path));
    else if (entry.name.endsWith('.sql')) out.push(path);
  }
  return out;
}

let fixed = 0;
for (const file of await allSql(join(ROOT, 'infra'))) {
  const original = await fs.readFile(file, 'utf8');
  const next = original
    .replace(/public\.(\d)/g, 'public.t_$1')
    .replace(/\s(\d[\w]*_tenant_status_idx)/g, ' t_$1')
    .replace(/"(\d[\w]*_tenant_(?:read|write))"/g, '"t_$1"');
  if (next !== original) {
    await fs.writeFile(file, next, 'utf8');
    fixed += 1;
  }
}

console.log(`Normalized ${fixed} SQL migrations.`);
