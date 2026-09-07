import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERBS, ROLES, NULL_BUS_VERSION, assertNoForbiddenKeys, proofLine } from '../src/doctrine/index.js';
import { createWorld, World, Track } from '../src/fusion/index.js';
import { CAD } from '../src/cad/model.js';
import { evaluateAgent } from '../src/agent/nullAgent.js';
import { hazardShelterRecommendation } from '../src/twin/index.js';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const API_DEV = process.env.API_DEV === '1';
const PORT = Number(process.env.PORT || (API_DEV ? 8787 : 8080));

const world: World = createWorld(20260101);
setInterval(() => world.step(2), 2000).unref();

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
};

function send(res: any, status: number, data: any, headers: Record<string, string> = {}): void {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(body);
}

async function serveStatic(req: any, res: any): Promise<boolean> {
  if (API_DEV) return false;
  let urlPath = new URL(req.url || '/', `http://localhost`).pathname;
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = resolve(DIST, '.' + urlPath);
  if (!filePath.startsWith(DIST)) return false;
  if (!existsSync(filePath)) return false;
  try {
    const st = await stat(filePath);
    if (st.isDirectory()) return false;
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff' });
    const stream = (await import('node:fs')).createReadStream(filePath);
    stream.pipe(res);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost`);
  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    try {
      if (pathname === '/api/health' && req.method === 'GET') {
        return send(res, 200, { ok: true, name: 'palladium-null', version: '0.1.0-lab', nullBus: NULL_BUS_VERSION, utc: new Date().toISOString() });
      }
      if (pathname === '/api/doctrine' && req.method === 'GET') {
        return send(res, 200, {
          verbs: VERBS,
          roles: ROLES,
          nullBus: { version: NULL_BUS_VERSION, methodsAcceptingGeometry: 0, acceptsGeometry: false },
          proof: 'NULL_BUS_INTACT',
          statement: 'This service cannot compute intercept. It has no weapons bus, no fire-control types, and no geometry-accepting methods.'
        });
      }
      if (pathname === '/api/cad' && req.method === 'GET') {
        return send(res, 200, CAD);
      }
      if (pathname === '/api/picture' && req.method === 'GET') {
        return send(res, 200, { t: world.t, tracks: world.tracks, hazards: world.hazards, controls: world.controls });
      }
      if (pathname === '/api/shelters' && req.method === 'GET') {
        const from = [13, -5];
        const rec = hazardShelterRecommendation(from);
        return send(res, 200, { shelters: (await import('../src/twin/index.js')).CITY.shelters, recommendation: rec });
      }
      if (pathname === '/api/agent/evaluate' && req.method === 'POST') {
        let body = '';
        for await (const chunk of req) body += chunk;
        const input = JSON.parse(body || '{}');
        assertNoForbiddenKeys(input);
        const out = evaluateAgent({
          tracks: input.tracks || world.tracks,
          hazards: input.hazards || world.hazards.map(h => ({ type: h.type, at: h.at, severity: h.severity, shelterRelevant: h.shelterRelevant })),
          role: input.role || 'observer',
          displayBudget: input.displayBudget || 12,
        });
        return send(res, 200, out);
      }
      if (pathname === '/api/proof' && req.method === 'GET') {
        return send(res, 200, {
          interceptModule: false,
          weaponsBus: null,
          typeofIntercept: typeof (globalThis as any).intercept,
          cadWeaponsInterface: CAD.interfaces.weapons,
          forbiddenModuleNamesPresent: [],
          doctrineProof: proofLine()
        });
      }
      return send(res, 404, { error: 'NOT_FOUND', path: pathname });
    } catch (e: any) {
      if (e.message.startsWith('DOCTRINE_VIOLATION')) {
        return send(res, 422, { error: 'DOCTRINE_VIOLATION', detail: e.message });
      }
      return send(res, 500, { error: 'INTERNAL', detail: String(e) });
    }
  }

  if (await serveStatic(req, res)) return;

  if (!API_DEV) {
    try {
      const indexHtml = await readFile(resolve(DIST, 'index.html'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(indexHtml);
      return;
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Build not found. Run `npm run build`.');
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'NOT_FOUND', path: pathname }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[palladium-null] API ${API_DEV ? 'dev' : 'prod'} listening on http://0.0.0.0:${PORT}`);
});