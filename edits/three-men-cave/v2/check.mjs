// usage: node check.mjs [step]  -> safe-frame violations per shot (characters cut by phone/iPad crops)
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const step = +(process.argv[2] || 3);
const root = path.resolve('web');
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/index.html`);
await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 180000 });
const total = await pg.evaluate(() => window.TOTAL);
const per = {};
for (let f = 0; f < total; f += step) {
  const bad = await pg.evaluate((f) => window.safeCheck(f), f);
  for (const v of bad) { const k = v.shot; per[k] = per[k] || { n: 0, ex: [] }; per[k].n++; if (per[k].ex.length < 2) per[k].ex.push(`f${f} ${v.key} ${v.box.join(',')}`); }
}
const ks = Object.keys(per);
console.log(ks.length ? ks.map(k => `${k}: ${per[k].n} bad  e.g. ${per[k].ex.join(' | ')}`).join('\n') : 'ALL CLEAR');
await b.close(); srv.close();
