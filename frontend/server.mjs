import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8080';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // 1. Reverse proxy /api and /uploads to Go backend
  if (urlPath.startsWith('/api') || urlPath.startsWith('/uploads')) {
    try {
      const backendBase = new URL(BACKEND_URL);
      const targetUrl = new URL(req.url, backendBase);

      const headers = { ...req.headers, host: targetUrl.host };

      const proxyReq = http.request(
        targetUrl,
        {
          method: req.method,
          headers,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        }
      );

      proxyReq.on('error', (err) => {
        console.error(`[Proxy Error] ${req.method} ${req.url} -> ${targetUrl.href}:`, err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Backend unreachable', details: err.message }));
      });

      req.pipe(proxyReq, { end: true });
      return;
    } catch (err) {
      console.error('[Proxy Init Error]:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy initialization failed' }));
      return;
    }
  }

  // 2. Serve static SPA files from dist/
  let filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath);

  // If path doesn't exist or is a directory, fallback to index.html (SPA routing)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Internal Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });
    res.end(content);
  });
});

const PORT = 5173;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Family Tree Frontend running at http://0.0.0.0:${PORT}`);
  console.log(`🔄 Proxying /api & /uploads -> ${BACKEND_URL}`);
});
