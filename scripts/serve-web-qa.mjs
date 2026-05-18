import { createServer } from 'node:http';
import { createReadStream, promises as fs } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = join(new URL('..', import.meta.url).pathname, 'apps/web-qa');
const PORT = Number(process.env.PORT ?? 4173);
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8']
]);

const server = createServer(async (req, res) => {
  const rawPath = req.url?.split('?')[0] ?? '/';
  const safePath = normalize(rawPath === '/' ? '/index.html' : rawPath).replace(/^(\.\.[/\\])+/, '');
  const file = join(ROOT, safePath);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    await fs.access(file);
    res.writeHead(200, { 'content-type': types.get(extname(file)) ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Tamagochi QA console: http://localhost:${PORT}`);
});
