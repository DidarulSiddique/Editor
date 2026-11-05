import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

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

// ---------- world: desert, mountain cave, boulder, flashback sets ----------
const DECK = 0; // ground height (cards stand on it)
const waterU = { deep: { value: new THREE.Color() }, shal: { value: new THREE.Color() }, glint: { value: new THREE.Color() } }; // unused (kept for applyLight)
const world = new THREE.Group(); scene.add(world);
const sandM = toon({ map: P.tex(P.dirt(7)), color: '#f0d29a' }); sandM.map.repeat.set(40, 40);
const rockM = toon({ color: '#c08f60', flatShading: true });
const caveM = toon({ color: '#8a6446', flatShading: true });
const caveFloor = toon({ map: P.tex(P.dirt(7)), color: '#a98458' }); caveFloor.map.repeat.set(3, 3);
const mudM = toon({ map: P.tex(P.plaster(8)), color: '#d8b483' });
const palmT = toon({ color: '#8a6a44' }), palmL = toon({ color: '#5f8a3a' }), duneM = toon({ color: '#e9c98c' }), duneFar = toon({ color: '#e2bf86' });
const ground = add(new THREE.PlaneGeometry(1600, 1600), sandM, 0, 0, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
// cave: interior room (x -4.5..4.5, z -10..0), mouth 3.4 m wide x 3.4 m high at z = 0
add(tbox(10, 0.3, 10.5, 2), caveFloor, 0, 0.02, -5.2, world, { cast: false });
for (const s of [-1, 1]) add(tbox(1.2, 5.6, 10.5, 2), caveM, s * 5.0, 2.8, -5.2, world);
add(tbox(11, 1.2, 10.5, 2), caveM, 0, 5.4, -5.2, world);
add(tbox(11, 5.6, 1.2, 2), caveM, 0, 2.8, -10.4, world);
// cliff face around the mouth
add(tbox(12, 9, 1.4, 3), rockM, -7.7, 4.5, -0.3, world);
add(tbox(12, 9, 1.4, 3), rockM, 7.7, 4.5, -0.3, world);
add(tbox(3.6, 5.6, 1.4, 3), rockM, 0, 6.2, -0.3, world);
// rocky face over the flat cliff boxes, leaving the mouth (|x| < 1.9, y < 3.7) open
{ const r = P.rng(9);
  for (let i = 0; i < 60; i++) {
    const x = (r() - 0.5) * 30, y = r() * 10.5, rr = 1.2 + r() * 2.2;
    if (Math.abs(x) - rr * 0.8 < 2.0 && y - rr * 0.8 < 3.9) continue;
    const m = add(new THREE.DodecahedronGeometry(rr, 0), rockM, x, y, 0.3 + r() * 0.6, world); m.rotation.set(r() * 3, r() * 3, r() * 3); m.scale.z = 0.6;
  } }
for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) { const rr = 0.9 + (k % 3) * 0.35, m = add(new THREE.DodecahedronGeometry(rr, 0), rockM, sx * (2.3 + rr * 0.9 + (k % 2) * 1.6), 0.4 + k * 0.75, 0.55, world); m.rotation.set(k, k * 2, k * 3); m.scale.z = 0.55; }
// mountain mass: rough rocks piled behind and around
{ const r = P.rng(5);
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * 46, z = -2 - r() * 26, y = 2 + r() * (16 - Math.abs(x) * 0.45 - Math.max(0, -z - 14) * 0.4);
    if (Math.abs(x) < 6 && z > -12 && y < 7) continue;
    const m = add(new THREE.DodecahedronGeometry(2.5 + r() * 4.5, 0), rockM, x, Math.max(1, y), z, world); m.rotation.set(r() * 3, r() * 3, r() * 3); m.scale.y = 0.75 + r() * 0.4;
  }
  for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = 12 + r() * 30; if (Math.cos(a) * d > -4 && Math.cos(a) * d < 24 && 6 + Math.sin(a) * d * 0.6 < 40) continue; const m = add(new THREE.DodecahedronGeometry(0.4 + r() * 1.2, 0), rockM, Math.cos(a) * d, 0.3, 6 + Math.sin(a) * d * 0.6, world); m.rotation.set(r() * 3, r() * 3, r() * 3); }
}
// the boulder
const boulder = add(new THREE.IcosahedronGeometry(2.05, 1), toon({ color: '#a97c52', flatShading: true }), 0, 2, 1.0, world);
// light shaft through the gap (additive, no ink)
const shaftM = new THREE.MeshBasicMaterial({ color: '#fff1c8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
const shaft = new THREE.Mesh(new THREE.BoxGeometry(1, 3.4, 9), shaftM); shaft.position.set(0, 1.7, -4.2); shaft.userData.ndSkip = true; scene.add(shaft);
// palms + dunes + far mountains
const palm = (x, z, h = 6, lean = 0.1) => { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g);
  for (let i = 0; i < 6; i++) { const seg = add(new THREE.CylinderGeometry(0.22 - i * 0.015, 0.26 - i * 0.015, h / 6, 7), palmT, Math.sin(i * 0.3) * lean * i, h / 12 + i * h / 6, 0, g); }
  for (let k = 0; k < 7; k++) { const lf = add(new THREE.SphereGeometry(1, 8, 6), palmL, Math.cos(k * 0.9) * 1.4 + lean * 5, h + 0.1, Math.sin(k * 0.9) * 1.4, g); lf.scale.set(1.9, 0.18, 0.55); lf.rotation.y = -k * 0.9; lf.rotation.z = -0.35; }
  return g; };
[[18, 14], [22, 6], [-20, 12], [70, 8], [92, -6], [66, 52], [96, 34], [70, 100], [100, 84]].forEach(([x, z], i) => palm(x, z, 5.5 + (i % 3), 0.08 + (i % 2) * 0.06));
{ const r = P.rng(21);
  for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = 140 + r() * 260; const dn = add(new THREE.SphereGeometry(30 + r() * 40, 18, 8), i % 2 ? duneM : duneFar, Math.cos(a) * d, -14, Math.sin(a) * d, world, { cast: false }); dn.scale.set(1.6, 0.45 + r() * 0.2, 1); }
  for (let i = 0; i < 12; i++) { const a = r() * Math.PI * 2, d = 520 + r() * 220, hh = 90 + r() * 100; { const hl = add(new THREE.SphereGeometry(140 + r() * 60, 16, 8), duneFar, Math.cos(a) * d, -20, Math.sin(a) * d, world, { cast: false }); hl.scale.y = hh / 200; } }
}
// flashback 1: the family house (x 80, z 0)
const house1 = new THREE.Group(); house1.position.set(80, 0, 0); world.add(house1);
add(tbox(8, 3.4, 5, 2), mudM, 0, 1.7, -3, house1);
add(tbox(8.4, 0.3, 5.4, 2), toon({ color: '#9c7a52' }), 0, 3.5, -3, house1);
add(box(1.2, 2.2, 0.1), M.door, 2.2, 1.1, -0.47, house1, { cast: false });
add(box(0.8, 0.7, 0.1), M.window, -2.3, 2.1, -0.47, house1, { cast: false });
const mat1 = add(new THREE.PlaneGeometry(3.6, 2), toon({ color: '#a8423a' }), -0.6, 0.03, 1.2, house1, { cast: false }); mat1.rotation.x = -Math.PI / 2;
const lampM = new THREE.MeshBasicMaterial({ color: '#ffd27a', fog: false }); const lampFlame = add(new THREE.SphereGeometry(0.09, 8, 6), lampM, 1.4, 0.32, 1.6, house1, { cast: false }); lampFlame.userData.ndSkip = true;
add(new THREE.CylinderGeometry(0.16, 0.2, 0.18, 10), toon({ color: '#9a5b33' }), 1.4, 0.12, 1.6, house1);
// flashback 2: courtyard wall with a doorway (x 80, z 40)
const court = new THREE.Group(); court.position.set(80, 0, 40); world.add(court);
for (const s of [-1, 1]) add(tbox(5, 3.6, 0.6, 2), mudM, s * 3.6, 1.8, -2, court);
add(tbox(12.2, 0.8, 0.6, 2), mudM, 0, 3.9, -2, court);
add(tbox(12, 3.6, 0.6, 2), mudM, 0, 1.8, -6, court);
// flashback 3: the herd pen (x 80, z 90)
const pen = new THREE.Group(); pen.position.set(80, 0, 90); world.add(pen);
{ const W2 = 9, D2 = 6; for (let x = -W2; x <= W2; x += 1.5) for (const z of [-D2, D2]) add(new THREE.CylinderGeometry(0.07, 0.08, 1.2, 6), M.wood, x, 0.6, z, pen);
  for (let z = -D2; z <= D2; z += 1.5) for (const x of [-W2, W2]) add(new THREE.CylinderGeometry(0.07, 0.08, 1.2, 6), M.wood, x, 0.6, z, pen);
  for (const z of [-D2, D2]) { add(tbox(W2 * 2, 0.08, 0.08, 1), M.wood, 0, 1.0, z, pen); add(tbox(W2 * 2, 0.08, 0.08, 1), M.wood, 0, 0.6, z, pen); }
  for (const x of [-W2, W2]) { add(tbox(0.08, 0.08, D2 * 2, 1), M.wood, x, 1.0, 0, pen); add(tbox(0.08, 0.08, D2 * 2, 1), M.wood, x, 0.6, 0, pen); } }
// stars (night sky)
const starsG = new THREE.BufferGeometry(); { const r = P.rng(77), v = []; for (let i = 0; i < 900; i++) { const a = r() * Math.PI * 2, e = 0.08 + r() * 1.3; v.push(Math.cos(a) * Math.cos(e) * 1000, Math.sin(e) * 1000, Math.sin(a) * Math.cos(e) * 1000); } starsG.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); }
const stars = new THREE.Points(starsG, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
stars.userData.ndSkip = true; stars.renderOrder = -1; scene.add(stars);
const lamp = new THREE.PointLight('#ffb45c', 0, 12, 1.6); lamp.position.set(81.4, 0.8, 1.6); scene.add(lamp);

// clouds: painted billboards far away (no fog, no ink)
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 120 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }

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
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
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
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
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
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
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

function worldState(S, f) {
  const B = S.boulder || { x: 0, y: 2, z: 1.0, rx: 0, rz: 0 };
  boulder.position.set(B.x, B.y, B.z); boulder.rotation.set(B.rx || 0, B.ry || 0, B.rz || 0);
  shaftM.opacity = S.shaft || 0; shaft.scale.x = Math.max(0.05, S.shaftW || 0.1); shaft.position.x = (S.shaftX || 0);
  shaft.visible = (S.shaft || 0) > 0.001;
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
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

window.renderFrame = (f) => {
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
  stars.visible = !!L.night; stars.position.copy(camera.position); lamp.intensity = L.lamp || 0;
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
