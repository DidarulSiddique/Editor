FACE.snore = { eye: ["dash", "dash"], brow: [0, -1], mouth: "o" };
FACE.stubborn = { eye: ["lid", "lid"], brow: [4, -3], mouth: "frown" };
FACE.squint = { eye: ["slit", "slit"], brow: [3, -2], mouth: "dash" };
FACE.smug = { eye: ["dot", "dot"], brow: [-1, -5], mouth: "smirk" };
FACE.calm = { eye: ["dot", "dot"], brow: [-1, -3], mouth: "smile" };

// ---------------- Roman-era cast (our own designs), built on the Pen / blob / face helpers above ----------------
const STEEL = "#aeb6bf", BRASS = "#d9a845", LEATHER = "#7a4a2a";
export const OUTFITS = {
  legion: { tunic: "#b8322f", cape: "#8f2228", skin: SKIN, helmet: true, armor: true, spear: true, shield: true },
  old: { tunic: "#9c4a3c", cape: "#6e3330", skin: "#f3d6bb", helmet: "old", armor: true, spear: true, shield: false, beard: "#f4f1ea", brows: "#f4f1ea" },
  toga: { tunic: "#f1ead8", skin: "#f5c9a0", toga: "#6b3c8f", hair: "#3b2a20", stout: true },
  civA: { tunic: "#4f7fb8", skin: "#f5c9a0", hair: "#5a3b2a" },
  civB: { tunic: "#d9a441", skin: SKIN, hair: "#2b211c", dress: "#c25a7a" },
  civC: { tunic: "#5d8a3a", skin: "#c99067", hair: "#1e1714", stout: true },
  workA: { tunic: "#8a5d3b", skin: "#f5c9a0", cap: "#c2733a", apron: "#d8c9a6" },
  workB: { tunic: "#3f6a6f", skin: "#ecd0b6", cap: "#5b4a8a", moustache: "#4a3020" },
  // --- "Three men in the cave" (Sahih al-Bukhari 2272): travellers in thobes and head wraps ---
  man1: { tunic: "#d8c7a0", dress: "#cdb98e", skin: "#d9a57a", wrap: "#f3efe4", beard: "#2a1d14" },
  man2: { tunic: "#8a5a3c", dress: "#7d5034", skin: "#c99067", wrap: "#b8322f", wrapCheck: "#f3efe4", beard: "#1b1410" },
  man3: { tunic: "#3f5a86", dress: "#37507a", skin: "#e2b48c", wrap: "#e9e2d0", beard: "#3a2616" },
  father: { tunic: "#cfc3a8", dress: "#c4b597", skin: "#d9a57a", wrap: "#f6f3ec", beard: "#f4f1ea", brows: "#f4f1ea", stout: true },
  mother: { tunic: "#5b6f4a", dress: "#566a45", skin: "#e2b48c", hijab: "#3a4a5e" },
  worker: { tunic: "#9a8a72", skin: "#b67c55", cap: "#d8cfbd", moustache: "#2a1d14" },
  // --- Cleopatra (Macedonian Greek dynasty, ruled Egypt) ---
  cleoEgypt: { tunic: "#f4efe2", dress: "#f6f1e4", skin: "#d9a57a", wig: "#15110f", crown: "uraeus", collar: true, kohl: true, armbands: true },
  cleoIsis: { tunic: "#f4efe2", dress: "#f6f1e4", skin: "#d9a57a", wig: "#15110f", crown: "isis", collar: true, kohl: true, armbands: true },
  cleoGreek: { tunic: "#f3f0ea", dress: "#ece6dc", skin: "#d9a57a", greekHair: "#4a2c1a", crown: "diadem", sash: "#6b2f7a", bun: true },
  cleoTeen: { tunic: "#f3f0ea", dress: "#ece6dc", skin: "#d9a57a", greekHair: "#4a2c1a", crown: "diadem", sash: "#6b2f7a", bun: true },
  alexander: { tunic: "#b8322f", cape: "#9b1f2b", skin: "#ecc29c", curls: "#d9a23a", cuirass: "#d6a54a" },
  ptolemy: { tunic: "#6b2f7a", cape: "#4a1f58", skin: "#e2b48c", helmGreek: "#c9963c", crestCol: "#e8e2d4", cuirass: "#c9963c" },
  ptolemyKing: { tunic: "#f1ead8", dress: "#ece2cc", skin: "#e2b48c", greekHair: "#3a2414", crown: "diadem", sash: "#6b2f7a" },
  hoplite: { tunic: "#b8322f", skin: "#d9a57a", helmGreek: "#b88a3a", crestCol: "#b8322f", cuirass: "#b88a3a", aspis: true, spear: true },
  priest: { tunic: "#f4efe2", dress: "#efe8d6", skin: "#b67c55", bald: true, leopard: true },
  egyptA: { tunic: "#f0e6cc", skin: "#b07650", wig: "#15110f", collar: true },
  egyptB: { tunic: "#e8dcc0", dress: "#e2d4b4", skin: "#c48a5e", wig: "#2a1d14" },
  greekA: { tunic: "#e9e4f2", dress: "#e2dcea", skin: "#e8bf98", greekHair: "#3a2a1c", beard: "#3a2a1c", sash: "#3f6fb0" },
  alexStone: { tunic: "#bdb8ad", cape: "#a8a398", skin: "#cfcabe", curls: "#b0ab9f", cuirass: "#c4bfb3" },
  greekB: { tunic: "#f1e6d0", dress: "#eadcc0", skin: "#e2b48c", greekHair: "#6a4a2a", sash: "#b8322f" },
};

/** galea: iron bowl, brass brow band, cheek guards, transverse red crest */
const galea = (p, H, cx, hc, light, thick, ow, old, u) => {
  const crest = old ? "#8d4b3f" : "#d2372f", bowl = old ? "#8f8a7e" : STEEL;
  // crest (behind the bowl top)
  const cy0 = hc - H.b * 0.98;
  const cr = ellPts(cx, cy0, 0.66 * 2 * H.a, 0.42 * 2 * H.b, 180, 360, 0, 40);
  cr.push([cx + 0.66 * 2 * H.a * 0.98, cy0 + 4 * u], [cx - 0.66 * 2 * H.a * 0.98, cy0 + 4 * u]);
  const crP = [...ellPts(cx, cy0 + 2 * u, 0.62 * 2 * H.a, 0.36 * 2 * H.b, 180, 360, 0, 40)];
  p.shadedFill(crP, crest, mul(crest, [0.7, 0.62, 0.7]), light, 0.62 * 2 * H.a, 0.3);
  p.clip(crP, () => { for (let i = -9; i <= 9; i++) p.stroke([[cx + i * 7.4 * u, cy0], [cx + i * 9.4 * u, cy0 - 0.62 * H.b * Math.cos(i / 11)]], 1.4 * u, mul(crest, [0.62, 0.55, 0.62])); });
  if (old) p.clip(crP, () => { for (let i = 0; i < 6; i++) p.ell(cx + (i - 3) * 22 * u, cy0 - 18 * u - (i % 2) * 10 * u, 9 * u, 5 * u, "#6f6a5e", 0); });
  p.inkRing(crP, ow * 0.85, thick);
  p.poly(rrect(cx - 10 * u, cy0 - 6 * u, cx + 10 * u, cy0 + 6 * u, 3 * u), BRASS, 2 * u);
  // bowl: upper head cap
  const bandY = hc - H.b * 0.42;
  const bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  p.shadedFill(bp, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => {
    p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 4 * u, "#ffffff55");
    if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (3 + (i % 3) * 2) * u, (2 + (i % 2)) * u, "#8a4b22", 0);
  });
  p.inkRing(bp, ow * 0.9, thick);
  p.band([[cx - H.a * 1.04, bandY], [cx + H.a * 1.04, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
  for (const s of [-1, 1]) p.dot(cx + s * 0.55 * H.a, bandY, 2.2 * u, "#fff3c4");
};
const cheeks = (p, H, cx, hc, light, ow, old, u) => {
  const bowl = old ? "#8f8a7e" : STEEL;
  for (const s of [-1, 1]) {
    const x0 = cx + s * 0.78 * H.a, x1 = cx + s * 1.07 * H.a, y0 = hc - H.b * 0.42, y1 = hc + H.b * 0.48;
    const pts = [[x0, y0], [x1, y0], [x1 - s * 0.04 * H.a, y1 - 0.1 * H.b], [x0 + s * 0.06 * H.a, y1], [x0 - s * 0.05 * H.a, (y0 + y1) / 2]];
    p.shadedFill(pts, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, 0.2 * H.a, 0.3);
    p.poly(pts, null, ow * 0.8);
    p.dot((x0 + x1) / 2, (y0 + y1) / 2 - 0.05 * H.b, 2.2 * u, BRASS);
  }
};
const cobweb = (p, cx, cy, r, u) => {
  const g = p.g; g.save(); g.globalAlpha = 0.8;
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); p.stroke([[cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], 1.1 * u, "#f2f2f2"); }
  for (let k = 1; k <= 4; k++) { const rr = r * k / 4.3, pts = []; for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } p.stroke(pts, 1 * u, "#f2f2f2"); }
  g.restore();
};

/** front-facing Roman-era character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, nohelmet, light */
export const romanFront = (p, key, opts = {}) => {
  const O = typeof key === "string" ? OUTFITS[key] : key;
  const { expr = "neutral", blink = 0, look = 0, facing = 0, seed = 3, L = "hang", R = O.spear ? "spear" : "hang", tilt = 0, headTilt = 0,
    bob = 0, nohelmet = false, light = rad(-120), web = false, step = 0 } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.12 : 1.08, legsL = 1.38, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b + (opts.bow || 0) * 0.62 * H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const legCol = mix(O.tunic, INK, 0.62), armCol = mix(O.tunic, INK, 0.5);
  const helmet = !!O.helmet && !nohelmet, old = O.helmet === "old";
  p.rot = null;
  // ---- cape behind everything ----
  if (O.cape) {
    const cp = [[cx - 0.48 * W, chin + 0.08 * HH], [cx + 0.48 * W, chin + 0.08 * HH], [cx + 0.62 * W, sole - 0.55 * HH], [cx + 0.2 * W, sole - 0.45 * HH], [cx - 0.2 * W, sole - 0.5 * HH], [cx - 0.62 * W, sole - 0.55 * HH]];
    p.gradFill(cp, O.cape, mul(O.cape, [0.6, 0.6, 0.7]), light); p.inkRing(cp, ow * 0.8, thick);
  }
  // ---- legs ----
  const dress = !!O.dress, sit = opts.sit || 0;
  if (sit) for (const side of [-1, 1]) { // seated, seen from the front: knees at the seat edge, shins hanging, sandals on the footstool
    const kx = cx + side * 21 * u, ky = torsoBot + 0.02 * HH, fx = cx + side * 25 * u, fy = sit - 4 * u;
    p.stroke(curve([kx, ky], [kx + side * 2 * u, (ky + fy) / 2], [fx, fy]), 6.2 * u, legCol);
    const sandal = "#5a3b2a";
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u + 3, INK);
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u, sandal);
    p.stroke([[fx - 3 * u, fy - 0.06 * HH], [fx + 3 * u, fy - 0.06 * HH]], 1.6 * u, "#e8b531"); // gold anklet
  }
  else for (const side of [-1, 1]) {
    const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)))) * 30 * (step ? 1 : 0);
    const hx = cx + side * 16 * u, fx = cx + side * 22 * u, fy = sole - 4 * u - up;
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), 5.8 * u, legCol);
    const sandal = O.helmet ? LEATHER : "#5a3b2a";
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u + 3, INK);
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u, sandal);
    if (O.helmet) for (let k = 1; k <= 3; k++) p.stroke([[fx - 4 * u, fy - k * 0.07 * HH], [fx + 4 * u, fy - k * 0.07 * HH - 2 * u]], 2 * u, LEATHER);
  }
  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.12 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.17 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "spear": return { pts: [s, [X(6), s[1] + 0.42 * HH], [X(10), s[1] + 0.2 * HH]], front: false };
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]], front: false };
      case "wave": { const wx = opts.wvx ?? 30; return { pts: [s, [X(wx * 0.53), s[1] - 0.2 * HH], [X(wx + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]], front: false }; }
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]], front: false };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "temple": return { pts: [s, [X(26), s[1] + 0.05 * HH], [cx + side * (H.a + 16 * u), hc - 0.1 * HH]], front: false, swirl: true };
      case "lift": return { pts: [s, [X(20), s[1] - 0.25 * HH], [X(4), s[1] - 0.82 * HH]], front: false };
      case "shield": return { pts: [s, [X(4), s[1] + 0.4 * HH], [tcx + side * 0.6 * T.a, torsoBot - 0.1 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "reach": { const lf = (opts.lift || 0) * 0.62 * HH; return { pts: [s, [X(42), s[1] - 0.12 * HH - lf * 0.6], [X(82), s[1] - 0.5 * HH - lf]], front: false }; }
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a + 2 * u), hc + 0.25 * H.b]], front: false };
      case "rest": { // seated: hands in the lap (restK 0) sliding out onto the throne's armrests (restK 1)
        const [rx, ry] = opts.rest || [210, 480], k = opts.restK ?? 1, L2 = (a2, b2) => [a2[0] + (b2[0] - a2[0]) * k, a2[1] + (b2[1] - a2[1]) * k];
        const e = L2([X(8), s[1] + 0.44 * HH], [cx + side * (rx - 46 * u), ry + 0.12 * HH]), h = L2([tcx + side * 0.22 * T.a, torsoBot - 0.2 * HH], [cx + side * rx, ry]);
        return { pts: [s, e, h], front: k < 0.5 }; }
      case "thumb": return { pts: [s, [X(20), s[1] + 0.12 * HH], [X(44), s[1] - 0.12 * HH]], front: false, thumb: true };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
  const drawArm = (a) => {
    p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
    const [hx, hy] = a.pts[2];
    p.dot(hx, hy, 5.5 * u);
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.stroke([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], 2.6 * u); }
    if (a.thumb) p.stroke([[hx, hy], [hx + Math.sign(hx - cx) * 6 * u, hy - 12 * u]], 2.6 * u);
  };
  // spear behind
  if (O.spear && R === "spear") {
    const [hx, hy] = arms[1].pts[2], s0 = [hx + 2 * u, sole - 2 * u], s1 = [hx - 3 * u, 70];
    p.band([s0, s1], old ? "#6d5236" : "#8a5a34", 4.2 * u, 1.4 * u, "round");
    const tip = [[s1[0] - 7 * u, s1[1] + 6 * u], [s1[0], s1[1] - 34 * u], [s1[0] + 7 * u, s1[1] + 6 * u], [s1[0], s1[1] + 14 * u]];
    p.poly(tip, old ? "#8b7c6a" : "#c9cfd6", 2 * u);
    if (web) cobweb(p, s1[0] - 2 * u, s1[1] + 60 * u, 70 * u, u);
  }
  for (const a of arms) if (!a.front) drawArm(a);
  if (O.wig) { // Egyptian bob wig: braided mass behind the head, to the shoulders (drawn before the torso so the collar sits on top)
    const [qx, qy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]), Aq = tilt + headTilt, keep = p.rot;
    p.rot = Aq ? [rad(Aq), cx, chin, qx - cx, qy - chin] : null;
    const wp = blobPts(cx, hc + 0.3 * H.b, { ...H, a: H.a * 1.22, b: H.b * 1.18, nBot: 3.4, egg: 0.0 });
    p.shadedFill(wp, O.wig, mul(O.wig, [1.6, 1.5, 1.6]), light, H.a, 0.3);
    p.clip(wp, () => { for (let i = -7; i <= 7; i++) p.stroke([[cx + i * 0.17 * H.a, hc - 1.2 * H.b], [cx + i * 0.17 * H.a, hc + 1.6 * H.b]], 1.6 * u, "#3a3230");
      for (let k = 1; k <= 4; k++) p.stroke([[cx - 1.3 * H.a, hc + (0.35 + k * 0.22) * H.b], [cx + 1.3 * H.a, hc + (0.35 + k * 0.22) * H.b]], 1.2 * u, "#3a3230"); });
    p.inkRing(wp, ow, thick); p.rot = keep;
  }
  // torso
  if (dress) {
    const hem = sit ? torsoBot + 0.24 * HH : sole - 0.35 * HH;
    const D = { a: 0.5 * W * (sit ? 1.02 : 0.98), b: 0.5 * (hem - (chin - 0.2 * HH)), nTop: 2.0, nBot: sit ? 4.2 : 3.0, egg: sit ? 0.42 : 0.35, asym: 0, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(cx, hem - D.b, D);
    p.gradFill(dp, O.dress, mul(O.dress, SH_CLOTH), light); p.inkRing(dp, ow, thick);
  }
  // skirt / pteruges below the torso
  if (!dress) {
    const sk = [[tcx - 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 1.0 * T.a, torsoBot + 0.3 * HH], [tcx - 1.0 * T.a, torsoBot + 0.3 * HH]];
    p.gradFill(sk, O.tunic, mul(O.tunic, SH_CLOTH), light); p.poly(sk, null, ow * 0.8);
    if (O.armor) for (let i = -3; i <= 3; i++) { const x = tcx + i * 0.27 * T.a, st = [[x - 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot + 0.22 * HH], [x - 9 * u, torsoBot + 0.22 * HH]]; p.poly(st, old ? "#5e4632" : LEATHER, 1.6 * u); }
  }
  p.gradFill(tp, O.tunic, mul(O.tunic, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.armor) {
      const top = chin - 0.1 * HH, bot = torsoBot - 0.25 * HH, n = 5;
      for (let i = 0; i < n; i++) {
        const y0 = top + (bot - top) * i / n, y1 = top + (bot - top) * (i + 1) / n;
        const c = old ? (i % 2 ? "#8d8679" : "#9a9384") : (i % 2 ? "#a7b0ba" : "#bcc4cc");
        p.poly([[tcx - 1.5 * T.a, y0], [tcx + 1.5 * T.a, y0 + 3 * u], [tcx + 1.5 * T.a, y1 + 3 * u], [tcx - 1.5 * T.a, y1]], c, 1.8 * u);
      }
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.2 * HH], [tcx + 1.4 * T.a, torsoBot - 0.2 * HH]], LEATHER, 0.08 * HH, 1.5 * u);
      for (let i = -2; i <= 2; i++) p.dot(tcx + i * 0.3 * T.a, torsoBot - 0.2 * HH, 2.4 * u, BRASS);
      if (old) for (let i = 0; i < 5; i++) p.ell(tcx + Math.sin(i * 1.7) * 0.7 * T.a, top + (bot - top) * ((i * 0.31) % 1), 6 * u, 3 * u, "#8a4b22", 0);
    } else {
      if (O.cuirass) { p.poly([[tcx - 1.5 * T.a, chin - 0.2 * HH], [tcx + 1.5 * T.a, chin - 0.2 * HH], [tcx + 1.5 * T.a, torsoBot], [tcx - 1.5 * T.a, torsoBot]], O.cuirass, 0);
        for (const sx of [-1, 1]) p.stroke(ellPts(tcx + sx * 0.38 * T.a, chin + 0.28 * HH, 0.36 * T.a, 0.16 * HH, 20, 160, 0, 14), 2.4 * u, mul(O.cuirass, [0.6, 0.5, 0.4]));
        p.stroke([[tcx, chin + 0.35 * HH], [tcx, torsoBot - 0.3 * HH]], 2 * u, mul(O.cuirass, [0.6, 0.5, 0.4])); }
      if (O.sash) p.band([[tcx - 1.0 * T.a, chin - 0.05 * HH], [tcx + 1.05 * T.a, torsoBot - 0.15 * HH]], O.sash, 0.13 * HH, 1.4 * u);
      if (O.leopard) { p.poly([[tcx - 0.2 * T.a, chin], [tcx + 1.1 * T.a, chin + 0.1 * HH], [tcx + 0.9 * T.a, torsoBot - 0.1 * HH], [tcx - 0.1 * T.a, torsoBot - 0.2 * HH]], "#e0a640", 1.4 * u);
        for (let i = 0; i < 9; i++) p.dot(tcx + (0.05 + (i * 0.37) % 0.85) * T.a, chin + (0.12 + ((i * 0.23) % 0.7)) * HH, 3 * u, "#5a3416"); }
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.24 * HH], [tcx + 1.4 * T.a, torsoBot - 0.24 * HH]], O.apron ? "#5a3b2a" : O.collar ? "#e8b531" : "#e2c27a", 0.05 * HH, 1.2 * u);
      if (O.toga) p.band([[tcx - 1.0 * T.a, chin - 0.1 * HH], [tcx + 1.1 * T.a, torsoBot - 0.1 * HH]], O.toga, 0.16 * HH, 1.6 * u);
      if (O.apron) p.poly([[tcx - 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.6 * T.a, torsoBot + 0.2 * HH], [tcx - 0.6 * T.a, torsoBot + 0.2 * HH]], O.apron, 1.6 * u);
      p.stroke([[tcx - 0.2 * T.a, chin + 0.02 * HH], [tcx, chin + 0.16 * HH], [tcx + 0.2 * T.a, chin + 0.02 * HH]], 2 * u);
    }
  });
  p.inkRing(tp, ow, thick);
  if (O.collar) { const cols = ["#e8b531", "#2f8fb0", "#c8443a", "#e8b531", "#3a9a6a"];
    cols.forEach((c, k) => { const r = 0.62 - k * 0.1; p.poly([...ellPts(tcx, chin - 0.02 * HH, T.a * (r + 0.18), 0.36 * HH * (r + 0.1), 0, 180, 0, 24), ...ellPts(tcx, chin - 0.02 * HH, T.a * (r + 0.08), 0.36 * HH * r, 180, 0, 0, 24)], c, k === 0 ? 1.4 * u : 0); }); }
  if (O.armbands) for (const a2 of arms) { const [hx, hy] = a2.pts[1]; p.band([[hx - 7 * u, hy], [hx + 7 * u, hy]], "#e8b531", 4 * u, 1 * u); }
  if (O.armor) for (const s of [-1, 1]) { // shoulder plates
    const sp = ellPts(tcx + s * 0.72 * T.a, chin + 0.1 * HH, 0.42 * T.a, 0.13 * HH, 180, 360, s * 8, 20);
    p.poly(sp, old ? "#9a9384" : "#c5ccd3", 1.8 * u);
  }
  if (O.moss) {/* reserved */}
  for (const a of arms) if (a.front) drawArm(a);
  if (opts.bowl) { // wooden bowl of milk held at the chest
    const bx = tcx, by = torsoBot - 0.42 * HH;
    p.poly([...ellPts(bx, by, 34 * u, 20 * u, 0, 180, 0, 20)], "#8a5a34", ow * 0.8);
    p.ell(bx, by, 34 * u, 8 * u, "#fbf6ea", ow * 0.6);
  }
  if (O.aspis && L === "shield") { const sx = tcx - 0.5 * T.a, sy = torsoBot - 0.05 * HH, r = 0.5 * W;
    p.ell(sx, sy, r, r, "#b88a3a", ow); p.ell(sx, sy, r * 0.82, r * 0.82, "#c9963c", 1.6 * u);
    for (let i = 0; i < 8; i++) { const a2 = i / 8 * Math.PI * 2; p.stroke([[sx + Math.cos(a2) * r * 0.2, sy + Math.sin(a2) * r * 0.2], [sx + Math.cos(a2) * r * 0.55, sy + Math.sin(a2) * r * 0.55]], 4 * u, "#f2d06a"); }
    p.ell(sx, sy, r * 0.2, r * 0.2, "#f2d06a", 1.6 * u); }
  // shield in front, held by the left hand
  if (O.shield && L === "shield") {
    const sx = tcx - 0.55 * T.a, sy = torsoBot + 0.05 * HH, sw = 0.36 * W, sh = 0.78 * HH;
    const sp = rrect(sx - sw, sy - sh, sx + sw, sy + sh, 8 * u);
    p.gradFill(sp, "#c0302c", "#7d1d22", light);
    p.clip(sp, () => {
      p.band([[sx - sw, sy], [sx + sw, sy]], BRASS, 6 * u, 1.2 * u);
      p.band([[sx, sy - sh], [sx, sy + sh]], BRASS, 6 * u, 1.2 * u);
      for (const s of [-1, 1]) { p.stroke([[sx + s * 12 * u, sy - 14 * u], [sx + s * 34 * u, sy - 46 * u], [sx + s * 22 * u, sy - 44 * u], [sx + s * 46 * u, sy - 74 * u]], 3.5 * u, BRASS); p.stroke([[sx + s * 12 * u, sy + 14 * u], [sx + s * 34 * u, sy + 46 * u], [sx + s * 22 * u, sy + 44 * u], [sx + s * 46 * u, sy + 74 * u]], 3.5 * u, BRASS); }
      p.stroke(ellPts(sx - sw * 0.5, sy - sh * 0.7, sw * 0.3, sh * 0.1, 200, 320, 0, 10), 3 * u, "#ffffff44");
    });
    p.ell(sx, sy, 13 * u, 13 * u, "#e6c068", 2.2 * u);
    p.inkRing(sp, ow, thick);
  }
  // ---- head ----
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  if (helmet) galea(p, H, cx, hc, light, thick, ow, old, u);
  if (O.bun) { // bun at the back (Cleopatra's coin portraits) / short Greek hair
    p.ell(cx, hc - 1.02 * H.b, 0.5 * H.a, 0.36 * H.b, O.greekHair, ow * 0.8); p.arc(cx, hc - 1.02 * H.b, 0.3 * H.a, 0.2 * H.b, 200, 340, 2 * u, mul(O.greekHair, [0.6, 0.6, 0.6]));
  }
  if (O.hijab) { // drape behind the head, down over the shoulders
    const dp = blobPts(cx, hc + 0.22 * H.b, { ...H, a: H.a * 1.22, b: H.b * 1.28, nBot: 2.0, egg: 0.25 });
    p.gradFill(dp, O.hijab, mul(O.hijab, SH_CLOTH), light); p.inkRing(dp, ow, thick);
  }
  if (O.wrap && O.wrapCheck) { // keffiyeh tails behind the head
    const tp2 = [[cx - 1.05 * H.a, hc - 0.2 * H.b], [cx + 1.05 * H.a, hc - 0.2 * H.b], [cx + 1.12 * H.a, hc + 1.15 * H.b], [cx - 1.12 * H.a, hc + 1.15 * H.b]];
    p.gradFill(tp2, O.wrap, mul(O.wrap, SH_CLOTH), light); p.inkRing(tp2, ow * 0.8, thick);
  }
  const hp = blobPts(cx, hc, H);
  if (O.hair && !helmet) { const hb = blobPts(cx, hc - 0.03 * HH, { ...H, a: H.a * 1.04, b: H.b * 1.05 }); p.poly(hb, O.hair, 0); }
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  if (helmet) {
    const bandY = hc - H.b * 0.42, bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
    p.shadedFill(bp, old ? "#8f8a7e" : STEEL, mul(old ? "#8f8a7e" : STEEL, [0.62, 0.64, 0.72]), light, H.a, 0.4);
    p.clip(bp, () => { p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 5 * u, "#ffffff66");
      if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
    p.poly(bp, null, ow * 0.9);
    p.band([[cx - H.a * 1.05, bandY], [cx + H.a * 1.05, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
    p.poly(rrect(cx - 4 * u, bandY - 0.55 * H.b, cx + 4 * u, bandY - 3 * u, 2 * u), old ? "#a88a4a" : BRASS, 1.5 * u);
    cheeks(p, H, cx, hc, light, ow, old, u);
  } else if (O.wig || O.greekHair || O.curls || O.helmGreek || O.bald) {
    if (O.wig) { const y0 = hc - 0.42 * H.b, fr = [...ellPts(cx, y0, H.a * 1.08, H.b * 0.86, 180, 360, 0, 40)];
      p.shadedFill(fr, O.wig, mul(O.wig, [1.6, 1.5, 1.6]), light, H.a, 0.3); p.clip(fr, () => { for (let i = -8; i <= 8; i++) p.stroke([[cx + i * 0.14 * H.a, y0 - H.b], [cx + i * 0.14 * H.a, y0]], 1.5 * u, "#3a3230"); }); p.inkRing(fr, ow, thick); }
    if (O.greekHair || O.curls) { const col = O.greekHair || O.curls, y0 = hc - 0.4 * H.b, cap = [...ellPts(cx, y0, H.a * 1.06, H.b * 0.92, 180, 360, 0, 40)];
      p.shadedFill(cap, col, mul(col, [0.75, 0.7, 0.7]), light, H.a, 0.35);
      p.clip(cap, () => { for (let i = 0; i < 16; i++) { const a2 = Math.PI * (1.05 + 0.9 * (i % 8) / 7), r = (i < 8 ? 0.85 : 0.55); p.arc(cx + Math.cos(a2) * H.a * r, y0 + Math.sin(a2) * H.b * r * 0.9, 9 * u, 8 * u, 0, 300, 1.6 * u, mul(col, [0.62, 0.58, 0.58])); } });
      p.inkRing(cap, ow, thick);
      if (O.curls) for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) p.ell(cx + sx * (1.0 + 0.04 * k) * H.a, y0 + (0.05 + k * 0.22) * H.b, 0.13 * H.a, 0.13 * H.b, col, ow * 0.6); }
    if (O.helmGreek) { // Phrygian-style bronze helmet with crest and cheek guards
      const col = O.helmGreek, y0 = hc - 0.12 * H.b, dome = [...ellPts(cx, y0, H.a * 1.1, H.b * 1.02, 180, 360, 0, 40)];
      const crest = [...ellPts(cx, y0 - 0.55 * H.b, H.a * 1.25, H.b * 1.05, 195, 345, 0, 30), ...ellPts(cx, y0 - 0.5 * H.b, H.a * 0.95, H.b * 0.62, 345, 195, 0, 30)], cc = O.crestCol || "#b8322f";
      p.shadedFill(crest, cc, mul(cc, [0.7, 0.62, 0.62]), light, H.a, 0.3);
      p.clip(crest, () => { for (let i = 0; i <= 14; i++) { const a2 = rad(195 + i * 150 / 14); p.stroke([[cx + Math.cos(a2) * H.a * 0.95, y0 - 0.5 * H.b + Math.sin(a2) * H.b * 0.62], [cx + Math.cos(a2) * H.a * 1.25, y0 - 0.55 * H.b + Math.sin(a2) * H.b * 1.05]], 1.6 * u, mul(cc, [0.62, 0.55, 0.55])); } });
      p.poly(crest, null, ow * 0.8);
      p.shadedFill(dome, col, mul(col, [0.62, 0.55, 0.5]), light, H.a, 0.35); p.inkRing(dome, ow, thick);
      p.band([[cx - H.a * 1.1, y0], [cx + H.a * 1.1, y0]], mul(col, [0.8, 0.75, 0.7]), 8 * u, 1.8 * u, "round");
      for (const sx of [-1, 1]) { const g = [[cx + sx * 0.75 * H.a, y0], [cx + sx * 1.1 * H.a, y0], [cx + sx * 1.02 * H.a, hc + 0.55 * H.b], [cx + sx * 0.82 * H.a, hc + 0.45 * H.b]]; p.shadedFill(g, col, mul(col, [0.62, 0.55, 0.5]), light, 0.3 * H.a, 0.3); p.poly(g, null, ow * 0.8); }
    }
  } else if (O.wrap || O.hijab) {
    const col = O.wrap || O.hijab, y0 = hc - 0.18 * H.b;
    const cap = [...ellPts(cx, y0, H.a * 1.1, H.b * (O.hijab ? 0.86 : 1.0), 180, 360, 0, 40)];
    p.shadedFill(cap, col, mul(col, SH_CLOTH), light, H.a, 0.35);
    p.clip(cap, () => {
      if (O.wrapCheck) for (let i = -6; i <= 6; i++) { p.stroke([[cx + i * 18 * u, y0 - 1.2 * H.b], [cx + i * 18 * u + 30 * u, y0]], 2.2 * u, O.wrapCheck); p.stroke([[cx + i * 18 * u, y0], [cx + i * 18 * u + 30 * u, y0 - 1.2 * H.b]], 2.2 * u, O.wrapCheck); }
      else if (O.wrap) for (let k = 1; k <= 3; k++) p.stroke(ellPts(cx, y0 + k * 0.05 * H.b, H.a * 1.05, H.b * (0.35 + 0.18 * k), 200, 340, -8 + k * 6, 16), 2.2 * u, mul(col, [0.82, 0.8, 0.78]));
    });
    p.inkRing(cap, ow, thick);
    if (O.wrapCheck) p.band([[cx - H.a * 1.08, y0 - 0.08 * H.b], [cx + H.a * 1.08, y0 - 0.08 * H.b]], "#1c1c1c", 6 * u, 1.6 * u, "round"); // agal
  } else if (O.cap) hatOn(p, { hat: "cap", cap: O.cap, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.hair) hatOn(p, { hat: "hair", hair: O.hair, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.helmet && nohelmet) { // bald old head with white side tufts
    for (const s of [-1, 1]) p.ell(cx + s * 0.9 * H.a, hc - 0.1 * H.b, 0.22 * H.a, 0.3 * H.b, "#f4f1ea", 3 * u);
  }
  if (O.beard) {
    const dark = O.beard !== "#f4f1ea";
    const bd = blobPts(cx + 6 * u * facing, hc + (dark ? 0.98 : 0.85) * H.b, { a: (dark ? 0.5 : 0.62) * H.a, b: (dark ? 0.5 : 0.75) * H.b, nTop: 2.4, nBot: 1.6, egg: -0.35, asym: 0, rot: 0, noise: 0.02, seed: seed + 4 });
    p.shadedFill(bd, O.beard, mul(O.beard, [0.86, 0.86, 0.92]), light, 0.6 * H.a, 0.3);
    p.clip(bd, () => { for (let i = -3; i <= 3; i++) p.stroke([[cx + i * 9 * u, hc + 0.55 * H.b], [cx + i * 7 * u, hc + 1.35 * H.b]], 1.2 * u, dark ? mix(O.beard, "#ffffff", 0.18) : "#c9c4bb"); });
    p.inkRing(bd, ow * 0.8, thick);
  }
  faceFront(p, cx, hc, W, expr, facing, look, lid, helmet, skin, O.beard ? O.beard : O.moustache, !!O.stout);
  if (O.brows) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 14 * u, hc - 20 * u, 11 * u, 5 * u, O.brows, 2 * u);
  if (O.kohl && lid < 0.6) for (const s of [-1, 1]) { const ex = cx + 7 * u * facing + s * 13 * u; p.stroke([[ex + s * 6 * u, hc - 1 * u], [ex + s * 15 * u, hc - 6 * u]], 2.6 * u); }
  if (O.crown) {
    const yb = hc - 0.48 * H.b;
    if (O.crown === "diadem") p.band([[cx - H.a * 1.04, yb - 0.08 * H.b], [cx + H.a * 1.04, yb - 0.08 * H.b]], "#f7f3ea", 7 * u, 1.6 * u, "round");
    else {
      p.band([[cx - H.a * 1.08, yb], [cx + H.a * 1.08, yb]], "#e8b531", 9 * u, 2 * u, "round");
      for (let i = -3; i <= 3; i++) p.dot(cx + i * 0.26 * H.a, yb, 2.6 * u, i % 2 ? "#2f8fb0" : "#c8443a");
      // uraeus: rearing cobra at the brow
      if (O.crown === "isis") { // cow horns cradling a sun disk (Isis)
        const hy = yb - 0.95 * H.b;
        p.stroke(ellPts(cx, hy - 0.2 * H.b, 0.78 * H.a, 0.62 * H.b, -15, 195, 0, 30), 11 * u, INK);
        p.stroke(ellPts(cx, hy - 0.2 * H.b, 0.78 * H.a, 0.62 * H.b, -12, 192, 0, 30), 5.5 * u, "#e8b531");
        p.ell(cx, hy - 0.05 * H.b, 0.6 * H.a, 0.6 * H.a, "#e0402c", 3 * u);
        p.arc(cx - 0.18 * H.a, hy - 0.25 * H.b, 0.28 * H.a, 0.26 * H.a, 200, 290, 3 * u, "#ffffff88");
      }
      // uraeus: rearing cobra with an open hood at the brow
      p.ell(cx, yb - 17 * u, 8.5 * u, 14 * u, "#e8b531", 2 * u);
      p.stroke([[cx, yb - 26 * u], [cx, yb - 8 * u]], 2 * u, "#b5761c");
      p.ell(cx, yb - 32 * u, 5 * u, 4 * u, "#e8b531", 2 * u); p.dot(cx, yb - 32 * u, 1.4 * u, INK);
    }
  }
  if (O.beard) { // re-draw the mouth over the beard for open mouths
    if (expr === "shock" || expr === "snore") p.ell(cx + 8 * u * facing, hc + 22 * u, 6 * u, 7 * u, "#5a1e28", 2 * u);
  }
  p.rot = null;
  if (arms.some((a) => a.swirl)) { // cuckoo swirl next to the temple
    const a = arms.find((x) => x.swirl), [hx, hy] = a.pts[2], ph = opts.swirl || 0, pts = [];
    for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 4 + ph, r = (4 + i * 0.7) * u; pts.push([hx + Math.cos(t) * r, hy - 40 * u + Math.sin(t) * r]); }
    p.stroke(pts, 3 * u, "#ffffff"); p.stroke(pts, 1.4 * u, INK);
  }
};

/** loose helmet prop card (lifted off the old soldier) */
export const helmetCard = (p) => {
  const H = headBlob(3, 118, 0), u = 2 * H.a / 100, hc = 560, light = rad(-120), thick = thickAngle(light), ow = 5 * u;
  galea(p, H, 300, hc, light, thick, ow, true, u);
  const bandY = hc - H.b * 0.42, bp = ellPts(300, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  // dark inside visible from below
  p.ell(300, bandY, H.a * 1.05, 0.12 * H.b, "#2a221e", 0);
  p.shadedFill(bp, "#8f8a7e", mul("#8f8a7e", [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => { for (let i = 0; i < 9; i++) p.ell(300 + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
  p.poly(bp, null, ow * 0.9);
  p.band([[300 - H.a * 1.05, bandY], [300 + H.a * 1.05, bandY]], "#a88a4a", 7 * u, 1.8 * u, "round");
  cheeks(p, H, 300, hc, light, ow, true, u);
};

/** ZZZ for the sleeping guard */
export const fxZ = (p, t) => {
  const g = p.g; g.save(); g.font = "900 120px Arial Black, Arial"; g.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const k = (t + i / 3) % 1, x = 220 + i * 70 + Math.sin(k * 6) * 20, y = 700 - k * 500, s = 0.5 + k * 0.7;
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = Math.min(1, (1 - k) * 2.5);
    g.lineWidth = 16; g.strokeStyle = INK; g.strokeText("Z", 0, 0); g.fillStyle = "#ffffff"; g.fillText("Z", 0, 0); g.restore();
  }
  g.restore();
};
/** falling leaf */
export const fxLeaf = (p, col) => { p.poly([[300, 380], [420, 470], [300, 620], [180, 470]], col, 14); p.stroke([[300, 400], [300, 600]], 8); };
/** dust cloud puff (k 0..1 growth) */
export const fxDust = (p, k, col = "#e8dcc4") => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - k * k);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = 90 + 150 * k; p.ell(300 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.6, 120 + 60 * k, 100 + 50 * k, col, 12); }
  p.ell(300, 520, 170 + 110 * k, 140 + 80 * k, col, 0);
  g.restore();
};
export const fxDrip = (p) => p.ell(300, 500, 40, 64, "#9fd4ff", 10);
export const fxWood = (p, seed) => { p.poly([[200, 420], [400, 400], [420, 560], [230, 600]], "#5b3d22", 14); p.stroke([[240, 450], [380, 440]], 6, "#3a2614"); p.ell(330, 520, 26, 18, "#4d7a32", 0); };

export const headCenter = (seed = 3) => { const H = headBlob(seed, 118, 0), HH = 2 * H.b; return 975 - 1.38 * HH - 1.08 * HH - H.b; };


// ---------------- animals & props for "Three men in the cave" ----------------
/** sheep, side view facing right (card units: 600 x 1000, feet at 975) */
export const sheep = (p, seed = 1, step = 0) => {
  const u = 1, legs = [[200, 1], [250, -1], [370, 1], [410, -1]];
  for (const [x, s] of legs) { const sw = Math.sin((step + (s > 0 ? 0 : 0.5)) * Math.PI * 2) * 14 * (step ? 1 : 0); p.stroke([[x, 830], [x + sw, 972]], 16, INK); }
  const blobs = [[230, 800, 95, 75], [330, 780, 105, 85], [420, 810, 80, 70], [300, 840, 120, 60], [190, 760, 60, 55]];
  for (const [x, y, a, b] of blobs) p.ell(x, y, a + 6, b + 6, INK, 0);
  for (const [x, y, a, b] of blobs) p.ell(x, y, a, b, "#f4f1e8", 0);
  for (let i = 0; i < 9; i++) p.ell(200 + (i * 37) % 230, 750 + (i * 23) % 90, 22, 16, "#e2ddd0", 0);
  p.ell(490, 760, 52, 40, "#3a2e2a", 8);
  p.ell(470, 728, 20, 12, "#3a2e2a", 6);
  p.dot(505, 752, 6, "#ffffff"); p.dot(507, 752, 3.5, INK);
};
/** camel, side view facing right */
export const camel = (p, step = 0) => {
  const C = "#c99a5b", D = "#a87b42";
  for (const [x, s] of [[230, 1], [270, -1], [390, 1], [430, -1]]) { const sw = Math.sin((step + (s > 0 ? 0 : 0.5)) * Math.PI * 2) * 18 * (step ? 1 : 0); p.stroke([[x, 640], [x + sw * 0.5, 820], [x + sw, 972]], 22, INK); p.stroke([[x, 640], [x + sw * 0.5, 820], [x + sw, 972]], 14, D); }
  p.ell(320, 600, 170, 95, C, 10);
  p.poly([...ellPts(320, 540, 85, 95, 180, 360, 0, 24)], C, 10);
  p.stroke([[460, 590], [500, 470], [520, 360]], 46, INK); p.stroke([[460, 590], [500, 470], [520, 360]], 34, C);
  p.ell(545, 345, 48, 30, C, 9);
  p.dot(552, 335, 6, INK);
  p.stroke([[160, 600], [140, 680]], 8, INK);
};
/** pile of gold coins on the floor */
export const coins = (p) => {
  const pile = [[300, 900, 150, 50], [300, 860, 110, 42], [300, 825, 70, 32]];
  for (const [x, y, a, b] of pile) p.ell(x, y, a, b, "#e8b531", 9);
  for (let i = 0; i < 14; i++) { const x = 180 + (i * 53) % 240, y = 830 + (i * 29) % 80; p.ell(x, y, 18, 8, "#f6d04d", 4); p.stroke([[x - 8, y - 2], [x + 6, y - 3]], 3, "#fff3b0"); }
  for (const [x, y] of [[120, 950], [470, 945], [520, 960]]) p.ell(x, y, 20, 8, "#f6d04d", 5);
};
/** small coin pouch (the worker's wage) */
export const pouch = (p) => {
  p.poly([[240, 960], [360, 960], [390, 880], [350, 800], [250, 800], [210, 880]], "#8a5a34", 10);
  p.band([[245, 812], [355, 812]], "#5a3b22", 14, 4);
  p.dot(300, 900, 10, "#f6d04d");
};
/** big gold "+": wealth growing */
export const fxGrow = (p, t) => { const g = p.g; g.save(); g.globalAlpha = Math.min(1, (1 - t) * 3); p.stroke([[300, 600 - t * 200], [300, 800 - t * 200]], 26, "#f6d04d"); p.stroke([[200, 700 - t * 200], [400, 700 - t * 200]], 26, "#f6d04d"); g.restore(); };

// ---- lip flap: same face with an open "o" mouth (never swap eyes/brows while talking) ----
for (const k of Object.keys(FACE)) if (!k.endsWith("_o")) FACE[k + "_o"] = { ...FACE[k], mouth: "o" };

// ---- extra FX for v2 ----
/** two white eyes in the dark (blink 0..1, look -1..1) */
export const fxEyes = (p, blink = 0, look = 0) => {
  for (const s of [-1, 1]) {
    const x = 300 + s * 70, y = 500, h = 46 * (1 - blink) + 4;
    p.ell(x, y, 34, h, "#ffffff", 6);
    if (blink < 0.6) p.dot(x + look * 12, y + 4, 13, INK);
  }
};
/** big question mark that pops */
export const fxQuestion = (p, t) => {
  const g = p.g; g.save(); const s = 0.6 + 0.4 * Math.min(1, t * 4); g.translate(300, 520); g.scale(s, s); g.rotate(Math.sin(t * 6) * 0.08);
  g.font = "900 380px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = 34; g.strokeStyle = INK; g.strokeText("?", 0, 0); g.fillStyle = "#ffd84a"; g.fillText("?", 0, 0); g.restore();
};
/** tear streams for crying kids */
export const fxTears = (p, t) => { for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const k = (t + i / 3) % 1; p.ell(300 + s * (40 + k * 60), 420 + k * 260, 16, 24, "#8fd0ff", 5); } };
/** sweat drop */
export const fxSweat = (p) => p.poly([[300, 380], [340, 470], [300, 520], [260, 470]], "#9fd8ff", 10);
/** shine/sparkle lines (for the light, the gold) */
export const fxShine = (p, t, col = "#fff3b0") => { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + t, r0 = 90, r1 = 170 + 40 * Math.sin(t * 5 + i); p.stroke([[300 + Math.cos(a) * r0, 500 + Math.sin(a) * r0], [300 + Math.cos(a) * r1, 500 + Math.sin(a) * r1]], 14, col); } };
/** speed lines trailing a fast object (drawn to the left of centre) */
export const fxSpeed = (p, t) => { for (let i = 0; i < 6; i++) { const y = 360 + i * 60, l = 160 + ((i * 53 + t * 400) % 140); p.stroke([[300 - 60 - l, y], [300 - 60, y]], 10 - i % 3 * 2, "#ffffff"); } };
/** floating dust mote */
export const fxMote = (p) => p.ell(300, 500, 26, 26, "#fff6d8", 0);
/** small bird (flapping V) */
export const fxBird = (p, ph) => { const w = Math.sin(ph * Math.PI * 2) * 60; p.stroke([[160, 500 - w], [300, 540], [440, 500 - w]], 22, INK); };

// ---------------- Cleopatra props & FX (our own designs) ----------------
/** side-view horse facing right, galloping by step (0..1). col: coat, cloth: saddle cloth, blaze: white star */
export const horse = (p, step = 0, col = "#8a5a3a", cloth = "#6b2f7a", mane = "#2a1d14", blaze = false) => {
  const ph = step * Math.PI * 2, bob = Math.sin(ph * 2) * 10, by = 620 + bob;
  const leg = (x, a, front, far) => { const k = far ? mul(col, [0.72, 0.7, 0.7]) : col; const kx = x + Math.sin(a) * 60, ky = by + 70 + 120; const fx = kx + Math.sin(a + (front ? -0.6 : 0.7)) * 70 * (front ? 1 : -1) * -1, fy = Math.min(972, ky + 110);
    p.stroke([[x, by + 40], [kx, ky], [fx, fy]], 30, INK); p.stroke([[x, by + 40], [kx, ky], [fx, fy]], 22, k); p.ell(fx, fy - 4, 18, 10, "#2a1d14", 3); };
  leg(415, Math.sin(ph + 1.6) * 0.55, true, true); leg(205, Math.sin(ph + 3.0) * 0.5, false, true);
  // tail
  p.poly([[110, by - 40], [60, by - 10 + Math.sin(ph) * 14], [40, by + 90 + Math.sin(ph) * 20], [80, by + 120], [100, by + 30], [128, by - 10]], mane, 5);
  // body + neck + head
  const body = [...Array(36)].map((_, i) => { const a = i / 36 * Math.PI * 2; return [300 + Math.cos(a) * 190, by + Math.sin(a) * 92]; });
  p.shadedFill(body, col, mul(col, [0.7, 0.66, 0.66]), rad(-120), 190, 0.4); p.inkRing(body, 6, 1);
  const neck = [[400, by - 70], [470, by - 210], [520, by - 250], [565, by - 220], [520, by - 130], [490, by + 10]];
  p.shadedFill(neck, col, mul(col, [0.7, 0.66, 0.66]), rad(-120), 120, 0.4); p.poly(neck, null, 6);
  const head = [[505, by - 255], [560, by - 275], [600, by - 230], [625, by - 175], [610, by - 150], [575, by - 160], [530, by - 200]];
  p.shadedFill(head, col, mul(col, [0.7, 0.66, 0.66]), rad(-120), 60, 0.4); p.poly(head, null, 6);
  p.poly([[520, by - 262], [528, by - 300], [545, by - 268]], col, 5); // ear
  p.dot(560, by - 238, 7, INK); p.dot(612, by - 168, 4, INK);
  if (blaze) p.poly([[575, by - 262], [590, by - 250], [580, by - 236]], "#ffffff", 0);
  for (let i = 0; i < 6; i++) p.poly([[478 - i * 14 + 30, by - 225 + i * 30], [430 - i * 14 + 20 + Math.sin(ph + i) * 6, by - 200 + i * 30], [470 - i * 14 + 30, by - 190 + i * 30]], mane, 3);
  p.stroke([[600, by - 190], [540, by - 120], [470, by - 60]], 4, "#5a3a24"); // rein
  // saddle cloth
  const sc = [[220, by - 85], [380, by - 85], [395, by + 10], [205, by + 10]];
  p.poly(sc, cloth, 5); p.band([[205, by + 4], [395, by + 4]], "#e8b531", 10, 2);
  p.dot(300, by - 38, 16, "#e8b531");
  leg(440, Math.sin(ph) * 0.55, true, false); leg(230, Math.sin(ph + 1.5) * 0.5, false, false);
};
/** wooden cradle with a swaddled baby (and a tiny diadem) */
export const cradle = (p, t = 0) => {
  const rock = Math.sin(t * Math.PI * 2) * 0.05;
  p.rot = [rock, 300, 900];
  p.stroke([[110, 940], [300, 975], [490, 940]], 16, "#5a3a24");
  const body = [[120, 700], [480, 700], [460, 880], [140, 880]];
  p.gradFill(body, "#a36b3c", "#6a4424", rad(-120)); p.inkRing(body, 7, 1);
  for (let i = 0; i < 5; i++) p.stroke([[150 + i * 75, 720], [160 + i * 72, 860]], 4, "#7a4a2a");
  p.ell(300, 690, 170, 40, "#6b2f7a", 6); p.dot(300, 690, 12, "#e8b531");
  p.ell(225, 640, 72, 66, "#e2b48c", 6); // head
  p.arc(225, 590, 30, 16, 200, 340, 8, "#4a2c1a");
  p.band([[165, 615], [285, 615]], "#f7f3ea", 9, 3, "round");
  p.stroke([[198, 642], [210, 646]], 5); p.stroke([[240, 646], [252, 642]], 5);
  p.ell(236, 672, 7, 5, "#c0605a", 0);
  p.rot = null;
};
/** marble bust on its plinth top (card stands on the pedestal) */
export const bust = (p, seed = 1, crown = true) => {
  const m = "#ece6da", sh = "#bfb6a6";
  const base = [[200, 975], [400, 975], [380, 900], [220, 900]]; p.gradFill(base, m, sh, rad(-120)); p.inkRing(base, 6, 1);
  const chest = [...Array(30)].map((_, i) => { const a = Math.PI + i / 29 * Math.PI; return [300 + Math.cos(a) * 150, 905 + Math.sin(a) * 120]; });
  p.gradFill(chest, m, sh, rad(-120)); p.inkRing(chest, 6, 1);
  const H = headBlob(seed + 20, 118, 0), hp = blobPts(300, 700, H); p.shadedFill(hp, m, sh, rad(-120), H.a); p.inkRing(hp, 6, 1);
  const cap = ellPts(300, 662, H.a * 1.06, H.b * 0.9, 180, 360, 0, 30); p.shadedFill(cap, "#e2dccf", sh, rad(-120), H.a, 0.35); p.inkRing(cap, 6, 1);
  for (let i = 0; i < 9; i++) p.arc(300 + Math.cos(Math.PI * (1.1 + i * 0.1)) * H.a * 0.8, 662 + Math.sin(Math.PI * (1.1 + i * 0.1)) * H.b * 0.6, 14, 12, 0, 300, 3, sh);
  if (crown) p.band([[300 - H.a, 655], [300 + H.a, 655]], "#f7f3ea", 10, 3, "round");
  for (const s of [-1, 1]) p.stroke([[300 + s * 22, 705], [300 + s * 40, 705]], 5, "#8a8274");
  p.stroke([[285, 750], [315, 750]], 5, "#8a8274");
};
/** speech bubble: kind "greek" (Greek letters) or "glyph" (hieroglyphs) or "q" (big ?) */
export const bubble = (p, kind = "greek", t = 1, tail = -1) => {
  const s = 0.4 + 0.6 * Math.min(1, t * 1.6) + 0.06 * Math.sin(Math.min(1, t) * Math.PI);
  const g = p.g; g.save(); g.translate(300, 520); g.scale(s, s); g.translate(-300, -520);
  const b = [...Array(40)].map((_, i) => { const a = i / 40 * Math.PI * 2; return [300 + Math.cos(a) * 260, 470 + Math.sin(a) * 170]; });
  p.poly([[300 + tail * 60, 600], [300 + tail * 150, 760], [300 + tail * 130, 600]], "#ffffff", 8);
  p.poly(b, "#ffffff", 8);
  if (kind === "greek") { g.fillStyle = "#2a1d24"; g.font = "bold 70px DejaVu Serif, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ΧΑΙΡΕΤΕ!", 300, 470); }
  else if (kind === "q") { g.fillStyle = "#c0433a"; g.font = "bold 220px DejaVu Sans, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", 300, 480); }
  else glyphRow(p, 300, 470);
  g.restore();
};
const glyphRow = (p, cx, cy) => { const k = [0, 2, 4, 1, 3]; k.forEach((n, i) => miniGlyph(p, n, cx - 180 + i * 90, cy, 0.8)); };
const miniGlyph = (p, k, x, y, s) => { const c = k === 4 ? "#c0433a" : "#2a1d24", w = 9 * s;
  switch (k) {
    case 0: p.arc(x, y - 22 * s, 16 * s, 20 * s, 0, 360, w, c); p.stroke([[x, y - 2 * s], [x, y + 46 * s]], w, c); p.stroke([[x - 26 * s, y + 8 * s], [x + 26 * s, y + 8 * s]], w, c); break;
    case 1: p.arc(x, y, 34 * s, 15 * s, 0, 360, w, c); p.dot(x, y, 10 * s, c); p.stroke([[x - 26 * s, y + 14 * s], [x - 18 * s, y + 38 * s]], w, c); break;
    case 2: p.ell(x - 4 * s, y + 4 * s, 26 * s, 20 * s, c, 0); p.dot(x + 22 * s, y - 18 * s, 11 * s, c); p.stroke([[x - 6 * s, y + 22 * s], [x - 8 * s, y + 46 * s]], w, c); p.stroke([[x + 6 * s, y + 22 * s], [x + 8 * s, y + 46 * s]], w, c); break;
    case 3: for (let i = 0; i < 3; i++) p.stroke([[x - 36 * s, y - 20 * s + i * 20 * s], [x - 18 * s, y - 30 * s + i * 20 * s], [x, y - 20 * s + i * 20 * s], [x + 18 * s, y - 30 * s + i * 20 * s], [x + 36 * s, y - 20 * s + i * 20 * s]], w * 0.8, c); break;
    default: p.ell(x, y - 6 * s, 24 * s, 24 * s, c, w * 0.6); p.stroke([[x - 34 * s, y + 30 * s], [x + 34 * s, y + 30 * s]], w, "#2a1d24");
  } };
/** papyrus scroll held open, with hieroglyph rows */
export const scroll = (p, open = 1) => {
  const w = 60 + 360 * open;
  const sh = [[300 - w / 2, 430], [300 + w / 2, 430], [300 + w / 2, 640], [300 - w / 2, 640]];
  p.gradFill(sh, "#f2e2b4", "#d9c08a", rad(-120)); p.poly(sh, null, 6);
  if (open > 0.6) { const g = p.g; g.save(); p.clip(sh, () => { for (let r2 = 0; r2 < 2; r2++) [0, 2, 4, 1].forEach((k, i) => miniGlyph(p, (k + r2) % 5, 300 - 120 + i * 80, 490 + r2 * 95, 0.55)); }); g.restore(); }
  for (const s of [-1, 1]) { p.ell(300 + s * w / 2, 535, 26, 120, "#e3c890", 6); p.ell(300 + s * w / 2, 420, 12, 12, "#8a5a34", 4); p.ell(300 + s * w / 2, 650, 12, 12, "#8a5a34", 4); }
};
/** fire for braziers / lighthouse: animated tongues */
export const fxFlame = (p, t) => {
  const tongues = [[0, 1], [-60, 0.7], [60, 0.75], [-28, 0.85], [32, 0.9]];
  for (const [dx, h] of tongues) { const w = Math.sin(t * 9 + dx) * 22, top = 980 - 520 * h * (0.85 + 0.15 * Math.sin(t * 13 + dx * 0.1));
    p.poly([[300 + dx - 70, 975], [300 + dx + w * 0.6 - 40, 760], [300 + dx + w, top], [300 + dx + w * 0.6 + 40, 760], [300 + dx + 70, 975]], "#ff8a2a", 0); }
  for (const [dx, h] of tongues.slice(0, 3)) { const w = Math.sin(t * 11 + dx) * 16, top = 980 - 330 * h; p.poly([[300 + dx - 40, 975], [300 + dx + w, top], [300 + dx + 40, 975]], "#ffd46a", 0); }
  p.ell(300, 960, 70, 30, "#fff4c8", 0);
};
/** sparkle star (4-point) for transformations and gold */
export const fxSpark = (p, t) => { const s = Math.sin(Math.min(1, t) * Math.PI); for (const [x, y, k] of [[300, 500, 1], [160, 330, 0.55], [450, 360, 0.6], [200, 700, 0.45], [430, 690, 0.5]]) { const r = 150 * k * s; p.poly([[x, y - r], [x + r * 0.18, y - r * 0.18], [x + r, y], [x + r * 0.18, y + r * 0.18], [x, y + r], [x - r * 0.18, y + r * 0.18], [x - r, y], [x - r * 0.18, y - r * 0.18]], "#fff3b0", 0); } };
/** crowd-cheer marks above heads */
export const fxCheer = (p, t) => { for (let i = 0; i < 3; i++) { const a = -0.9 + i * 0.9, r = 120 + 60 * Math.sin(t * Math.PI * 2 + i); p.stroke([[300 + Math.sin(a) * 70, 600 - Math.cos(a) * 70], [300 + Math.sin(a) * r * 1.6, 600 - Math.cos(a) * r * 1.6]], 22, "#fff6d8"); } };
/** map pin */
export const fxPin = (p, col = "#c0433a") => { p.stroke([[300, 975], [300, 640]], 26, INK); p.stroke([[300, 975], [300, 640]], 16, "#d9d2c4"); p.ell(300, 500, 170, 170, col, 12); p.ell(300, 500, 80, 80, "#e8b531", 8); p.ell(250, 440, 40, 30, "#ffffff88", 0); };
