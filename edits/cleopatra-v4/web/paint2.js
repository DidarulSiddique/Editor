// Cleopatra sets: painted canvas textures (our own designs, deterministic).
import { rng } from './paint.js';
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const INK = '#2a1d24', BLUE = '#2f6fb0', RED = '#c0433a', GOLD = '#e8b531', GREEN = '#3a9a6a', SAND = '#f0e4c8';
const dot = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
const line = (g, pts, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };

/** one hieroglyph (our own simplified shapes) centred at x,y, size s */
export function glyph(g, k, x, y, s, col = INK) {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 9; g.lineCap = g.lineJoin = 'round';
  const P = (pts, fill = true) => { g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); fill ? g.fill() : g.stroke(); };
  switch (k % 10) {
    case 0: g.beginPath(); g.ellipse(0, -28, 18, 24, 0, 0, 7); g.stroke(); P([[0, -4], [0, 46]], false); P([[-30, 8], [30, 8]], false); break; // ankh
    case 1: g.beginPath(); g.ellipse(0, 0, 38, 16, 0, 0, 7); g.stroke(); dot(g, 0, 0, 10, col); P([[-30, 14], [-20, 40]], false); P([[8, 16], [22, 36], [34, 30]], false); break; // eye
    case 2: g.beginPath(); g.ellipse(-4, 4, 26, 20, -0.3, 0, 7); g.fill(); dot(g, 22, -18, 11, col); P([[30, -18], [44, -14]], false); P([[-26, 10], [-46, 26]], false); P([[-6, 22], [-8, 46]], false); P([[6, 22], [8, 46]], false); break; // bird
    case 3: for (let i = 0; i < 3; i++) P([[-40, -24 + i * 22], [-27, -34 + i * 22], [-13, -24 + i * 22], [0, -34 + i * 22], [13, -24 + i * 22], [27, -34 + i * 22], [40, -24 + i * 22]], false); break; // water
    case 4: dot(g, 0, -10, 26, RED); g.strokeStyle = col; g.beginPath(); g.arc(0, -10, 26, 0, 7); g.stroke(); P([[-40, 30], [40, 30]], false); break; // sun
    case 5: P([[0, 46], [0, -30]], false); g.beginPath(); g.ellipse(0, -34, 14, 18, 0, 0, 7); g.fill(); P([[0, 10], [-18, -4]], false); break; // reed
    case 6: dot(g, 0, -30, 12, col); P([[0, -16], [0, 18], [-22, 18], [-22, 44]], false); P([[0, -4], [24, -18]], false); P([[0, 18], [20, 44]], false); break; // seated figure
    case 7: g.beginPath(); g.ellipse(0, 0, 40, 20, 0, Math.PI, 0); g.fill(); P([[-40, 0], [40, 0]], false); break; // bread / half disc
    case 8: P([[0, 46], [0, 6]], false); g.beginPath(); g.ellipse(0, -14, 12, 26, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(-22, -6, 9, 22, -0.6, 0, 7); g.fill(); g.beginPath(); g.ellipse(22, -6, 9, 22, 0.6, 0, 7); g.fill(); break; // lotus
    default: P([[-34, -30], [34, -30], [34, 30], [-34, 30], [-34, -30]], false); P([[-14, -10], [14, 10]], false); break; // house
  }
  g.restore();
}

/** temple wall: sandstone with painted registers of glyphs and a winged sun disk */
export function hieroWall(seed = 1, w = 1024, h = 1024) {
  const [c, g] = cv(w, h), r = rng(seed);
  g.fillStyle = SAND; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(150,110,60,${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 30, 3 + r() * 14, r() * 3, 0, 7); g.fill(); }
  // registers
  const bands = [[0, 46, BLUE], [46, 14, GOLD], [h - 60, 14, GOLD], [h - 46, 46, RED]];
  for (const [y, hh, col] of bands) { g.fillStyle = col; g.fillRect(0, y, w, hh); }
  for (let x = 0; x < w; x += 40) { g.fillStyle = x % 80 ? GREEN : RED; g.fillRect(x + 6, 6, 28, 34); }
  // winged sun disk
  const cx = w / 2, cy = 120;
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { g.fillStyle = [BLUE, GREEN, GOLD, RED][k]; g.beginPath(); g.ellipse(cx + s * (70 + k * 26), cy + k * 4, 70 - k * 10, 18 - k * 2, s * 0.12, 0, 7); g.fill(); }
  dot(g, cx, cy, 34, RED); g.lineWidth = 6; g.strokeStyle = GOLD; g.beginPath(); g.arc(cx, cy, 34, 0, 7); g.stroke();
  // glyph columns between ruled lines
  const top = 190, bot = h - 80, cols = 9, cw = w / cols;
  for (let i = 0; i <= cols; i++) line(g, [[i * cw, top], [i * cw, bot]], 4, 'rgba(42,29,36,.55)');
  for (let i = 0; i < cols; i++) for (let y = top + 50, k = 0; y < bot - 30; y += 92, k++) glyph(g, (seed * 7 + i * 3 + k * 5 + ((r() * 3) | 0)) % 10, i * cw + cw / 2, y, 64, k % 4 === 3 ? RED : (i % 3 === 1 && k % 2) ? BLUE : INK);
  // cartouche
  g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.roundRect(cx - 52, top + 150, 104, 380, 50); g.stroke();
  g.fillStyle = 'rgba(232,181,49,.35)'; g.fill();
  for (let k = 0; k < 4; k++) glyph(g, [6, 2, 4, 0][k], cx, top + 210 + k * 88, 60, k === 2 ? RED : INK);
  return c;
}
/** painted papyrus column shaft: vertical glyph strips between coloured bands */
export function columnPaint(seed = 3) {
  const [c, g] = cv(512, 1024), r = rng(seed);
  g.fillStyle = '#e9d4a4'; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(140,100,50,${0.04 + r() * 0.07})`; g.beginPath(); g.ellipse(r() * 512, r() * 1024, 4 + r() * 20, 2 + r() * 8, 0, 0, 7); g.fill(); }
  const band = (y, cols) => cols.forEach((col, k) => { g.fillStyle = col; g.fillRect(0, y + k * 16, 512, 16); });
  band(0, [GOLD, BLUE, RED, GOLD, GREEN]); band(944, [GREEN, GOLD, RED, BLUE, GOLD]);
  for (let i = 0; i < 4; i++) { const x = 64 + i * 128; for (let k = 0; k < 8; k++) glyph(g, (i * 3 + k * 7 + seed) % 10, x, 150 + k * 100, 58, k % 3 === 2 ? RED : INK); }
  for (let i = 0; i <= 4; i++) line(g, [[i * 128, 90], [i * 128, 930]], 3, 'rgba(42,29,36,.4)');
  return c;
}
/** polished floor tiles with gold inlay */
export function floorTiles() {
  const [c, g] = cv(512, 512), r = rng(11);
  for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) { const L = (i + k) % 2 ? 76 : 70; g.fillStyle = `hsl(38,38%,${L + r() * 3}%)`; g.fillRect(i * 128, k * 128, 128, 128); }
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(120,90,50,${0.05 + r() * 0.06})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 4 + r() * 16, 2 + r() * 6, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = '#c99a34'; g.lineWidth = 5; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
  for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) if ((i + k) % 2) { g.save(); g.translate(i * 128 + 64, k * 128 + 64); g.rotate(Math.PI / 4); g.strokeStyle = 'rgba(201,154,52,.8)'; g.lineWidth = 4; g.strokeRect(-26, -26, 52, 52); g.restore(); }
  return c;
}
/** royal runner carpet */
export function runner() {
  const [c, g] = cv(256, 1024);
  g.fillStyle = '#a8242c'; g.fillRect(0, 0, 256, 1024);
  g.fillStyle = GOLD; g.fillRect(0, 0, 22, 1024); g.fillRect(234, 0, 22, 1024);
  g.fillStyle = BLUE; g.fillRect(26, 0, 10, 1024); g.fillRect(220, 0, 10, 1024);
  for (let y = 40; y < 1024; y += 128) { g.save(); g.translate(128, y + 24); g.rotate(Math.PI / 4); g.fillStyle = GOLD; g.fillRect(-26, -26, 52, 52); g.fillStyle = '#a8242c'; g.fillRect(-14, -14, 28, 28); g.restore(); }
  return c;
}
/** night-blue ceiling with gold five-pointed stars (Egyptian tomb ceilings) */
export function ceilingStars() {
  const [c, g] = cv(512, 512);
  g.fillStyle = '#1d2c6a'; g.fillRect(0, 0, 512, 512);
  const star = (x, y, R) => { g.fillStyle = '#f2c84a'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.42 : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); };
  for (let i = 0; i < 5; i++) for (let k = 0; k < 5; k++) star(51 + i * 102 + (k % 2) * 51, 51 + k * 102, 22);
  return c;
}
/** the Vergina sun (16 rays) on a field */
export function vergina(bg = '#6b2f7a', fringe = true) {
  const [c, g] = cv(512, 768);
  g.fillStyle = bg; g.fillRect(0, 0, 512, 768);
  g.strokeStyle = GOLD; g.lineWidth = 16; g.strokeRect(18, 18, 476, 732);
  const cx = 256, cy = 330;
  g.fillStyle = GOLD; g.beginPath();
  for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16 - Math.PI / 2, rr = i % 2 ? 62 : 190; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  g.fill(); dot(g, cx, cy, 54, '#f6d978'); g.strokeStyle = '#b5821c'; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, 54, 0, 7); g.stroke();
  if (fringe) for (let i = 0; i < 9; i++) { g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(i * 64, 768); g.lineTo(i * 64 + 32, 700); g.lineTo(i * 64 + 64, 768); g.fill(); g.globalCompositeOperation = 'source-over'; }
  return c;
}
/** Egyptian banner (blue with gold sun disk and cobras) */
export function egyptBanner() {
  const [c, g] = cv(512, 768);
  g.fillStyle = '#1f5c9e'; g.fillRect(0, 0, 512, 768);
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? GOLD : RED; g.fillRect(0, 600 + i * 28, 512, 28); }
  g.strokeStyle = GOLD; g.lineWidth = 16; g.strokeRect(18, 18, 476, 732);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { g.fillStyle = [GOLD, GREEN, RED][k]; g.beginPath(); g.ellipse(256 + s * (90 + k * 24), 300 + k * 4, 80 - k * 12, 20, s * 0.15, 0, 7); g.fill(); }
  dot(g, 256, 300, 62, RED); g.lineWidth = 10; g.strokeStyle = GOLD; g.beginPath(); g.arc(256, 300, 62, 0, 7); g.stroke();
  glyph(g, 0, 256, 470, 120, GOLD);
  for (let i = 0; i < 9; i++) { g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(i * 64, 768); g.lineTo(i * 64 + 32, 712); g.lineTo(i * 64 + 64, 768); g.fill(); g.globalCompositeOperation = 'source-over'; }
  return c;
}
/** stone blocks (pylon, lighthouse) */
export function blocks(seed = 5, hue = 38, light = 78) {
  const [c, g] = cv(512, 512), r = rng(seed);
  for (let y = 0, k = 0; y < 512; y += 64, k++) for (let x = -(k % 2) * 64; x < 512; x += 128) { g.fillStyle = `hsl(${hue},${30 + r() * 8}%,${light - r() * 6}%)`; g.fillRect(x, y, 128, 64); g.strokeStyle = `hsl(${hue},25%,${light - 22}%)`; g.lineWidth = 4; g.strokeRect(x + 2, y + 2, 124, 60); }
  return c;
}
/** the cake's top: Alexander's empire as a round painted map (our own stylised geography). north up. */
export function empireMap() {
  const [c, g] = cv(1024, 1024);
  g.fillStyle = '#7fb6d6'; g.fillRect(0, 0, 1024, 1024);                       // sea
  for (let i = 0; i < 40; i++) line(g, [[(i * 97) % 1024, (i * 211) % 1024], [(i * 97) % 1024 + 26, (i * 211) % 1024 - 6], [(i * 97) % 1024 + 52, (i * 211) % 1024]], 4, 'rgba(255,255,255,.45)');
  const land = (pts, col) => { g.fillStyle = col; g.strokeStyle = '#6a4a2a'; g.lineWidth = 6; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.stroke(); };
  // Europe / Macedonia (top-left), Greece peninsula
  land([[0, 0], [430, 0], [420, 120], [360, 200], [330, 330], [300, 380], [270, 330], [250, 390], [210, 330], [160, 300], [120, 330], [0, 320]], '#9cc46a');
  // Anatolia (top-middle) + Levant + Persia + India (right)
  land([[400, 300], [470, 240], [560, 250], [640, 220], [1024, 160], [1024, 1024], [780, 1024], [720, 820], [640, 700], [600, 600], [570, 470], [520, 440], [470, 390], [420, 380]], '#e7c787');
  // Egypt (bottom-left) + Libya
  land([[0, 600], [200, 560], [330, 590], [470, 600], [560, 610], [610, 700], [660, 1024], [0, 1024]], '#f0d69a');
  // Nile
  line(g, [[430, 610], [440, 680], [425, 760], [450, 850], [440, 940], [455, 1024]], 14, '#3f8fc8');
  for (const s of [-1, 1]) line(g, [[430, 612], [430 + s * 40, 590]], 8, '#3f8fc8');
  // borders of the four pieces the generals took (dashed)
  g.setLineDash([16, 14]); line(g, [[512, 512], [180, 120]], 6, '#7a2a2a'); line(g, [[512, 512], [580, 0]], 6, '#7a2a2a'); line(g, [[512, 512], [1024, 470]], 6, '#7a2a2a'); line(g, [[512, 512], [330, 1024]], 6, '#7a2a2a'); g.setLineDash([]);
  // little pictograms: pyramids (Egypt), mountains (Macedonia), palms
  const pyr = (x, y, s) => { g.fillStyle = '#e2b062'; g.strokeStyle = '#6a4a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x, y - s * 1.1); g.lineTo(x + s, y); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#c48a3a'; g.beginPath(); g.moveTo(x, y - s * 1.1); g.lineTo(x + s, y); g.lineTo(x + s * 0.2, y); g.closePath(); g.fill(); };
  pyr(360, 760, 40); pyr(300, 790, 30); pyr(400, 800, 26);
  const mtn = (x, y, s) => { g.fillStyle = '#6f9a4a'; g.strokeStyle = '#3f5a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x, y - s); g.lineTo(x + s, y); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - s * 0.3, y - s * 0.7); g.lineTo(x, y - s); g.lineTo(x + s * 0.3, y - s * 0.7); g.closePath(); g.fill(); };
  mtn(220, 170, 44); mtn(300, 120, 34); mtn(880, 300, 50); mtn(950, 360, 40);
  // labels
  g.fillStyle = '#3a2416'; g.textAlign = 'center'; g.font = 'bold 44px DejaVu Serif, serif';
  g.font = 'bold 40px DejaVu Serif, serif'; g.fillText('MACEDONIA', 290, 255); g.font = 'bold 44px DejaVu Serif, serif'; g.fillText('EGYPT', 330, 900); g.fillText('PERSIA', 790, 600); g.font = 'bold 34px DejaVu Serif, serif'; g.fillText('GREECE', 270, 360);
  // fondant rim
  g.strokeStyle = '#f6efe0'; g.lineWidth = 40; g.beginPath(); g.arc(512, 512, 500, 0, 7); g.stroke();
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; dot(g, 512 + Math.cos(a) * 492, 512 + Math.sin(a) * 492, 16, i % 2 ? '#f9e7b8' : '#ffffff'); }
  return c;
}
/** sponge + cream layers for the cake's sides */
export function sponge() {
  const [c, g] = cv(512, 256), r = rng(13);
  const L = [['#f6efe0', 30], ['#d99a52', 60], ['#c23b4a', 18], ['#d99a52', 60], ['#c23b4a', 18], ['#d99a52', 50], ['#f6efe0', 20]];
  let y = 0; for (const [col, h] of L) { g.fillStyle = col; g.fillRect(0, y, 512, h); y += h; }
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(150,90,40,${0.2 + r() * 0.3})`; g.beginPath(); g.arc(r() * 512, 40 + r() * 200, 1 + r() * 3, 0, 7); g.fill(); }
  return c;
}
/** sea with painted wave crests */
export function sea() {
  const [c, g] = cv(512, 512), r = rng(17);
  g.fillStyle = '#2f8fc4'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) { const x = r() * 512, y = r() * 512, w = 20 + r() * 40; line(g, [[x, y], [x + w * 0.5, y - 6], [x + w, y]], 4, `rgba(255,255,255,${0.35 + r() * 0.4})`); }
  return c;
}
/** sail stripes */
export function sail(a = '#f2ead6', b = '#c0433a') {
  const [c, g] = cv(256, 256);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 32, 0, 32, 256); }
  dot(g, 128, 128, 40, GOLD); return c;
}
/** tent canvas stripes */
export function tentCloth() {
  const [c, g] = cv(512, 256);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#b8322f' : '#efe2c4'; g.fillRect(i * 64, 0, 64, 256); }
  g.fillStyle = GOLD; g.fillRect(0, 0, 512, 18); return c;
}
/** gold coin face: queen's portrait in relief + the Greek legend on her real coins */
export function coinFace() {
  const [c, g] = cv(1024, 1024);
  const gr = g.createRadialGradient(420, 380, 60, 512, 512, 520); gr.addColorStop(0, '#e8b84a'); gr.addColorStop(0.6, '#c8901f'); gr.addColorStop(1, '#8a5a12');
  g.fillStyle = gr; g.beginPath(); g.arc(512, 512, 512, 0, 7); g.fill();
  g.strokeStyle = '#a8741c'; g.lineWidth = 14; g.beginPath(); g.arc(512, 512, 470, 0, 7); g.stroke();
  for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2; dot(g, 512 + Math.cos(a) * 492, 512 + Math.sin(a) * 492, 7, '#c8901f'); }
  // portrait in profile, facing right: neck, face, nose, bun, diadem
  const P = [[400, 860], [420, 690], [380, 640], [360, 560], [370, 470], [420, 380], [520, 330], [610, 350], [660, 420], [670, 480], [700, 530], [668, 548], [672, 580], [650, 600], [660, 630], [630, 660], [600, 690], [620, 860]];
  g.fillStyle = 'rgba(120,70,10,.55)'; g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x + 8, y + 8) : g.moveTo(x + 8, y + 8))); g.fill();
  g.fillStyle = '#f0c858'; g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.fill();
  g.strokeStyle = '#5a3608'; g.lineWidth = 12; g.stroke();
  g.fillStyle = '#d49a2a'; g.beginPath(); g.ellipse(395, 470, 70, 62, 0, 0, 7); g.fill(); g.stroke(); g.lineWidth = 6;             // bun
  for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(470 + i * 24, 400 - (i % 2) * 8, 22, Math.PI, 0); g.stroke(); } // hair waves
  line(g, [[400, 420], [640, 400]], 18, '#fff1b0'); line(g, [[400, 420], [640, 400]], 4, '#a8741c');                // diadem
  line(g, [[600, 455], [632, 452]], 9, '#5a3608'); line(g, [[668, 548], [640, 560]], 6, '#5a3608');                                                                       // eye
  g.fillStyle = '#7a4a0a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 74px DejaVu Serif, serif';
  const arcText = (t, a0, a1, R) => { for (let i = 0; i < t.length; i++) { const a = a0 + (a1 - a0) * (i + 0.5) / t.length; g.save(); g.translate(512 + Math.cos(a) * R, 512 + Math.sin(a) * R); g.rotate(a + Math.PI / 2); g.fillText(t[i], 0, 0); g.restore(); } };
  arcText('ΒΑΣΙΛΙΣΣΗΣ', Math.PI * 1.08, Math.PI * 1.92, 400);
  const t2 = 'ΚΛΕΟΠΑΤΡΑΣ'; for (let i = 0; i < t2.length; i++) { const a = Math.PI * 0.86 - (Math.PI * 0.72) * (i + 0.5) / t2.length; g.save(); g.translate(512 + Math.cos(a) * 400, 512 + Math.sin(a) * 400); g.rotate(a - Math.PI / 2); g.fillText(t2[i], 0, 0); g.restore(); }
  return c;
}
/** grassy ground */
export function meadow(seed = 21) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#8ab554'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { const x = r() * 512, y = r() * 512; line(g, [[x, y], [x + r() * 6 - 3, y - 8 - r() * 8]], 2, `hsl(${80 + r() * 25},${40 + r() * 15}%,${36 + r() * 18}%)`); }
  return c;
}
/** fine sand with ripples */
export function sand(seed = 23) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#efd3a0'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { const y = r() * 512, x = r() * 512; line(g, [[x, y], [x + 30, y - 4], [x + 60, y]], 3, 'rgba(190,140,80,.35)'); }
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(160,110,60,${0.08 + r() * 0.12})`; g.fillRect(r() * 512, r() * 512, 2, 2); }
  return c;
}
