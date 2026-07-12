import { constants, promises as fs } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'dist/vercel-static');

const staticTargets = [
  { source: 'apps/web-game', destination: '.' },
  { source: 'apps/web-qa', destination: 'qa' }
];

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

for (const target of staticTargets) {
  await copyDir(join(root, target.source), join(out, target.destination));
}

await fs.writeFile(
  join(out, 'deployment-manifest.json'),
  JSON.stringify({
    app: 'tamagochi',
    target: 'vercel-static',
    entrypoints: ['/', '/qa'],
    builtAt: new Date().toISOString()
  }, null, 2),
  'utf8'
);

console.log(`Vercel static bundle built at ${relative(root, out)}`);

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
    await fs.mkdir(dirname(destinationPath), { recursive: true });
    await fs.copyFile(sourcePath, destinationPath);
  }
}
