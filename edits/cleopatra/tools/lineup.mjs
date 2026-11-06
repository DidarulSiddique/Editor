import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve('web'), out = process.argv[2] || 'lineup.png', hash = process.argv[3] || '';
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 2400, height: 2200 } });
pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => console.log('PAGE', m.text()));
await pg.goto(`http://localhost:${srv.address().port}/lineup.html${hash}`); await pg.waitForFunction(() => window.ready, null, { timeout: 60000 });
await pg.locator('#c').screenshot({ path: out }); await b.close(); srv.close(); console.log('ok', out);
