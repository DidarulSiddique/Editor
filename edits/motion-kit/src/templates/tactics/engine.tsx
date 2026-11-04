// 3D tactics engine (reference: the "Bergkamp vs Newcastle" breakdown): dark stadium,
// glowing pitch lines, low-poly players with tags, neon pass lines, rings and lanes.
// Pitch coords in metres: x across (-34..34), z along (-52.5..52.5), y up.
import React, { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { random } from "remotion";

export type V2 = [number, number];
export type V3 = [number, number, number];

export const LIME = "#c9ff3b";
export const RED = "#ff3a4c";
export const BLUE = "#1f63ff";
export const WHITE = "#ffffff";

// ---------------------------------------------------------------- time helpers
export const smooth = (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p));
export const easeIO = (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const clamp01 = (p: number) => Math.max(0, Math.min(1, p));

// keys: [t, x, z]; smoothstep between keys (players accelerate/decelerate)
export type PKey = [number, number, number];
export const posAt = (keys: PKey[], t: number): V2 => {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b[0]) {
      const p = smooth((t - a[0]) / (b[0] - a[0]));
      return [a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
    }
  }
  const l = keys[keys.length - 1];
  return [l[1], l[2]];
};

// ball keys: [t, x, z, h] — h = arc height of the flight that STARTS at this key
export type BKey = [number, number, number, number];
export const ballAt = (keys: BKey[], t: number): V3 => {
  const R = 0.11;
  if (t <= keys[0][0]) return [keys[0][1], R, keys[0][2]];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b[0]) {
      const lin = clamp01((t - a[0]) / (b[0] - a[0]));
      const p = a[3] > 0 ? lin : 1 - Math.pow(1 - lin, 1.6); // ground passes decelerate
      const y = a[3] > 0 ? 4 * a[3] * lin * (1 - lin) : 0;
      return [a[1] + (b[1] - a[1]) * p, R + y, a[2] + (b[2] - a[2]) * p];
    }
  }
  const l = keys[keys.length - 1];
  return [l[1], R, l[2]];
};

// camera keys: [t, pos, target, fov]
export type CKey = [number, V3, V3, number?];
export const camAt = (keys: CKey[], t: number) => {
  const lerp3 = (a: V3, b: V3, p: number): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
  if (t <= keys[0][0]) return { pos: keys[0][1], tgt: keys[0][2], fov: keys[0][3] ?? 40 };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b[0]) {
      const p = easeIO((t - a[0]) / (b[0] - a[0]));
      return { pos: lerp3(a[1], b[1], p), tgt: lerp3(a[2], b[2], p), fov: (a[3] ?? 40) + ((b[3] ?? 40) - (a[3] ?? 40)) * p };
    }
  }
  const l = keys[keys.length - 1];
  return { pos: l[1], tgt: l[2], fov: l[3] ?? 40 };
};

// A plain camera for projecting 3D points to screen (tags, overlays).
export const makeCam = (c: { pos: V3; tgt: V3; fov: number }, w: number, h: number) => {
  const cam = new THREE.PerspectiveCamera(c.fov, w / h, 0.1, 2000);
  cam.position.set(...c.pos);
  cam.up.set(0, 1, 0);
  cam.lookAt(...c.tgt);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
};
export const project = (cam: THREE.PerspectiveCamera, p: V3, w: number, h: number) => {
  const v = new THREE.Vector3(...p).project(cam);
  return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, visible: v.z < 1 && v.z > -1 };
};

export const CameraRig: React.FC<{ c: { pos: V3; tgt: V3; fov: number } }> = ({ c }) => {
  const { camera } = useThree();
  const pc = camera as THREE.PerspectiveCamera;
  pc.position.set(...c.pos);
  pc.up.set(0, 1, 0);
  pc.lookAt(...c.tgt);
  if (pc.fov !== c.fov) {
    pc.fov = c.fov;
    pc.updateProjectionMatrix();
  }
  return null;
};

// ---------------------------------------------------------------- geometry builders
// Flat ribbon along a polyline, lying on the ground at height y.
export const ribbonGeo = (pts: V2[], w: number, y = 0.02) => {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0];
    let dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    dx /= l;
    dz /= l;
    const nx = -dz * (w / 2);
    const nz = dx * (w / 2);
    pos.push(pts[i][0] + nx, y, pts[i][1] + nz, pts[i][0] - nx, y, pts[i][1] - nz);
    if (i < pts.length - 1) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
};
const circlePts = (cx: number, cz: number, r: number, a0 = 0, a1 = Math.PI * 2, n = 64): V2[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
  });
// Resample a polyline and cut it to fraction p of its length.
export const cutPath = (pts: V2[], p: number, from = 0): V2[] => {
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    seg.push(l);
    total += l;
  }
  const at = (d: number): V2 => {
    let acc = 0;
    for (let i = 0; i < seg.length; i++) {
      if (acc + seg[i] >= d) {
        const q = seg[i] ? (d - acc) / seg[i] : 0;
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * q, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * q];
      }
      acc += seg[i];
    }
    return pts[pts.length - 1];
  };
  const n = 48;
  const d0 = total * from;
  const d1 = total * p;
  return Array.from({ length: n + 1 }, (_, i) => at(d0 + ((d1 - d0) * i) / n));
};
export const curve = (a: V2, b: V2, bend = 0, n = 32): V2[] => {
  const mx = (a[0] + b[0]) / 2;
  const mz = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l = Math.hypot(dx, dz) || 1;
  const cx = mx + (-dz / l) * bend;
  const cz = mz + (dx / l) * bend;
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cz + t * t * b[1]];
  });
};

// ---------------------------------------------------------------- materials
const glowMat = (color: string, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide });

// ---------------------------------------------------------------- pitch + stadium
const PITCH_LINES: V2[][] = (() => {
  const L: V2[][] = [];
  const X = 34;
  const Z = 52.5;
  L.push([[-X, -Z], [X, -Z], [X, Z], [-X, Z], [-X, -Z]]);
  L.push([[-X, 0], [X, 0]]);
  L.push(circlePts(0, 0, 9.15));
  for (const s of [-1, 1]) {
    L.push([[-20.16, s * Z], [-20.16, s * (Z - 16.5)], [20.16, s * (Z - 16.5)], [20.16, s * Z]]);
    L.push([[-9.16, s * Z], [-9.16, s * (Z - 5.5)], [9.16, s * (Z - 5.5)], [9.16, s * Z]]);
    const spot = s * (Z - 11);
    const half = Math.acos(5.5 / 9.15);
    L.push(s < 0 ? circlePts(0, spot, 9.15, Math.PI / 2 - half, Math.PI / 2 + half, 24) : circlePts(0, spot, 9.15, -Math.PI / 2 - half, -Math.PI / 2 + half, 24));
  }
  return L;
})();

export const Stadium: React.FC = () => {
  const lines = useMemo(() => PITCH_LINES.map((p) => ribbonGeo(p, 0.2, 0.025)), []);
  const glows = useMemo(() => PITCH_LINES.map((p) => ribbonGeo(p, 0.9, 0.02)), []);
  const lineMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#f4fff4", toneMapped: false }), []);
  const lineGlow = useMemo(() => glowMat("#bfffcf", 0.07), []);
  const crowd = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 2600; i++) {
      const side = Math.floor(random(`cs${i}`) * 4);
      const u = random(`cu${i}`);
      const v = random(`cv${i}`);
      const d = 8 + v * 26; // distance beyond the touchline
      const y = 1 + v * 18;
      if (side === 0) pts.push(-46 + u * 92, y, -60 - d * 0.9);
      else if (side === 1) pts.push(-46 + u * 92, y, 60 + d * 0.9);
      else if (side === 2) pts.push(-40 - d, y, -64 + u * 128);
      else pts.push(40 + d, y, -64 + u * 128);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const net = useMemo(() => {
    const segs: number[] = [];
    const W = 3.66;
    const H = 2.44;
    const D = 2.2;
    for (let i = 0; i <= 14; i++) {
      const x = -W + (2 * W * i) / 14;
      segs.push(x, H, 0, x, H * 0.7, D, x, H * 0.7, D, x, 0, D); // roof + back
    }
    for (let j = 0; j <= 6; j++) {
      const y = (H * j) / 6;
      const d = y > H * 0.7 ? D * (1 - (y - H * 0.7) / (H * 0.3)) * 1 : D;
      segs.push(-W, y, d, W, y, d);
    }
    for (let k = 0; k <= 5; k++) {
      const d = (D * k) / 5;
      segs.push(-W, 0, d, -W, H * 0.7 + (H * 0.3 * (D - d)) / D, d, W, 0, d, W, H * 0.7 + (H * 0.3 * (D - d)) / D, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
    return g;
  }, []);
  return (
    <group>
      {/* grass with mowing bands */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 140]} />
        <meshStandardMaterial color="#0c3a1b" roughness={0.95} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -52.5 + 5.25 + i * 10.5]}>
          <planeGeometry args={[68, 5.25]} />
          <meshStandardMaterial color="#10461f" roughness={0.95} />
        </mesh>
      ))}
      {glows.map((g, i) => <mesh key={`g${i}`} geometry={g} material={lineGlow} />)}
      {lines.map((g, i) => <mesh key={i} geometry={g} material={lineMat} />)}
      {/* stands */}
      {[
        { p: [0, 9, -76], r: [0.5, 0, 0], s: [110, 1, 40] },
        { p: [0, 9, 76], r: [-0.5, 0, 0], s: [110, 1, 40] },
        { p: [-58, 9, 0], r: [0, 0, -0.5], s: [40, 1, 150] },
        { p: [58, 9, 0], r: [0, 0, 0.5], s: [40, 1, 150] },
      ].map((st, i) => (
        <mesh key={`s${i}`} position={st.p as V3} rotation={st.r as V3}>
          <boxGeometry args={st.s as V3} />
          <meshStandardMaterial color="#07120b" roughness={1} />
        </mesh>
      ))}
      <points geometry={crowd}>
        <pointsMaterial color="#9fb8a6" size={0.35} transparent opacity={0.35} toneMapped={false} />
      </points>
      {/* goals */}
      {[-1, 1].map((s) => (
        <group key={`goal${s}`} position={[0, 0, s * 52.5]} rotation={[0, s < 0 ? Math.PI : 0, 0]}>
          {[-3.66, 3.66].map((x) => (
            <mesh key={x} position={[x, 1.22, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 2.44, 10]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
          ))}
          <mesh position={[0, 2.44, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 7.32, 10]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <lineSegments geometry={net}>
            <lineBasicMaterial color="#ffffff" transparent opacity={0.4} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- players
export type Kit = { shirt: string; sleeve: string; shorts: string; socks: string; skin?: string; hair?: string };
export const KITS: Record<string, Kit> = {
  B: { shirt: "#1d5fe0", sleeve: "#ffffff", shorts: "#1d5fe0", socks: "#ffffff" },
  BGK: { shirt: "#e8d21d", sleeve: "#e8d21d", shorts: "#1a1a1a", socks: "#e8d21d" },
  R: { shirt: "#d8202e", sleeve: "#d8202e", shorts: "#ffffff", socks: "#d8202e" },
  RGK: { shirt: "#7b3fe4", sleeve: "#7b3fe4", shorts: "#2a2a2a", socks: "#7b3fe4" },
};
const SKINS = ["#e9b98f", "#c68b5e", "#8d5a3b", "#f1c9a5", "#a8704a"];
const HAIRS = ["#1d140e", "#3b2414", "#0c0c0c", "#6b4a22", "#2a1c10"];

export const Player: React.FC<{ x: number; z: number; heading: number; phase: number; stride: number; kit: Kit; seed: string; scale?: number }> = ({ x, z, heading, phase, stride, kit, seed, scale = 1.35 }) => {
  const skin = kit.skin ?? SKINS[Math.floor(random(`sk${seed}`) * SKINS.length)];
  const hair = kit.hair ?? HAIRS[Math.floor(random(`hr${seed}`) * HAIRS.length)];
  const sw = Math.sin(phase) * 0.75 * stride;
  const bob = Math.abs(Math.cos(phase)) * 0.05 * stride;
  const lean = 0.18 * stride;
  return (
    <group position={[x, 0, z]} rotation={[0, heading, 0]} scale={scale}>
      {/* blob shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <group position={[0, bob, 0]} rotation={[lean, 0, 0]}>
        {/* legs */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.12, 0.9, 0]} rotation={[s * sw, 0, 0]}>
            <mesh position={[0, -0.24, 0]}>
              <cylinderGeometry args={[0.085, 0.075, 0.42, 8]} />
              <meshStandardMaterial color={skin} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.64, 0]}>
              <cylinderGeometry args={[0.075, 0.065, 0.42, 8]} />
              <meshStandardMaterial color={kit.socks} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.86, 0.06]}>
              <boxGeometry args={[0.12, 0.08, 0.26]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
          </group>
        ))}
        {/* shorts */}
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[0.44, 0.3, 0.26]} />
          <meshStandardMaterial color={kit.shorts} roughness={0.8} />
        </mesh>
        {/* torso */}
        <mesh position={[0, 1.36, 0]}>
          <capsuleGeometry args={[0.2, 0.36, 6, 12]} />
          <meshStandardMaterial color={kit.shirt} roughness={0.6} />
        </mesh>
        {/* arms */}
        {[-1, 1].map((s) => (
          <group key={`a${s}`} position={[s * 0.27, 1.58, 0]} rotation={[-s * sw * 0.9, 0, s * 0.12]}>
            <mesh position={[0, -0.17, 0]}>
              <cylinderGeometry args={[0.07, 0.065, 0.3, 8]} />
              <meshStandardMaterial color={kit.sleeve} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.44, 0]}>
              <cylinderGeometry args={[0.055, 0.05, 0.28, 8]} />
              <meshStandardMaterial color={skin} roughness={0.7} />
            </mesh>
          </group>
        ))}
        {/* head + hair */}
        <mesh position={[0, 1.86, 0]}>
          <sphereGeometry args={[0.14, 16, 12]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.92, -0.02]} scale={[1.05, 0.75, 1.05]}>
          <sphereGeometry args={[0.142, 16, 12]} />
          <meshStandardMaterial color={hair} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

export const Ball: React.FC<{ p: V3; spin: number }> = ({ p, spin }) => (
  <group position={p}>
    <mesh rotation={[spin, spin * 0.6, 0]}>
      <icosahedronGeometry args={[0.15, 1]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} flatShading />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -p[1] + 0.03, 0]}>
      <circleGeometry args={[0.16, 16]} />
      <meshBasicMaterial color="#000" transparent opacity={0.4} depthWrite={false} />
    </mesh>
  </group>
);

// ---------------------------------------------------------------- annotations
// Glowing ring on the ground (reference: lime/red rings under players).
export const Ring: React.FC<{ x: number; z: number; color: string; p: number; r?: number; t: number }> = ({ x, z, color, p, r = 1.3, t }) => {
  if (p <= 0) return null;
  const s = 0.4 + 0.6 * smooth(p);
  const pulse = 1 + Math.sin(t * 5) * 0.04;
  return (
    <group position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]} scale={s * pulse}>
      <mesh material={glowMat(color, 0.18 * p)}>
        <ringGeometry args={[r * 0.6, r * 1.7, 48]} />
      </mesh>
      <mesh material={glowMat(color, 0.95 * p)}>
        <ringGeometry args={[r * 0.88, r, 48]} />
      </mesh>
      <mesh material={glowMat(color, 0.6 * p)}>
        <ringGeometry args={[r * 1.18, r * 1.24, 48]} />
      </mesh>
    </group>
  );
};

// Neon line along the ground. draw 0..1, optional dashes + arrow head.
export const NeonLine: React.FC<{ pts: V2[]; draw: number; color: string; w?: number; dashed?: boolean; arrow?: boolean; fade?: number; y?: number }> = ({ pts, draw, color, w = 0.32, dashed, arrow = true, fade = 1, y = 0.05 }) => {
  if (draw <= 0 || fade <= 0) return null;
  const path = cutPath(pts, draw);
  const parts: V2[][] = [];
  if (dashed) {
    const n = 24;
    const cut = cutPath(pts, draw);
    for (let i = 0; i < n; i += 2) parts.push(cut.slice(Math.floor((i * cut.length) / n), Math.floor(((i + 1) * cut.length) / n) + 1));
  } else parts.push(path);
  const end = path[path.length - 1];
  const prev = path[Math.max(0, path.length - 3)];
  const ang = Math.atan2(end[0] - prev[0], end[1] - prev[1]);
  return (
    <group>
      {parts.filter((p) => p.length > 1).map((p, i) => (
        <group key={i}>
          <mesh geometry={ribbonGeo(p, w * 3.2, y - 0.01)} material={glowMat(color, 0.22 * fade)} />
          <mesh geometry={ribbonGeo(p, w, y)} material={glowMat(color, 1 * fade)} />
        </group>
      ))}
      {arrow && draw > 0.05 && (
        <group position={[end[0], y + 0.01, end[1]]} rotation={[0, ang, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={glowMat(color, fade)}>
            <shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-w * 2.6, 0), new THREE.Vector2(w * 2.6, 0), new THREE.Vector2(0, -w * 4.5)])]} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// Aerial pass: glowing tube along the ball's arc.
export const ArcLine: React.FC<{ a: V2; b: V2; h: number; draw: number; color: string; fade?: number }> = ({ a, b, h, draw, color, fade = 1 }) => {
  if (draw <= 0.01 || fade <= 0) return null;
  const n = 40;
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const q = (i / n) * draw;
    return new THREE.Vector3(a[0] + (b[0] - a[0]) * q, 0.12 + 4 * h * q * (1 - q), a[1] + (b[1] - a[1]) * q);
  });
  const c = new THREE.CatmullRomCurve3(pts);
  return (
    <group>
      <mesh material={glowMat(color, 0.25 * fade)}>
        <tubeGeometry args={[c, 60, 0.32, 8, false]} />
      </mesh>
      <mesh material={glowMat(color, 1 * fade)}>
        <tubeGeometry args={[c, 60, 0.1, 8, false]} />
      </mesh>
    </group>
  );
};

// Translucent zone (polygon on the ground).
export const Zone: React.FC<{ pts: V2[]; color: string; p: number; opacity?: number }> = ({ pts, color, p, opacity = 0.22 }) => {
  if (p <= 0) return null;
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]} material={glowMat(color, opacity * p)}>
      <shapeGeometry args={[shape]} />
    </mesh>
  );
};

// Lane carpet with moving chevrons (reference: striped lane to the receiver).
export const Lane: React.FC<{ a: V2; b: V2; w: number; color: string; p: number; t: number }> = ({ a, b, w, color, p, t }) => {
  if (p <= 0) return null;
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const L = Math.hypot(dx, dz);
  const ang = Math.atan2(dx, dz);
  const len = L * smooth(p);
  const n = Math.floor(len / 2.4);
  return (
    <group position={[a[0], 0.04, a[1]]} rotation={[0, ang, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, len / 2]} material={glowMat(color, 0.12)}>
        <planeGeometry args={[w, len]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[(s * w) / 2, 0.005, len / 2]} material={glowMat(color, 0.8)}>
          <planeGeometry args={[0.16, len]} />
        </mesh>
      ))}
      {Array.from({ length: n }).map((_, i) => {
        const zz = ((i * 2.4 + t * 6) % Math.max(2.4, len));
        return (
          <group key={i} position={[0, 0.01, zz]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} material={glowMat(color, 0.45)}>
              <shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-w * 0.38, 0), new THREE.Vector2(0, -0.9), new THREE.Vector2(w * 0.38, 0), new THREE.Vector2(w * 0.38, 0.45), new THREE.Vector2(0, -0.45), new THREE.Vector2(-w * 0.38, 0.45)])]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
