import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, normalize } from 'node:path';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8'
};

const __dirname = resolve();
const appDir = join(__dirname, 'app');

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const urlPath = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;
    let filePath = join(appDir, urlPath === '/' ? 'index.html' : urlPath);

    const normalizedAppDir = resolve(appDir);
    const normalizedFilePath = resolve(filePath);

    if (!normalizedFilePath.startsWith(normalizedAppDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }

    let stats;
    try {
      stats = await stat(normalizedFilePath);
      if (stats.isDirectory()) {
        filePath = join(normalizedFilePath, 'index.html');
        stats = await stat(filePath);
      }
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const data = await readFile(filePath);

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Vice Cover Maker app is available at http://localhost:${PORT}`);
});
