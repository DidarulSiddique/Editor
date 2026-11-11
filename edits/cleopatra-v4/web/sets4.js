// v4 sets: Nile farm (x 4000), night desert road + Alexander's funeral cart (x 5000), apartment hallway (x 6000),
// Isis temple + the gilded relief wall (x 7000), and props added to the v3 study (flash cards, candle, scroll stacks).
// Built with main.js's helpers (passed in as C) so materials, ink and shadows match the v3 sets.
export const FARM = [4000, 0], ROAD = [5000, 0], APT = [6000, 0], TEMPLE = [7000, 0];

const canvasTex = (C, w, h, draw, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return C.P.tex(c, rx, ry); };

export function buildSets4(C) {
  const { THREE, add, box, plane, ground, toon, T2, P, P2, palm, obelisk, pyramid, world, goldM, goldD, blueM, redM, woodD, stoneM, marbleM, darkM, bronzeM } = C;
  const R = P.rng(404);

  // ===== FARM: the Nile at sunrise — green fields, the river, palms, a mud-brick house, a felucca =====
  const [FX] = FARM;
  const fieldTex = canvasTex(C, 512, 512, (g, w, h) => { g.fillStyle = '#6fa63e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#5d9433' : '#7cb548'; g.fillRect(0, i * 32, w, 18); }
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${40 + (i * 7) % 40},${90 + (i * 13) % 60},30,.5)`; g.fillRect((i * 97) % w, (i * 61) % h, 3, 6); } }, 30, 30);
  ground(FX, 40, 400, 120, toon({ map: fieldTex }));
  const mudTex = canvasTex(C, 256, 256, (g, w, h) => { g.fillStyle = '#8a6a44'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { g.fillStyle = i % 2 ? 'rgba(60,40,24,.35)' : 'rgba(180,140,90,.3)'; g.fillRect((i * 37) % w, (i * 53) % h, 6, 3); } }, 40, 6);
  ground(FX, -6, 400, 6, toon({ map: mudTex })).position.y = 0.01;
  const nileTex = P.tex(P2.sea(), 30, 20); C.nileTex = nileTex;
  { const s = add(new THREE.PlaneGeometry(600, 60), toon({ map: nileTex, color: '#cfe8ff' }), FX, -0.2, -38, world, { cast: false }); s.rotation.x = -Math.PI / 2; }
  ground(FX, -170, 600, 200, T2(P2.sand(), 60, 30)).position.y = 0.0;
  for (let i = 0; i < 26; i++) palm(FX - 120 + i * 9 + R() * 4, -74 - R() * 12, 6 + R() * 3, 0.1 + R() * 0.12);
  for (let i = 0; i < 12; i++) palm(FX - 40 + i * 8 + R() * 3, 18 + R() * 6, 5 + R() * 2, 0.12);
  pyramid(FX + 60, -260, 60); pyramid(FX + 140, -300, 48); pyramid(FX - 30, -320, 40);
  // papyrus reeds along the near bank
  const reedM = toon({ color: '#4f8a3a' }), reedTop = toon({ color: '#7fb04a' });
  for (let i = 0; i < 70; i++) { const x = FX - 30 + R() * 60, z = -8.5 - R() * 2, h = 1.4 + R() * 1.2; add(new THREE.CylinderGeometry(0.03, 0.04, h, 4), reedM, x, h / 2, z, world, { cast: false }); const t = add(new THREE.ConeGeometry(0.28, 0.4, 6), reedTop, x, h + 0.1, z, world, { cast: false }); t.rotation.x = Math.PI; }
  // mud-brick house with a palm-rib roof, water jars, a donkey-free cart
  const house = new THREE.Group(); house.position.set(FX + 7, 0, 8); world.add(house);
  add(box(5, 3, 4), T2(P2.blocks(44, 30, 74), 2, 1), 0, 1.5, 0, house); add(box(5.4, 0.25, 4.4), toon({ color: '#9a7a4a' }), 0, 3.1, 0, house);
  add(box(1.0, 1.9, 0.1), darkM, -0.8, 0.95, 2.02, house, { cast: false }); add(box(0.8, 0.6, 0.1), darkM, 1.3, 1.8, 2.02, house, { cast: false });
  for (const [x, z] of [[-3.0, 2.2], [-3.6, 1.5], [3.2, 2.4]]) { add(new THREE.SphereGeometry(0.42, 12, 10), toon({ color: '#b5653a' }), x, 0.42, z, house); add(new THREE.CylinderGeometry(0.16, 0.2, 0.22, 10), toon({ color: '#b5653a' }), x, 0.88, z, house); }
  // shaduf (water lever) by the bank
  { const g = new THREE.Group(); g.position.set(FX - 6, 0, -6.6); world.add(g); for (const s of [-1, 1]) add(box(0.14, 2.6, 0.14), woodD, s * 0.4, 1.3, 0, g); add(box(1.0, 0.14, 0.14), woodD, 0, 2.6, 0, g);
    const arm = add(box(0.1, 0.1, 5.2), woodD, 0, 2.75, -0.6, g); arm.rotation.x = -0.35; add(new THREE.SphereGeometry(0.3, 10, 8), toon({ color: '#8a6a44' }), 0, 3.6, 1.6, g); }
  // felucca on the river (moved in worldState)
  const fel = new THREE.Group(); world.add(fel); C.felucca = fel;
  { const hs = new THREE.Shape(); hs.moveTo(-3, 0.5); hs.quadraticCurveTo(-2.6, -0.4, -1.4, -0.6); hs.lineTo(1.8, -0.6); hs.quadraticCurveTo(3, -0.4, 3.4, 0.8); hs.lineTo(2.6, 0.5); hs.lineTo(-3, 0.5);
    const hg = new THREE.ExtrudeGeometry(hs, { depth: 1.3, bevelEnabled: false }); hg.translate(0, 0, -0.65); add(hg, toon({ color: '#8a5a34' }), 0, 0.3, 0, fel);
    add(new THREE.CylinderGeometry(0.06, 0.08, 6.5, 6), woodD, 0.4, 3.4, 0, fel);
    const sail = new THREE.Shape(); sail.moveTo(0, 0); sail.lineTo(3.4, 0.2); sail.lineTo(0.2, 6.2); sail.lineTo(0, 0); const sg = new THREE.ShapeGeometry(sail); const sm = toon({ color: '#f4ecd8', side: THREE.DoubleSide });
    const sl = add(sg, sm, -1.2, 0.9, 0, fel); sl.rotation.y = 0.3; }

  // ===== ROAD: moonlit desert road; the golden funeral cart =====
  const [RX] = ROAD;
  ground(RX, -100, 900, 600, T2(P2.sand(), 70, 50));
  ground(RX, 0, 900, 5, toon({ map: mudTex, color: '#cbb08a' })).position.y = 0.01;
  for (let i = 0; i < 30; i++) { const d = add(new THREE.SphereGeometry(20 + R() * 30, 16, 8), toon({ color: i % 2 ? '#d9b47a' : '#cfa86e' }), RX - 400 + R() * 800, -10, (R() < 0.5 ? -1 : 1) * (40 + R() * 160), world, { cast: false }); d.scale.set(1.8, 0.45, 1); }
  for (let i = 0; i < 40; i++) { const r = add(new THREE.DodecahedronGeometry(0.3 + R() * 0.6, 0), toon({ color: '#9a7a58' }), RX - 120 + R() * 240, 0.1, (R() < 0.5 ? -1 : 1) * (4 + R() * 12), world); r.scale.y = 0.6; }
  pyramid(RX + 260, -120, 70); pyramid(RX + 330, -170, 52); obelisk(RX + 140, -14, 9); obelisk(RX + 150, -14, 9);
  // milestone sign pointing to Egypt (a wooden post with an arrow board)
  { const g = new THREE.Group(); g.position.set(RX + 24, 0, 3.0); world.add(g); add(box(0.16, 2.6, 0.16), woodD, 0, 1.3, 0, g);
    const sign = canvasTex(C, 512, 160, (q, w, h) => { q.fillStyle = '#b07a44'; q.beginPath(); q.moveTo(0, 0); q.lineTo(w - 70, 0); q.lineTo(w, h / 2); q.lineTo(w - 70, h); q.lineTo(0, h); q.fill(); q.lineWidth = 10; q.strokeStyle = '#2a1a10'; q.stroke(); q.fillStyle = '#2a1a10'; q.font = 'bold 92px DejaVu Serif, serif'; q.textBaseline = 'middle'; q.fillText('EGYPT', 40, h / 2 + 4); });
    plane(1.8, 0.56, toon({ map: sign, side: THREE.DoubleSide }), 0.75, 2.2, 0.1, 0, g, true); }
  // the cart (a "temple on wheels": gold columns, a vaulted gold roof, bells, purple drapes), positioned per frame
  const cart = new THREE.Group(); world.add(cart); C.cart = cart; const wheels = [];
  add(box(3.6, 0.35, 1.8), woodD, 0, 0.95, 0, cart); add(box(3.7, 0.12, 1.9), goldM, 0, 1.16, 0, cart);
  for (const sx of [-1.25, 1.25]) for (const sz of [-1, 1]) { const w = add(new THREE.CylinderGeometry(0.62, 0.62, 0.14, 20), toon({ color: '#6a4426' }), sx, 0.62, sz * 1.0, cart); w.rotation.x = Math.PI / 2; wheels.push(w);
    add(new THREE.TorusGeometry(0.6, 0.05, 6, 24), goldM, sx, 0.62, sz * 1.08, cart); }
  C.wheels = wheels;
  for (const [x, z] of [[-1.6, -0.75], [1.6, -0.75], [-1.6, 0.75], [1.6, 0.75]]) add(new THREE.CylinderGeometry(0.09, 0.11, 2.2, 10), goldM, x, 2.3, z, cart);
  add(box(3.7, 0.25, 1.9), goldD, 0, 3.45, 0, cart);
  { const v = add(new THREE.CylinderGeometry(1.05, 1.05, 3.7, 20, 1, false, 0, Math.PI), goldM, 0, 3.55, 0, cart); v.rotation.z = Math.PI / 2; v.scale.set(1, 1, 0.9); }
  add(new THREE.SphereGeometry(0.22, 12, 8), goldM, 0, 4.7, 0, cart);
  for (let i = 0; i < 8; i++) add(new THREE.SphereGeometry(0.09, 8, 6), goldD, -1.75 + i * 0.5, 3.25, 0.98, cart);
  const drape = toon({ color: '#6b2f7a', side: THREE.DoubleSide }); for (const sx of [-1, 1]) plane(0.5, 2.0, drape, sx * 1.45, 2.3, 0.78, 0, cart);
  // gold sarcophagus inside, with a painted face on the lid end
  const faceTex = canvasTex(C, 256, 256, (q) => { q.fillStyle = '#e8b531'; q.fillRect(0, 0, 256, 256); q.fillStyle = '#2f6fb0'; for (let i = 0; i < 6; i++) q.fillRect(0, i * 44, 256, 14); q.fillStyle = '#f2c94c'; q.beginPath(); q.ellipse(128, 120, 70, 84, 0, 0, 7); q.fill();
    q.lineWidth = 8; q.strokeStyle = '#2a1a10'; q.stroke(); q.fillStyle = '#2a1a10'; q.fillRect(90, 108, 22, 8); q.fillRect(144, 108, 22, 8); q.fillRect(116, 160, 26, 6); });
  const sarc = new THREE.Group(); sarc.position.set(0, 1.6, 0); cart.add(sarc); C.sarc = sarc;
  add(box(2.3, 0.62, 0.8), goldM, 0, 0, 0, sarc); add(box(2.36, 0.12, 0.86), goldD, 0, 0.36, 0, sarc); add(box(2.3, 0.08, 0.82), blueM, 0, -0.12, 0, sarc, { cast: false });
  plane(0.62, 0.62, toon({ map: faceTex }), 1.16, 0.02, 0, Math.PI / 2, sarc);
  const lantern = (x, z) => { add(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4), darkM, x, 3.1, z, cart); add(box(0.24, 0.3, 0.24), toon({ color: '#ffcf6a', emissive: '#ffb040', emissiveIntensity: 0.9 }), x, 2.7, z, cart); };
  lantern(-1.6, 1.0); lantern(1.6, 1.0);

  // ===== APT: modern apartment hallway (the landlord analogy) =====
  const [PX] = APT;
  const wallTex = canvasTex(C, 512, 512, (g, w, h) => { g.fillStyle = '#e9d9b8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#e0cca6' : '#ecdcbc'; g.fillRect(i * 32, 0, 18, h); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(200,120,90,.35)'; g.beginPath(); g.arc((i * 89) % w, (i * 131) % h, 7, 0, 7); g.fill(); } }, 6, 1);
  const carpetTex = canvasTex(C, 256, 256, (g, w, h) => { g.fillStyle = '#7a2f3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#a8404c'; g.fillRect(24, 0, 16, h); g.fillRect(w - 40, 0, 16, h); for (let y = 0; y < h; y += 64) { g.fillStyle = '#d9a845'; g.beginPath(); g.moveTo(w / 2, y + 8); g.lineTo(w / 2 + 26, y + 32); g.lineTo(w / 2, y + 56); g.lineTo(w / 2 - 26, y + 32); g.fill(); } }, 1, 8);
  ground(PX, -10, 6, 32, toon({ map: carpetTex })).position.y = 0.01; ground(PX, -10, 10, 40, T2(P.planks(5) ? P.planks(5) : P2.floorTiles(), 4, 12));
  for (const sx of [-1, 1]) { const w = plane(32, 3.6, toon({ map: wallTex, side: THREE.DoubleSide }), PX + sx * 2.6, 1.8, -10, -sx * Math.PI / 2); add(box(0.08, 0.14, 32), toon({ color: '#f4ecdc' }), PX + sx * 2.56, 0.07, -10, world, { cast: false }); add(box(0.06, 0.1, 32), toon({ color: '#f4ecdc' }), PX + sx * 2.57, 1.0, -10, world, { cast: false }); }
  plane(5.2, 3.6, toon({ map: wallTex, side: THREE.DoubleSide }), PX, 1.8, -26, 0); { const c = add(new THREE.PlaneGeometry(5.2, 32), toon({ color: '#f2ead8', side: THREE.DoubleSide }), PX, 3.6, -10, world, { cast: false }); c.rotation.x = Math.PI / 2; }
  const doorM = toon({ color: '#7a4a2a' }), plateM = toon({ color: '#e8c35a' });
  C.aptDoors = [];
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) { const z = -2 - i * 4, g = new THREE.Group(); g.position.set(PX + sx * 2.55, 0, z); g.rotation.y = -sx * Math.PI / 2; world.add(g);
    add(box(1.1, 2.2, 0.08), doorM, 0, 1.1, 0, g); add(box(1.24, 0.1, 0.1), toon({ color: '#f4ecdc' }), 0, 2.25, 0, g); add(new THREE.SphereGeometry(0.05, 8, 6), goldM, 0.4, 1.05, 0.06, g);
    const n = canvasTex(C, 128, 96, (q) => { q.fillStyle = '#e8c35a'; q.fillRect(0, 0, 128, 96); q.fillStyle = '#2a1a10'; q.font = 'bold 64px DejaVu Sans, sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(String(100 + i * 2 + (sx > 0 ? 1 : 0)), 64, 50); });
    plane(0.32, 0.24, toon({ map: n }), 0, 1.7, 0.05, 0, g); }
  for (let i = 0; i < 4; i++) { add(new THREE.CylinderGeometry(0.3, 0.38, 0.12, 16), toon({ color: '#fff4d0', emissive: '#ffe3a0', emissiveIntensity: 0.8 }), PX, 3.52, -3 - i * 6, world, { cast: false }); }
  add(box(1.6, 1.4, 0.06), toon({ color: '#9fd4ff', emissive: '#bfe6ff', emissiveIntensity: 0.5 }), PX, 1.8, -25.9, world, { cast: false });
  // wall calendar (pages fly off in fx) + a dusty plant
  const cal = canvasTex(C, 256, 320, (q) => { q.fillStyle = '#f7f2e6'; q.fillRect(0, 0, 256, 320); q.fillStyle = '#c0433a'; q.fillRect(0, 0, 256, 70); q.fillStyle = '#fff'; q.font = 'bold 44px DejaVu Sans'; q.textAlign = 'center'; q.fillText('YEAR 1', 128, 50); q.fillStyle = '#2a1a10'; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) q.fillRect(22 + c * 38, 100 + r * 52, 24, 24); });
  plane(0.6, 0.75, toon({ map: cal }), PX - 2.54, 1.75, -5.0, Math.PI / 2);
  add(new THREE.CylinderGeometry(0.22, 0.17, 0.4, 12), toon({ color: '#b5653a' }), PX + 2.1, 0.2, -6.2, world); add(new THREE.SphereGeometry(0.42, 10, 8), toon({ color: '#6b8a3a' }), PX + 2.1, 0.75, -6.2, world);

  // ===== TEMPLE: the temple of Isis (Philae) — day (statue) and night (relief wall gilded) =====
  const [TX] = TEMPLE;
  ground(TX, -20, 120, 120, T2(P2.blocks(52, 34, 82), 20, 20));
  ground(TX, -12, 8, 30, T2(P2.runner(), 1, 4)).position.y = 0.02;
  const colPaint = T2(P2.columnPaint(5), 2, 1), capM = toon({ color: '#3a9a6a' });
  const capGeo = new THREE.LatheGeometry([[0.62, 0], [0.7, 0.25], [0.95, 0.7], [1.2, 1.1], [1.25, 1.2], [0, 1.2]].map(([x, y]) => new THREE.Vector2(x, y)), 20);
  for (const sx of [-1, 1]) for (const z of [-22, -16, -10, -4, 2]) { add(new THREE.CylinderGeometry(0.64, 0.72, 7.6, 20), colPaint, TX + sx * 5.5, 3.8, z); add(capGeo, capM, TX + sx * 5.5, 7.6, z); add(box(1.5, 0.35, 1.5), stoneM, TX + sx * 5.5, 8.95, z); }
  for (const sx of [-1, 1]) add(box(1.2, 0.9, 30), T2(P2.hieroWall(6, 1024, 256), 6, 1), TX + sx * 5.5, 9.5, -10);
  // back wall: the relief panel sits at z -27.4 (the relief itself is a card in the story)
  add(box(22, 14, 1), T2(P2.hieroWall(7), 3, 2), TX, 7, -28.2);
  add(box(9.4, 11, 0.3), toon({ color: '#d8c49a' }), TX, 5.9, -27.6, world); add(box(9.8, 0.4, 0.4), goldD, TX, 11.5, -27.5); add(box(9.8, 0.4, 0.4), goldD, TX, 0.3, -27.5);
  // scaffold + ladder for the scribe (night)
  const scaf = new THREE.Group(); scaf.position.set(TX + 2.2, 0, -26.2); world.add(scaf); C.scaffold = scaf;
  for (const sx of [-1, 1]) add(box(0.12, 4.2, 0.12), woodD, sx * 0.9, 2.1, 0, scaf); add(box(2.1, 0.12, 0.9), woodD, 0, 3.6, -0.3, scaf);
  for (const sx of [-0.35, 0.35]) { const r = add(box(0.08, 3.9, 0.08), woodD, sx, 1.85, 0.6, scaf); r.rotation.x = -0.25; }
  for (let i = 0; i < 9; i++) { const r = add(box(0.78, 0.06, 0.06), woodD, 0, 0.3 + i * 0.4, 0.62 - (0.3 + i * 0.4) * 0.25, scaf); }
  // statues of Isis are cards; pedestals here
  add(box(3.2, 1.2, 2.4), stoneM, TX, 0.6, -24.6); add(box(3.4, 0.16, 2.6), goldD, TX, 1.2, -24.6);
  for (const sx of [-1, 1]) { add(box(1.0, 1.4, 1.0), stoneM, TX + sx * 3.2, 0.7, -20); add(new THREE.CylinderGeometry(0.5, 0.25, 0.32, 14), bronzeM, TX + sx * 3.2, 1.56, -20); }
  // obelisks + palms outside the pylon gate (front, +z)
  for (const sx of [-1, 1]) { obelisk(TX + sx * 6, 10, 10); palm(TX + sx * 11, 12, 6.5, 0.1); palm(TX + sx * 15, 18, 5.5, 0.14); }

  // ===== banquet table in the throne hall (z -5.9, under 1.1 m so faces behind it stay clear) =====
  { const g = new THREE.Group(); g.position.set(0, 0, -5.9); world.add(g); add(box(2.8, 0.1, 0.9), woodD, 0, 0.68, 0, g); add(box(2.84, 0.06, 0.94), goldM, 0, 0.61, 0, g, { cast: false });
    for (const sx of [-1.25, 1.25]) for (const sz of [-0.35, 0.35]) add(box(0.1, 0.62, 0.1), woodD, sx, 0.31, sz, g);
    for (let i = 0; i < 7; i++) add(new THREE.SphereGeometry(0.09 + (i % 3) * 0.02, 10, 8), toon({ color: ['#c8443a', '#e8b531', '#7a2f7a', '#6aa63a'][i % 4] }), -0.9 + i * 0.3, 0.82, (i % 2) * 0.2 - 0.1, g);
    for (const x of [-0.6, 0.5]) { add(new THREE.CylinderGeometry(0.07, 0.04, 0.14, 10), goldM, x, 0.82, 0.25, g); add(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 6), goldM, x, 0.7, 0.25, g); }
    add(new THREE.CylinderGeometry(0.32, 0.26, 0.08, 16), goldD, 0, 0.77, 0, g); }

  // ===== study (v3 library at LIB) extra props: flash cards on the desk, a candle, scroll stacks (scaled by worldState) =====
  const [LX, LZ] = C.LIB;
  const stack = new THREE.Group(); stack.position.set(LX - 1.0, 1.06, LZ + 0.2); world.add(stack); C.scrollStack = stack;
  for (let i = 0; i < 14; i++) { const s = add(new THREE.CylinderGeometry(0.07, 0.07, 0.62, 8), toon({ color: i % 2 ? '#efdcb0' : '#e3c890' }), (i % 3) * 0.16 - 0.16, 0.07 + Math.floor(i / 3) * 0.13, (i % 2) * 0.05, stack); s.rotation.z = Math.PI / 2; s.userData.i = i; }
  const candle = new THREE.Group(); candle.position.set(LX + 1.1, 1.06, LZ + 0.1); world.add(candle); C.candle = candle;
  add(new THREE.CylinderGeometry(0.14, 0.16, 0.05, 12), goldD, 0, 0.025, 0, candle); const wax = add(new THREE.CylinderGeometry(0.06, 0.06, 1, 10), toon({ color: '#f6efe0' }), 0, 0.5, 0, candle); C.wax = wax;
}
