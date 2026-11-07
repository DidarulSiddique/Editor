import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import * as P2 from './paint2.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';
import { toOld, TOTAL_NEW } from './retime.js'; // v2: slower narration, the v1 timeline is re-mapped onto it

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  plank: texM(P.planks(1), 1, 6), beam: texM(P.beam(2), 1, 2), beamDark: texM(P.beam(3, [28, 36, 30]), 1, 2),
  rot: texM(P.rotten(4), 1, 1), rotB: texM(P.rotten(14), 1, 1),
  stone: texM(P.stone(4), 1, 1), stoneMoss: texM(P.mossy(P.stone(4), 5, 1.2), 1, 1),
  grass: texM(P.grass(6), 40, 40), dirt: texM(P.dirt(7), 6, 30), plaster: texM(P.plaster(8), 1, 1), plaster2: texM(P.plaster(18, 28), 1, 1),
  roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 1, 1), marbleTop: toon({ color: '#ece2cf' }),
  trunk: toon({ color: '#6a4a32' }), cypress: toon({ color: '#3f6b36' }), pine: toon({ color: '#5c8a3c' }), bush: toon({ color: '#6c9a42' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), mount: toon({ color: '#8fa7b8' }), snow: toon({ color: '#f4f6fa' }),
  iron: toon({ color: '#5c5a57' }), bronze: toon({ color: '#b08a4a' }), wood: toon({ color: '#7a5434' }), door: toon({ color: '#5a3a24' }),
  window: toon({ color: '#2b2430' }), red: toon({ color: '#b8282b' }),
};
M.banner = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.banner()), alphaTest: 0.5, side: THREE.DoubleSide });
// helmet
const helmetIn = P.tex(P.helmetInside()); helmetIn.wrapS = helmetIn.wrapT = THREE.ClampToEdgeWrapping;
M.helmIn = new THREE.MeshToonMaterial({ gradientMap: grad, map: helmetIn, side: THREE.BackSide });
M.helmOut = toon({ color: '#8f8a7e' });

// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

// ---------- world: throne hall (x 0), Macedonia battlefield + generals' tent (x 1000), Alexandria (x 2000), Egypt | Greece split (x 3000) ----------
const DECK = 0; // ground height (cards stand on it)
const waterU = { deep: { value: new THREE.Color() }, shal: { value: new THREE.Color() }, glint: { value: new THREE.Color() } }; // unused (kept for applyLight)
const world = new THREE.Group(); scene.add(world);
const T2 = (c, rx_ = 1, ry_ = 1, extra = {}) => toon({ map: P.tex(c, rx_, ry_), ...extra });
const sandM = T2(P2.sand(), 60, 60), meadowM = T2(P2.meadow(), 80, 80), paveM = T2(P2.blocks(31, 36, 84), 50, 50);
const stoneM = toon({ color: '#e6d2a8' }), goldM = toon({ color: '#e8b531' }), goldD = toon({ color: '#c48a22' }), blueM = toon({ color: '#2f6fb0' }), redM = toon({ color: '#b8322f' });
const marbleM = toon({ color: '#f1ece2' }), whiteM = toon({ color: '#f4efe4' }), woodD = toon({ color: '#6a4a2e' }), bronzeM = toon({ color: '#b88a3a' }), darkM = toon({ color: '#3a2a22' });
const palmT = toon({ color: '#8a6a44' }), palmL = toon({ color: '#5f8a3a' }), hillM = toon({ color: '#7aa64c' }), hillFar = toon({ color: '#8fb46a' }), cypM = toon({ color: '#3f6b36' });
const ground = (x, z, w, d, m) => { const g = add(new THREE.PlaneGeometry(w, d), m, x, 0, z, world, { cast: false }); g.rotation.x = -Math.PI / 2; return g; };
const plane = (w, h, m, x, y, z, ry = 0, parent = world, cast = false) => { const p = add(new THREE.PlaneGeometry(w, h), m, x, y, z, parent, { cast }); p.rotation.y = ry; return p; };
const palm = (x, z, h = 6, lean = 0.1, parent = world) => { const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.22 - i * 0.015, 0.26 - i * 0.015, h / 6, 7), palmT, Math.sin(i * 0.3) * lean * i, h / 12 + i * h / 6, 0, g);
  for (let k = 0; k < 7; k++) { const lf = add(new THREE.SphereGeometry(1, 8, 6), palmL, Math.cos(k * 0.9) * 1.4 + lean * 5, h + 0.1, Math.sin(k * 0.9) * 1.4, g); lf.scale.set(1.9, 0.18, 0.55); lf.rotation.y = -k * 0.9; lf.rotation.z = -0.35; }
  return g; };
const cypress = (x, z, h = 7) => { const c = add(new THREE.ConeGeometry(0.9, h, 9), cypM, x, h / 2, z, world); c.scale.x = 0.8; return c; };
const obelisk = (x, z, h = 9, parent = world) => { add(new THREE.CylinderGeometry(0.45, 0.7, h, 4), T2(P2.columnPaint(9), 1, 1), x, h / 2, z, parent).rotation.y = Math.PI / 4; add(new THREE.ConeGeometry(0.5, 1.0, 4), goldM, x, h + 0.5, z, parent).rotation.y = Math.PI / 4; };
const pyramid = (x, z, s) => { const p = add(new THREE.ConeGeometry(s, s * 0.95, 4, 1), T2(P2.blocks(41, 36, 76), 6, 6), x, s * 0.475, z, world, { cast: false }); p.rotation.y = Math.PI / 4; return p; };
const vergM = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P2.vergina()), alphaTest: 0.5, side: THREE.DoubleSide });
const vergRed = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P2.vergina('#b8322f')), alphaTest: 0.5, side: THREE.DoubleSide });
const egyM = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P2.egyptBanner()), alphaTest: 0.5, side: THREE.DoubleSide });
const bannerPole = (x, z, m, h = 6, parent = world) => { const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g); add(new THREE.CylinderGeometry(0.06, 0.07, h, 6), woodD, 0, h / 2, 0, g); add(new THREE.SphereGeometry(0.14, 8, 6), goldM, 0, h + 0.1, 0, g); add(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 6), woodD, 0, h - 0.15, 0, g).rotation.z = Math.PI / 2; plane(1.4, 2.1, m, 0, h - 1.25, 0.02, 0, g, true); return g; };

// ===== HALL (origin): Egyptian throne hall, open to the courtyard at +z =====
const HALL = new THREE.Group(); world.add(HALL);
ground(0, 0, 500, 500, sandM);
ground(0, -7.5, 17, 31, T2(P2.floorTiles(), 4.25, 7.75)).position.y = 0.01;
ground(0, -7, 2.4, 26, T2(P2.runner(), 1, 3)).position.y = 0.02;
for (const [w, y, d, z] of [[9, 0.2, 6.4, -19], [7.6, 0.6, 5.2, -19.6], [6.2, 1.0, 4.2, -20.1]]) { add(box(w, 0.4, d), stoneM, 0, y, z, HALL); add(box(w + 0.02, 0.08, 0.08), goldM, 0, y + 0.2, z + d / 2, HALL, { cast: false }); }
// throne: seat hides the queen's legs, tall gold back
const THRONE = { x: 0, z: -19.9, seatTop: 1.95 };
add(box(1.9, 0.75, 1.2), goldM, 0, 1.575, -19.9, HALL); add(box(1.95, 0.12, 1.25), blueM, 0, 1.98, -19.9, HALL);
add(box(2.1, 2.6, 0.3), goldM, 0, 2.5, -20.65, HALL); add(box(1.5, 1.9, 0.05), blueM, 0, 2.7, -20.48, HALL, { cast: false });
for (const s of [-1, 1]) { add(box(0.25, 0.5, 1.2), goldD, s * 1.0, 2.2, -19.9, HALL); add(new THREE.SphereGeometry(0.22, 12, 8), goldM, s * 1.0, 2.5, -19.35, HALL); }
add(new THREE.SphereGeometry(0.4, 16, 10), redM, 0, 4.05, -20.6, HALL); for (const s of [-1, 1]) { const w = add(new THREE.SphereGeometry(1, 12, 8), goldM, s * 0.95, 4.0, -20.62, HALL); w.scale.set(0.75, 0.16, 0.05); w.rotation.z = -s * 0.12; }
// papyrus columns
const colPaint = T2(P2.columnPaint(3), 2, 1), capM = toon({ color: '#3a9a6a' }), capBand = toon({ color: '#e8b531' });
const capGeo = new THREE.LatheGeometry([[0.62, 0], [0.7, 0.25], [0.95, 0.7], [1.2, 1.1], [1.25, 1.2], [0, 1.2]].map(([x, y]) => new THREE.Vector2(x, y)), 20);
for (const sx of [-1, 1]) for (const z of [-15, -10, -5, 0, 5]) {
  add(new THREE.CylinderGeometry(0.9, 0.95, 0.45, 20), stoneM, sx * 4.6, 0.22, z, HALL);
  add(new THREE.CylinderGeometry(0.64, 0.72, 7.6, 20), colPaint, sx * 4.6, 4.2, z, HALL);
  add(capGeo, capM, sx * 4.6, 8.0, z, HALL); add(new THREE.CylinderGeometry(0.72, 0.72, 0.18, 20), capBand, sx * 4.6, 8.05, z, HALL);
  add(box(1.5, 0.35, 1.5), stoneM, sx * 4.6, 9.38, z, HALL);
}
for (const sx of [-1, 1]) add(tbox(1.2, 0.9, 25, 2), T2(P2.hieroWall(4, 1024, 256), 6, 1), sx * 4.6, 10.0, -5, HALL);
// walls, ceiling
const wallM = T2(P2.hieroWall(1), 5, 1.6, { side: THREE.DoubleSide }), backM = T2(P2.hieroWall(2), 2.6, 1.6, { side: THREE.DoubleSide });
for (const sx of [-1, 1]) plane(31, 11, wallM, sx * 8.5, 5.5, -7.5, -sx * Math.PI / 2, HALL);
plane(17, 11, backM, 0, 5.5, -22.5, 0, HALL);
const ceil = add(new THREE.PlaneGeometry(17, 31), T2(P2.ceilingStars(), 6, 11, { side: THREE.DoubleSide }), 0, 10.45, -7.5, HALL, { cast: false }); ceil.rotation.x = Math.PI / 2;
// banners on the side walls, gold statues by the throne (cards in story), braziers
for (const sx of [-1, 1]) for (const z of [-16, -8, 0]) plane(1.7, 2.6, egyM, sx * 8.4, 6.2, z, -sx * Math.PI / 2, HALL);
const BRAZ = [[-2.5, 0, -12.4], [2.5, 0, -12.4], [-2.6, 1.2, -18.4], [2.6, 1.2, -18.4], [-2.5, 0, -4], [2.5, 0, -4]];
for (const [x, y, z] of BRAZ) { for (let k = 0; k < 3; k++) { const a = k * 2.094, l = add(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 5), bronzeM, x + Math.cos(a) * 0.22, y + 0.6, z + Math.sin(a) * 0.22, HALL); l.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); }
  add(new THREE.CylinderGeometry(0.5, 0.25, 0.32, 14), bronzeM, x, y + 1.3, z, HALL); add(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 14), toon({ color: '#ff9a3a' }), x, y + 1.45, z, HALL, { cast: false }); }
const PL = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight('#ff9a4a', 0, 16, 1.4); scene.add(l); return l; }); // shared pool, placed per shot in worldState
const HALL_LIGHTS = [[-2.5, 2.2, -14], [2.5, 2.2, -14], [0, 3.4, -18.0], [0, 2.4, -4]];
// courtyard outside: obelisks, palms, sphinx-like lion bodies (simple masses)
for (const sx of [-1, 1]) { obelisk(sx * 6.5, 12, 10, HALL); palm(sx * 11, 10, 6.5, 0.1, HALL); palm(sx * 14, 16, 5.5, 0.14, HALL); }
add(box(17, 11, 1), T2(P2.blocks(7), 3, 2), 0, 5.5, -23.1, HALL);
for (const sx of [-1, 1]) add(box(1, 11, 31), T2(P2.blocks(8), 6, 2), sx * 9.0, 5.5, -7.5, HALL);
add(box(19, 0.6, 32), T2(P2.blocks(9), 4, 6), 0, 10.8, -7.5, HALL);
// 3D gold coin (hook): face texture on both caps
const coinFaceM = toon({ map: P.tex(P2.coinFace()) }), coinEdge = toon({ color: '#c8901f' });
const coin = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 64), [coinEdge, coinFaceM, coinFaceM]); coin.castShadow = true; scene.add(coin); coin.visible = false;

// ===== BATTLE (x 1000): Macedonian army at sunset =====
const BX = 1000;
ground(BX, 0, 700, 700, meadowM);
{ const r = P.rng(31);
  for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = 90 + r() * 220; const h = add(new THREE.SphereGeometry(28 + r() * 40, 18, 8), i % 2 ? hillM : hillFar, BX + Math.cos(a) * d, -12, Math.sin(a) * d - 40, world, { cast: false }); h.scale.set(1.7, 0.42 + r() * 0.25, 1); }
  for (let i = 0; i < 6; i++) { const m = add(new THREE.ConeGeometry(70 + r() * 40, 90 + r() * 50, 7), toon({ color: '#8fa7c8' }), BX - 200 + i * 90, 30, -380 - r() * 80, world, { cast: false }); add(new THREE.ConeGeometry(28, 30, 7), toon({ color: '#f4f6fa' }), m.position.x, m.position.y + 46, m.position.z, world, { cast: false }); }
  // the phalanx mass behind the front ranks: bronze shields + helmets + a forest of sarissas
  const shieldGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.06, 16), helmGeo = new THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), crestG = new THREE.BoxGeometry(0.05, 0.18, 0.36);
  for (let row = 0; row < 9; row++) for (let i = 0; i < 18; i++) {
    const x = BX - 9.5 + i * 1.12 + (row % 2) * 0.5, z = -7 - row * 1.5, sh = add(shieldGeo, bronzeM, x, 0.95, z + 0.25, world); sh.rotation.x = Math.PI / 2;
    add(helmGeo, bronzeM, x, 1.62, z, world); add(crestG, redM, x, 1.86, z, world);
    const s = add(new THREE.CylinderGeometry(0.025, 0.025, 6.5, 4), woodD, x + 0.25, 3.6, z - 0.2, world, { cast: false }); s.rotation.x = -0.12 - (row % 3) * 0.05;
  }
  for (let i = 0; i < 7; i++) bannerPole(BX - 9 + i * 3, -6 - (i % 2) * 8, i % 2 ? vergRed : vergM, 6.5 + (i % 3) * 0.6);
}
// Alexander's standard: falls when he dies (worldState)
const alexStd = bannerPole(BX + 2.2, -1.5, vergM, 7.2);
// memorial pedestal (Alexander turns to stone)
add(box(1.6, 0.9, 1.6), marbleM, BX - 30, 0.45, 0, world);

// generals' tent with the map-cake (x 1000, z -150)
const TZ = -150, TENT = new THREE.Group(); TENT.position.set(BX, 0, TZ); world.add(TENT);
add(new THREE.CylinderGeometry(8, 8, 4.4, 32, 1, true), T2(P2.tentCloth(), 8, 1, { side: THREE.DoubleSide }), 0, 2.2, 0, TENT);
add(new THREE.ConeGeometry(8.4, 3.6, 32, 1, true), T2(P2.tentCloth(), 8, 1, { side: THREE.DoubleSide }), 0, 6.2, 0, TENT);
add(new THREE.CylinderGeometry(0.12, 0.12, 8, 8), woodD, 0, 4, -3.5, TENT);
{ const rug = add(new THREE.CircleGeometry(6, 32), toon({ map: P.tex(P2.runner(), 2, 1) }), 0, 0.02, 0, TENT, { cast: false }); rug.rotation.x = -Math.PI / 2; }
add(new THREE.CylinderGeometry(2.1, 2.1, 0.12, 40), woodD, 0, 0.52, 0, TENT); add(new THREE.CylinderGeometry(0.25, 0.4, 0.5, 10), woodD, 0, 0.25, 0, TENT);
for (const [x, z] of [[-4, -3], [4, -3]]) { add(new THREE.CylinderGeometry(0.5, 0.25, 0.32, 14), bronzeM, x, 1.3, z, TENT); add(new THREE.CylinderGeometry(0.04, 0.06, 1.2, 5), bronzeM, x, 0.6, z, TENT); }
for (let i = 0; i < 5; i++) bannerPole(-6 + i * 3, -6.2 + Math.abs(i - 2) * 0.9, i % 2 ? vergRed : vergM, 4.0, TENT);
// the cake: 4 wedges (Egypt = 0). angles are canvas angles on the painted map (clockwise, deg)
const CAKE_R = 1.5, CAKE_H = 0.45, CAKE_Y = 0.58;
const cake = new THREE.Group(); cake.position.set(0, CAKE_Y, 0); cake.rotation.y = Math.PI / 2; TENT.add(cake);
const mapM = toon({ map: P.tex(P2.empireMap()) }), spongeM = toon({ map: P.tex(P2.sponge()), side: THREE.DoubleSide }), spongeS = toon({ map: P.tex(P2.sponge(), 6, 1) });
const WEDGES = [[80, 170], [170, 260], [260, 330], [330, 440]].map(([a0, a1], i) => {
  const g = new THREE.Group(); cake.add(g); const th0 = -a1 * Math.PI / 180, len = (a1 - a0) * Math.PI / 180;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(CAKE_R, CAKE_R, CAKE_H, 40, 1, false, th0, len), [spongeS, mapM, spongeM]); m.position.y = CAKE_H / 2; m.castShadow = m.receiveShadow = true; g.add(m);
  for (const th of [th0, th0 + len]) { const pg = new THREE.PlaneGeometry(CAKE_R, CAKE_H); pg.translate(CAKE_R / 2, CAKE_H / 2, 0); const p = new THREE.Mesh(pg, spongeM); p.rotation.y = th - Math.PI / 2; g.add(p); }
  const mid = th0 + len / 2; g.userData.dir = [Math.sin(mid), Math.cos(mid)]; return g;
});
{ // decorations: pyramid + palm on Egypt, Vergina flag on Macedonia
  const e = WEDGES[0], d = e.userData.dir; const py = add(new THREE.ConeGeometry(0.2, 0.22, 4), goldM, d[0] * 0.95, CAKE_H + 0.11, d[1] * 0.95, e); py.rotation.y = Math.PI / 4;
  const m = WEDGES[1], dm = m.userData.dir; add(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), woodD, dm[0] * 0.9, CAKE_H + 0.25, dm[1] * 0.9, m); plane(0.22, 0.3, vergM, dm[0] * 0.9 + 0.11, CAKE_H + 0.36, dm[1] * 0.9, 0, m);
  for (let i = 0; i < 4; i++) { const w = WEDGES[i], dd = w.userData.dir; add(new THREE.SphereGeometry(0.07, 8, 6), toon({ color: '#c23b4a' }), dd[0] * 1.35, CAKE_H + 0.05, dd[1] * 1.35, w); }
}
const knife = new THREE.Group(); TENT.add(knife); knife.visible = false;
add(box(0.03, 0.38, 2.0), new THREE.MeshBasicMaterial({ color: '#e4ecf4' }), 0, 0, 0, knife); add(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 10), darkM, 0, 0.05, 1.35, knife).rotation.x = Math.PI / 2; add(box(0.05, 0.5, 0.08), goldM, 0, 0.02, 1.0, knife);

// ===== ALEX (x 2000): Alexandria — harbour to the north (-z), Pharos on its island =====
const AX = 2000;
ground(AX, 60, 400, 220, paveM);
const seaTex = P.tex(P2.sea(), 60, 40); const seaM = toon({ map: seaTex, color: '#ffffff' });
{ const s = add(new THREE.PlaneGeometry(1400, 900), seaM, AX, -0.25, -500, world, { cast: false }); s.rotation.x = -Math.PI / 2; s.userData.ndSkip = false; }
add(box(400, 2, 6), T2(P2.blocks(12), 60, 1), AX, -0.6, -50.5, world); // quay wall
// Pharos on its island
const PH = [AX - 35, -150];
{ const isl = add(new THREE.CylinderGeometry(26, 30, 3, 20), toon({ color: '#c9b089' }), PH[0], 0.5, PH[1], world); isl.scale.z = 0.7;
  const bm = T2(P2.blocks(13, 40, 86), 3, 6);
  add(box(16, 30, 16), bm, PH[0], 16, PH[1], world); add(box(17, 1.2, 17), goldD, PH[0], 31.2, PH[1], world);
  add(new THREE.CylinderGeometry(5.6, 6.2, 18, 8), T2(P2.blocks(14, 40, 86), 3, 4), PH[0], 41, PH[1], world); add(new THREE.CylinderGeometry(6.4, 6.4, 1, 8), goldD, PH[0], 50.5, PH[1], world);
  add(new THREE.CylinderGeometry(3.4, 3.6, 8, 16), T2(P2.blocks(15, 40, 86), 2, 2), PH[0], 55, PH[1], world);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; add(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), marbleM, PH[0] + Math.cos(a) * 3, 61, PH[1] + Math.sin(a) * 3, world); }
  add(new THREE.CylinderGeometry(3.8, 3.8, 0.8, 16), goldD, PH[0], 63.4, PH[1], world); add(new THREE.ConeGeometry(2.2, 3, 16), goldM, PH[0], 65.3, PH[1], world); }
const pharosFire = new THREE.Mesh(new THREE.SphereGeometry(2.3, 16, 10), new THREE.MeshBasicMaterial({ color: '#ffd27a', fog: false })); pharosFire.position.set(PH[0], 60.5, PH[1]); pharosFire.userData.ndSkip = true; scene.add(pharosFire);
// city blocks, temple, stoa, palms, obelisks
const houseM = [T2(P2.blocks(16, 38, 88), 2, 1), T2(P2.blocks(17, 30, 82), 2, 1), T2(P2.blocks(18, 20, 90), 2, 1)];
{ const r = P.rng(41);
  for (let i = 0; i < 140; i++) { const x = AX + (r() - 0.5) * 260, z = -40 + r() * 190; if (Math.abs(x - AX) < 26 && z < 70) continue; const w = 6 + r() * 10, h = 4 + r() * 9, d = 6 + r() * 10;
    add(box(w, h, d), houseM[i % 3], x, h / 2, z, world); if (r() < 0.35) add(box(w + 0.6, 0.5, d + 0.6), i % 2 ? redM : blueM, x, h + 0.25, z, world); }
}
const greekTemple = (x, z, s = 1, ry = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s); world.add(g);
  add(box(16, 1.2, 10), marbleM, 0, 0.6, 0, g); add(box(17, 0.4, 11), marbleM, 0, 0.2, 0, g);
  for (const cz of [-4, 4]) for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.55, 0.62, 7, 16), marbleM, -6.25 + i * 2.5, 4.7, cz, g);
  for (let i = 1; i < 3; i++) for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.55, 0.62, 7, 16), marbleM, sx * 6.25, 4.7, -4 + i * 2.67, g);
  add(box(15, 6.4, 6), toon({ color: '#e9dfcd' }), 0, 4.4, 0, g);
  add(box(16.4, 1.4, 10.4), marbleM, 0, 8.9, 0, g); add(box(16.6, 0.4, 10.6), blueM, 0, 8.3, 0, g);
  const ped = new THREE.Shape([new THREE.Vector2(-8.3, 0), new THREE.Vector2(8.3, 0), new THREE.Vector2(0, 2.6)]); const pg = new THREE.ExtrudeGeometry(ped, { depth: 10.4, bevelEnabled: false }); pg.translate(0, 0, -5.2);
  add(pg, marbleM, 0, 9.6, 0, g); add(new THREE.CircleGeometry(0.9, 16), goldM, 0, 10.6, 5.25, g, { cast: false });
  return g; };
greekTemple(AX, -14, 1.2);
// stoa (palace colonnade) along z = 18 facing +z: the Ptolemy kings parade here, busts gallery, library
const STOA_Z = 18;
add(box(60, 0.6, 7), marbleM, AX, 0.3, STOA_Z - 1, world); add(box(60, 9, 0.6), toon({ color: '#e6dccb' }), AX, 4.5, STOA_Z - 4.2, world);
for (let i = 0; i < 16; i++) add(new THREE.CylinderGeometry(0.42, 0.48, 6.4, 16), marbleM, AX - 28 + i * 3.73, 3.8, STOA_Z + 1.8, world);
add(box(60, 1.2, 7.4), marbleM, AX, 7.6, STOA_Z - 0.8, world); add(box(60.4, 0.35, 7.6), blueM, AX, 7.0, STOA_Z - 0.8, world);
for (let i = 0; i < 8; i++) plane(1.6, 2.4, vergM, AX - 26 + i * 7.4, 4.6, STOA_Z - 3.85, 0, world);
for (let i = 0; i < 7; i++) { add(box(0.9, 1.2, 0.9), marbleM, AX - 13.5 + i * 4.5, 0.6, STOA_Z + 4.5, world); add(box(1.05, 0.12, 1.05), goldD, AX - 13.5 + i * 4.5, 1.2, STOA_Z + 4.5, world); } // bust pedestals on the plaza (busts are cards)
for (const sx of [-1, 1]) { obelisk(AX + sx * 14, STOA_Z + 15, 11); palm(AX + sx * 21, STOA_Z + 18, 6.5); palm(AX + sx * 9, STOA_Z + 20, 5.5, 0.14); }
// ships in the harbour (moved in worldState)
const shipHull = (() => { const s = new THREE.Shape(); s.moveTo(-4, 0.6); s.quadraticCurveTo(-3.6, -0.6, -2, -0.9); s.lineTo(2.4, -0.9); s.quadraticCurveTo(4, -0.6, 4.6, 1.2); s.lineTo(3.6, 0.6); s.lineTo(-4, 0.6); const g = new THREE.ExtrudeGeometry(s, { depth: 1.8, bevelEnabled: false }); g.translate(0, 0, -0.9); return g; })();
const sailM = toon({ map: P.tex(P2.sail()), side: THREE.DoubleSide });
const ships = [0, 1, 2, 3].map((i) => { const g = new THREE.Group(); world.add(g); add(shipHull, toon({ color: i % 2 ? '#7a4a2a' : '#8a5a34' }), 0, 0.4, 0, g); add(box(8.2, 0.16, 1.9), toon({ color: '#c0433a' }), 0, 0.98, 0, g);
  add(new THREE.CylinderGeometry(0.1, 0.12, 6, 6), woodD, 0, 3.6, 0, g); const sl = add(new THREE.PlaneGeometry(4.2, 3.6, 6, 1), sailM, 0, 4.4, 0, g); sl.rotation.y = Math.PI / 2;
  for (let k = 0; k < 6; k++) { const o = add(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 4), woodD, -2.5 + k, 0.4, 1.4, g); o.rotation.x = 1.0; }
  g.scale.setScalar(1.6); return g; });
// palace nursery (night) + the library (study), small dressed corners south of the stoa
const NURS = [AX - 40, 70], LIB = [AX + 40, 70];
{ const n = new THREE.Group(); n.position.set(NURS[0], 0, NURS[1]); world.add(n);
  add(box(14, 7, 0.4), toon({ color: '#d9c7a8' }), 0, 3.5, -3, n); add(box(14, 0.2, 8), T2(P2.floorTiles(), 3, 2), 0, 0.05, 1, n);
  add(new THREE.CircleGeometry(1.4, 24, 0, Math.PI), toon({ color: '#1d2c6a' }), 0, 3.4, -2.78, n, { cast: false }); add(box(2.8, 1.8, 0.05), toon({ color: '#1d2c6a' }), 0, 2.5, -2.78, n, { cast: false });
  for (const sx of [-1, 1]) { plane(2.2, 5.6, toon({ color: '#6b2f7a', side: THREE.DoubleSide }), sx * 2.3, 3.2, -2.7, 0, n); add(new THREE.SphereGeometry(0.35, 10, 8), goldM, sx * 2.3, 6.1, -2.7, n); }
  plane(1.4, 2.1, vergM, -5, 3.8, -2.75, 0, n); plane(1.4, 2.1, vergM, 5, 3.8, -2.75, 0, n);
  add(new THREE.CylinderGeometry(0.16, 0.2, 0.18, 10), toon({ color: '#9a5b33' }), 1.6, 0.85, 0.4, n); add(box(1.0, 0.75, 0.7), woodD, 1.6, 0.38, 0.4, n);
  const moon = add(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: '#fff6d8', fog: false }), 0.6, 3.9, -2.74, n, { cast: false }); moon.userData.ndSkip = true; }
{ const l = new THREE.Group(); l.position.set(LIB[0], 0, LIB[1]); world.add(l);
  add(box(16, 0.2, 9), T2(P2.floorTiles(), 3, 2), 0, 0.05, 0.5, l); add(box(16, 7, 0.4), toon({ color: '#d9c7a8' }), 0, 3.5, -3.6, l);
  const scrollEnds = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#6a4a2e'; g.fillRect(0, 0, 512, 256); for (let y = 0; y < 4; y++) for (let x = 0; x < 10; x++) { g.fillStyle = (x + y) % 3 ? '#efdcb0' : '#e3c890'; g.beginPath(); g.arc(26 + x * 51, 32 + y * 64, 22, 0, 7); g.fill(); g.fillStyle = '#8a6a44'; g.beginPath(); g.arc(26 + x * 51, 32 + y * 64, 7, 0, 7); g.fill(); } return c; })();
  for (const sx of [-1, 0, 1]) { add(box(4.4, 5.2, 1.0), toon({ map: P.tex(scrollEnds, 3, 6) }), sx * 5, 2.6, -3.0, l); add(box(4.6, 0.25, 1.1), woodD, sx * 5, 5.3, -3.0, l); }
  add(box(3.0, 0.12, 1.4), woodD, 0, 1.0, 0.2, l); for (const sx of [-1, 1]) add(box(0.12, 1.0, 1.2), woodD, sx * 1.35, 0.5, 0.2, l);
  for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), toon({ color: '#efdcb0' }), -1.0 + i * 0.22, 1.12, -0.2, l).rotation.z = Math.PI / 2;
  plane(1.4, 2.1, egyM, -7.5, 4.2, -3.35, 0, l); plane(1.4, 2.1, vergM, 7.5, 4.2, -3.35, 0, l); }

// ===== SPLIT (x 3000): Greece (x < 3000) | Egypt (x > 3000) =====
const SX = 3000;
ground(SX - 200, -100, 400, 600, meadowM); ground(SX + 200, -100, 400, 600, sandM).position.y = 0.005;
add(box(0.25, 0.08, 600), goldM, SX, 0.04, -100, world, { cast: false }); // the dividing line
greekTemple(SX - 12, -36, 0.85, 0.35);
{ const r = P.rng(51);
  for (let i = 0; i < 22; i++) cypress(SX - 8 - r() * 70, -10 - r() * 120, 6 + r() * 4);
  for (let i = 0; i < 12; i++) { const h = add(new THREE.SphereGeometry(30 + r() * 30, 16, 8), i % 2 ? hillM : hillFar, SX - 60 - r() * 200, -10, -120 - r() * 200, world, { cast: false }); h.scale.set(1.5, 0.5 + r() * 0.3, 1); }
  for (let i = 0; i < 8; i++) { const o = add(new THREE.SphereGeometry(1.2, 10, 8), toon({ color: '#8aa06a' }), SX - 6 - r() * 30, 2.4, 6 - r() * 30, world); o.scale.y = 0.8; add(new THREE.CylinderGeometry(0.15, 0.22, 2, 6), woodD, o.position.x, 1, o.position.z, world); }
  pyramid(SX + 90, -190, 70); pyramid(SX + 170, -240, 56); pyramid(SX + 40, -260, 40);
  for (let i = 0; i < 18; i++) palm(SX + 8 + r() * 60, -6 - r() * 90, 5 + r() * 2.5, 0.08 + r() * 0.1);
  for (let i = 0; i < 14; i++) { const dn = add(new THREE.SphereGeometry(30 + r() * 30, 16, 8), toon({ color: i % 2 ? '#e9c98c' : '#e2bf86' }), SX + 80 + r() * 260, -12, -60 - r() * 260, world, { cast: false }); dn.scale.set(1.6, 0.4, 1); }
}
obelisk(SX + 10, -18, 11); obelisk(SX + 22, -18, 11);
// pylon with the balcony ("window of appearances") for her speech, Egyptian side
const PY = [SX + 16, -34];
{ const g = new THREE.Group(); g.position.set(PY[0], 0, PY[1]); world.add(g); const pm = T2(P2.hieroWall(5), 1, 1);
  for (const sx of [-1, 1]) { const t = add(new THREE.CylinderGeometry(4.2 / Math.SQRT2, 6 / Math.SQRT2, 16, 4, 1), pm, sx * 7.5, 8, 0, g); t.rotation.y = Math.PI / 4; t.scale.z = 0.45; }
  add(box(5, 11, 3), T2(P2.blocks(19, 36, 80), 1, 2), 0, 5.5, 0, g); add(box(4.6, 0.4, 2.4), goldM, 0, 7.2, 1.6, g); add(box(4.2, 0.9, 0.2), blueM, 0, 7.8, 2.7, g);
  for (const sx of [-1, 1]) bannerPole(sx * 3.4, 2.6, egyM, 14, g);
  add(box(3, 2.2, 0.1), toon({ color: '#1d1410' }), 0, 8.6, 1.52, g, { cast: false }); }
// Ptolemy's landing: banner planted in the sand (moves in worldState)
const landStd = bannerPole(SX + 30, -60, vergM, 5.5);

// stars (night sky)
const starsG = new THREE.BufferGeometry(); { const r = P.rng(77), v = []; for (let i = 0; i < 900; i++) { const a = r() * Math.PI * 2, e = 0.08 + r() * 1.3; v.push(Math.cos(a) * Math.cos(e) * 1000, Math.sin(e) * 1000, Math.sin(a) * Math.cos(e) * 1000); } starsG.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); }
const stars = new THREE.Points(starsG, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
stars.userData.ndSkip = true; stars.renderOrder = -1; scene.add(stars);

// clouds: painted billboards far away (no fog, no ink); the group follows the current set
const clouds = []; const cloudG = new THREE.Group(); scene.add(cloudG);
{ const r = P.rng(90);
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 120 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; cloudG.add(m); clouds.push(m);
  } }

// every banner plane flutters a little (collected once the world is built)
const FLAGS = []; scene.traverse((o) => { if (o.isMesh && (o.material === vergM || o.material === vergRed || o.material === egyM)) { o.userData.ry0 = o.rotation.y; FLAGS.push(o); } });

// ---------- helmet prop (3D) ----------
const helmet = new THREE.Group(); scene.add(helmet); helmet.visible = false;
{
  const inGeo = new THREE.SphereGeometry(0.98, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const uv = inGeo.attributes.uv, pos = inGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 - pos.getX(i) / 2.1, 0.5 - pos.getZ(i) / 2.1);
  add(inGeo, M.helmIn, 0, 0, 0, helmet);
  add(new THREE.SphereGeometry(1.0, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.helmOut, 0, 0, 0, helmet);
  const band = add(new THREE.TorusGeometry(1.0, 0.07, 8, 48), toon({ color: '#a88a4a' }), 0, 0.02, 0, helmet); band.rotation.x = Math.PI / 2;
  const crest = add(new THREE.CylinderGeometry(1.3, 1.3, 0.22, 32, 1, false, 0, Math.PI), toon({ color: '#8d4b3f' }), 0, 0.95, 0, helmet);
  crest.rotation.z = Math.PI / 2; crest.rotation.y = Math.PI / 2; crest.scale.set(1, 1, 0.6);
}

// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true; this.bb = null;
  }
  /** bounding box of the drawn pixels, canvas px [x0, y0, x1, y1] (computed lazily, only for the safe-frame check) */
  bbox() {
    if (this.bb) return this.bb;
    const d = this.g.getImageData(0, 0, CW, CH).data; let x0 = CW, y0 = CH, x1 = -1, y1 = -1;
    for (let y = 0; y < CH; y += 4) for (let x = 0; x < CW; x += 4) if (d[(y * CW + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return (this.bb = x1 < 0 ? null : [x0, y0, x1, y1]);
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 }, bloom: { value: 0.8 }, grain: { value: 0.018 }, seed: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash, bloom, grain, seed; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));                           // depth jump, near side only
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    // bloom: bright fire, gold and sky bleed light around them (golden-spiral taps, 6..46 px)
    vec3 glow = vec3(0.);
    for (int i=0;i<28;i++){ float fi=float(i); float r = 6. + 40.*fract(fi*.618034); float a = fi*2.39996;
      vec3 s = texture2D(col, vUv + vec2(cos(a),sin(a))*r/res).rgb; float l = dot(s, vec3(.299,.587,.114));
      glow += s*smoothstep(.62,1.,l)*(1.15 - r/46.); }
    c += glow/28.*bloom;
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    { float lum = dot(c, vec3(.299,.587,.114)); c *= mix(vec3(.84,.9,1.14), vec3(1.), smoothstep(.04,.5,lum)); } // split tone: cool shadows, warm lights
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    float n = fract(sin(dot(floor(vUv*res) + seed*17.13, vec2(12.9898,78.233)))*43758.5453);
    c += (n - .5)*grain*(1.2 - dot(c, vec3(.33)));
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
  waterU.deep.value.set(L.waterDeep); waterU.shal.value.set(L.waterShal); waterU.glint.value.set(L.glint);
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

function worldState(W, f) {
  // point-light pool: [x, y, z, intensity, colour, distance] per light, with a fire flicker
  const Ls = W.lights || [];
  PL.forEach((l, i) => { const d = Ls[i]; if (!d) { l.intensity = 0; return; }
    l.position.set(d[0], d[1], d[2]); l.intensity = (d[3] ?? 3) * (0.86 + 0.14 * Math.sin(f * 0.9 + i * 2.1) * Math.sin(f * 0.37 + i)); l.color.set(d[4] || '#ff9a4a'); l.distance = d[5] || 16; });
  // cake: wedges spread along their bisectors; the Egypt wedge (0) can be dragged in world x/z
  const C = W.cake || {};
  WEDGES.forEach((g, i) => { const sp = (C.spread || [0, 0, 0, 0])[i], d = g.userData.dir; g.position.set(d[0] * sp, (C.lift || [0, 0, 0, 0])[i], d[1] * sp); g.rotation.y = (C.spin || [0, 0, 0, 0])[i]; });
  if (C.egypt) { const [X, Z] = C.egypt; WEDGES[0].position.x += -Z; WEDGES[0].position.z += X; }
  const K = W.knife; knife.visible = !!K; if (K) { knife.position.set(K.x, K.y, K.z); knife.rotation.set(K.rx || 0, K.ry || 0, K.rz || 0); }
  alexStd.rotation.z = W.stdFall || 0; alexStd.position.y = 0;
  const Co = W.coin; coin.visible = !!Co; if (Co) { coin.position.set(Co.x, Co.y, Co.z); coin.rotation.set(Co.rx || 0, Co.ry || 0, Co.rz || 0); coin.scale.setScalar(Co.s || 1); }
  ships.forEach((g, i) => { const x = ((f * 0.06 + i * 47) % 190) - 95; g.position.set(AX + x, 0, -75 - i * 16); g.rotation.y = i % 2 ? Math.PI : 0; if (i % 2) g.position.x = AX - x; g.rotation.z = Math.sin(f * 0.05 + i) * 0.03; });
  seaTex.offset.set(f * 0.0009, f * 0.0004);
  FLAGS.forEach((m, i) => { m.rotation.y = m.userData.ry0 + 0.09 * Math.sin(f * 0.085 + i * 1.7); m.rotation.z = 0.025 * Math.sin(f * 0.11 + i); }); // banners flutter
  const Ld = W.land ?? 0; landStd.position.y = Ld; landStd.rotation.z = Ld > 0 ? 0.1 : 0;
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  cards.forEach((c) => { c.check = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1) * (a.sx ?? 1), s * (a.sy ?? 1), s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2; c.check = !!a.check; c.ckey = a.key;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const helmetState = (h) => {
  helmet.visible = !!h; if (!h) return;
  helmet.position.set(h.x, h.y, h.z); helmet.rotation.set(h.rx || 0, h.ry || 0, h.rz || 0); helmet.scale.setScalar(h.s || 0.17);
};

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (fNew) => {
  const f = toOld(fNew);
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  helmetState(null);
  sky.position.copy(camera.position);
  for (const c of clouds) { c.quaternion.copy(camera.quaternion); c.visible = !L.night; }
  stars.visible = !!L.night; stars.position.copy(camera.position);
  cloudG.position.x = Math.round(camera.position.x / 1000) * 1000;
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.seed.value = f % 97; inkU.bloom.value = L.bloom ?? 0.8; inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
// Safe frame: phones trim ~100 px off each side (aspect fill), iPads ~240 px off top and bottom.
// Every character must sit fully inside x 110..970, y 250..1670 (bottom may run out on close-ups: shot.cu).
const SAFE = { x0: 110, x1: 970, y0: 250, y1: 1670 };
window.safeCheck = (fNew) => {
  const f = toOld(fNew);
  const S = shotAt(f), C = camAt(f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  const bad = [];
  if (S.macro) return bad;
  for (const c of cards) {
    if (!c.mesh.visible || !c.check) continue;
    const bb = c.bbox(); if (!bb) continue;
    c.mesh.updateMatrixWorld();
    let X0 = 1e9, Y0 = 1e9, X1 = -1e9, Y1 = -1e9;
    for (const [u, v] of [[bb[0], bb[1]], [bb[2], bb[1]], [bb[0], bb[3]], [bb[2], bb[3]]]) {
      const lx = -CM * 0.3 + (u / CW) * CM * 0.6, ly = CM - CM * 0.025 - (v / CH) * CM;
      tmpV.set(lx, ly, 0).applyMatrix4(c.mesh.matrixWorld).project(camera);
      const px = (tmpV.x + 1) / 2 * W, py = (1 - tmpV.y) / 2 * H; X0 = Math.min(X0, px); X1 = Math.max(X1, px); Y0 = Math.min(Y0, py); Y1 = Math.max(Y1, py);
    }
    if (X1 < 0 || X0 > W || Y1 < 0 || Y0 > H) continue; // fully off screen: not seen at all
    const over = X0 < SAFE.x0 || X1 > SAFE.x1 || Y0 < SAFE.y0 || (!S.cu && Y1 > SAFE.y1);
    if (over) bad.push({ shot: S.id, key: c.ckey.slice(0, 6), box: [X0, Y0, X1, Y1].map(Math.round) });
  }
  return bad;
};
window.TOTAL = TOTAL_NEW;
window.ready = true;
