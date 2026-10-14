import React from "react";

// SVG filter definitions every component relies on. Render ONCE near the
// root of a composition. IDs are prefixed "mk-".
//   url(#mk-sharpen)       3x3 unsharp, safe on 2x-upscaled footage
//   url(#mk-rgb6|12)       RGB channel split (impact frames only)
//   url(#mk-bx8|20|40|70)  horizontal-only motion blur (whips only)
//   url(#mk-by8|20|40|70)  vertical-only motion blur
export const KitDefs: React.FC = () => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <defs>
      <filter id="mk-sharpen">
        <feConvolveMatrix order="3" kernelMatrix="0 -0.35 0 -0.35 2.4 -0.35 0 -0.35 0" preserveAlpha="true" />
      </filter>
      {[6, 12].map((d) => (
        <filter id={`mk-rgb${d}`} key={d} colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={d} result="ro" />
          <feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="b" dx={-d} result="bo" />
          <feBlend in="ro" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="bo" mode="screen" />
        </filter>
      ))}
      {[8, 20, 40, 70].map((d) => (
        <React.Fragment key={d}>
          <filter id={`mk-bx${d}`} x="-10%" width="120%">
            <feGaussianBlur stdDeviation={`${d} 0`} />
          </filter>
          <filter id={`mk-by${d}`} y="-10%" height="120%">
            <feGaussianBlur stdDeviation={`0 ${d}`} />
          </filter>
        </React.Fragment>
      ))}
    </defs>
  </svg>
);

// Pick the nearest directional-blur filter for an amount in px.
export const motionBlur = (amount: number, axis: "x" | "y" = "x") => {
  if (amount < 3) return undefined;
  const d = [8, 20, 40, 70].reduce((a, c) => (Math.abs(c - amount) < Math.abs(a - amount) ? c : a));
  return `url(#mk-b${axis}${d})`;
};
