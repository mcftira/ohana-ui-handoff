import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, realpath, stat } from 'node:fs/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const website = path.join(root, 'website');
const host = '127.0.0.1'; // Never listen on the network or inherit HOST.
export const CSP = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "worker-src 'none'",
].join('; ');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
};
const rootFiles = new Set([
  'index.html', 'venue.css', 'venue.js', 'tokens.css', 'booking-mode.js', 'og-cover.jpg',
  'foglalas/index.html', 'foglalas/booking.css', 'foglalas/booking.js',
]);
const previewFiles = new Set([
  'mock-api.js', 'mock-checkout.html', 'demo.css', 'fonts.css',
]);

/** Narrow static routing. No repo root, directory listings, proxy or backend. */
function route(rawPath) {
  let pathname;
  try { pathname = decodeURIComponent(rawPath); } catch { return null; }
  if (pathname.includes('\\') || pathname.includes('\0') ||
      pathname.split('/').some(part => part === '..' || part.startsWith('.'))) return null;
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/foglalas/' || pathname === '/foglalas') pathname = '/foglalas/index.html';
  let base = website;
  let relative = pathname.slice(1);
  if (pathname.startsWith('/preview/')) {
    relative = pathname.slice('/preview/'.length);
    if (!previewFiles.has(relative)) return null;
    base = path.join(root, 'preview');
  } else if (/^\/(?:themes|previews)\//.test(pathname)) {
    base = root;
    if (!['.html', '.css', '.js', '.woff2', '.png', '.svg', '.webp', '.jpg'].includes(path.extname(relative))) return null;
  } else if (!rootFiles.has(relative) &&
      !/^assets\/(?:photos\/[a-z0-9-]+\.webp|fonts\/[A-Za-z-]+\.woff2|[a-z0-9-]+\.png)$/.test(relative)) {
    return null;
  }
  return { base, file: path.join(base, relative), inject: base === website && relative.endsWith('.html') };
}

export function injectPreview(html) {
  // Keep reviewed UI source byte-for-byte intact. Changes only exist in response.
  const local = html.replace(/<link\b[^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>/gi, '');
  return local.replace(/<head>/i, `<head>
<meta name="robots" content="noindex,nofollow">
<link rel="stylesheet" href="/preview/fonts.css">
<link rel="stylesheet" href="/preview/demo.css">
<script src="/preview/mock-api.js"></script>`);
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const headers = {
      'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store',
      'Cross-Origin-Resource-Policy': 'same-origin',
    };
    function reply(status, message) {
      res.writeHead(status, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(message);
    }
    // Reject requests from non-loopback origins/hostnames (DNS rebinding guard).
    if (!/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(req.headers.host || '')) {
      return reply(403, 'Local preview only.');
    }
    const rawPath = (req.url || '/').split('?')[0];
    if (rawPath.startsWith('/api/')) return reply(410, 'No backend exists in this UI-only repository.');
    if (!['GET', 'HEAD'].includes(req.method)) return reply(405, 'Read-only UI preview.');
    const target = route(rawPath);
    if (!target) return reply(404, 'Not part of the UI preview.');
    try {
      const [canonicalBase, canonicalFile] = await Promise.all([realpath(target.base), realpath(target.file)]);
      if (!canonicalFile.startsWith(canonicalBase + path.sep)) return reply(404, 'Not part of the UI preview.');
      // Never follow symlinks, even when the target remains inside the repository.
      if (canonicalFile !== target.file) return reply(404, 'Symlinks are not served.');
      if (!(await stat(canonicalFile)).isFile()) return reply(404, 'Not a file.');
      let data = await readFile(canonicalFile);
      if (target.inject) data = Buffer.from(injectPreview(data.toString('utf8')));
      res.writeHead(200, { ...headers, 'Content-Type': MIME[path.extname(canonicalFile)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch {
      reply(404, 'Not part of the UI preview.');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PORT must be between 1024 and 65535.');
  createServer().listen(port, host, () => {
    console.log(`Ohana UI-only preview: http://${host}:${port}`);
    console.log('Synthetic data only. No booking, payments, email, login or production APIs.');
  });
}
