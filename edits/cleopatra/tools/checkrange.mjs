// node tools/checkrange.mjs a b step -> per-frame violations
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const [a, b, step] = process.argv.slice(2).map(Number); const root = path.resolve('web');
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
await pg.goto(`http://localhost:${srv.address().port}/index.html`); await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
for (let f = a; f <= b; f += step) { const bad = await pg.evaluate((f) => window.safeCheck(f), f); if (bad.length) console.log(f, JSON.stringify(bad)); }
await br.close(); srv.close();
