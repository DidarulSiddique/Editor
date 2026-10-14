// Design tokens. A project picks (or extends) one theme; components take
// colours/fonts from props so the same kit can look completely different.
// Load the matching @fontsource CSS in the project entry file.

export type Theme = {
  name: string;
  fonts: { display: string; ui: string; serif: string };
  bg: string;
  ink: string;
  accents: string[]; // one per section/concept, in order
  footageFilter: string; // base grade for footage (sharpen + tone)
};

export const THEMES: Record<string, Theme> = {
  // Dark broadcast/anime-explainer look (bible §Looks A): neon accents, glow.
  neon: {
    name: "neon",
    fonts: { display: "Anton, sans-serif", ui: "Inter, sans-serif", serif: "'Instrument Serif', serif" },
    bg: "#07070c",
    ink: "#ffffff",
    accents: ["#c6ff3d", "#a46bff", "#2fe6ff", "#ffb21f", "#ff3d8e", "#ff6a2b"],
    footageFilter: "url(#mk-sharpen) contrast(1.1) saturate(1.18) brightness(1.03)",
  },
  // Editorial / tribute: restrained, gold + red, serif accents (bible §Looks B).
  editorial: {
    name: "editorial",
    fonts: { display: "Anton, sans-serif", ui: "Inter, sans-serif", serif: "'Instrument Serif', serif" },
    bg: "#07060d",
    ink: "#f4f1ea",
    accents: ["#ff2e4d", "#ffc84a", "#7b5cff"],
    footageFilter: "url(#mk-sharpen) contrast(1.08) saturate(1.12) brightness(1.04)",
  },
  // High-key paper / watercolour (bible §Looks C).
  paper: {
    name: "paper",
    fonts: { display: "Anton, sans-serif", ui: "Inter, sans-serif", serif: "'Instrument Serif', serif" },
    bg: "#fbfaf8",
    ink: "#2a2626",
    accents: ["#c42a42", "#1d7a78", "#e6bd14", "#2a6fb8"],
    footageFilter: "url(#mk-sharpen) contrast(1.02) saturate(0.9) brightness(1.08)",
  },
};

export const glow = (c: string, k = 1) => `0 0 ${10 * k}px ${c}, 0 0 ${30 * k}px ${c}aa, 0 0 ${70 * k}px ${c}66`;
