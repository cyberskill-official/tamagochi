import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const scanRoots = ['src', 'tests', 'apps/web-game'];
const skipFiles = new Set(['scripts/real-implementation-check.mjs']);
const forbidden = [
  { label: 'fake social publish helper', pattern: new RegExp(['social', 'Publish', 'St', 'ub'].join('')) },
  { label: 'fake dependency terminal marker', pattern: new RegExp(['moc', 'ked', '-', 'dependency'].join('')) },
  { label: 'fake social publish disable marker', pattern: new RegExp(['live', '_publish', '_disabled', '_in', '_local', '_st', 'ub'].join('')) },
  { label: 'receipt accepted by apple prefix', pattern: new RegExp(['apple', ':', 'receipt'].join('')) },
  { label: 'receipt accepted by google prefix', pattern: new RegExp(['google', ':', 'receipt'].join('')) },
  { label: 'hard-coded Zalo pass token', pattern: new RegExp(['zalo', '-', 'valid', '-', 'token'].join('')) },
  { label: 'hard-coded standard player token', pattern: new RegExp(['standard', '-', 'player', '-', 'token'].join('')) }
];

const requiredEvidence = [
  {
    file: 'src/platform.ts',
    markers: ['class TamagochiPlatform', 'class JsonPlatformStore', 'await handle.sync()', 'await rename(tmpPath, this.filePath)']
  },
  {
    file: 'tests/unit/platform-persistence.test.ts',
    markers: ['TamagochiPlatform.open', 'readFile(stateFile', 'publishedSocialPosts']
  },
  {
    file: 'src/auth.ts',
    markers: ['createProviderToken', 'verifyPayload', 'auth.provider_mismatch']
  },
  {
    file: 'src/economy.ts',
    markers: ['createSignedReceipt', 'parseIapReceipt', 'econ.receipt_platform_mismatch']
  },
  {
    file: 'src/media.ts',
    markers: ['SocialPublishTransport', 'publishSocial', 'social.publish.queued']
  }
];

const failures = [];

for (const scanRoot of scanRoots) {
  for await (const file of walk(join(root, scanRoot))) {
    const rel = relative(root, file);
    if (skipFiles.has(rel) || !/\.(ts|js|mjs|html|css)$/.test(file)) continue;
    const body = await readFile(file, 'utf8');
    for (const item of forbidden) {
      if (item.pattern.test(body)) failures.push(`${rel}: contains ${item.label}`);
      item.pattern.lastIndex = 0;
    }
  }
}

for (const evidence of requiredEvidence) {
  const file = join(root, evidence.file);
  const body = await readFile(file, 'utf8');
  for (const marker of evidence.markers) {
    if (!body.includes(marker)) failures.push(`${evidence.file}: missing required implementation marker "${marker}"`);
  }
}

if (failures.length > 0) {
  console.error('Real implementation check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Real implementation check passed across ${scanRoots.join(', ')}.`);

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(file);
      continue;
    }
    if ((await stat(file)).isFile()) yield file;
  }
}
