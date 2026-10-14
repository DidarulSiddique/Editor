// PLAYER EDIT template — everything a new edit changes lives in this file.
// Swap the `file` of each slot for the real clip, set the text, set the
// song's drop/tempo, render. Timings are in BEATS from the drop so the edit
// re-times itself to any song.

export const PREVIEW = true; // shows slot tags on screen; set false for the real render

// ---------------------------------------------------------------- music
export const MUSIC = {
  file: "s-music.wav", // stand-in: dribbling instrumental
  offset: 14.0, // seconds into the file where the edit starts
  drop: 10.17, // edit time of the drop (first montage cut)
  beat: 0.3715, // seconds per beat (161.5 BPM)
};

// ---------------------------------------------------------------- text
export const TEXT = {
  kicker: "A BREAKDOWN OF",
  first: "LIONEL",
  last: "MESSI",
  number: "10",
  word: "GENIUS", // gold serif slam on the name card
  quote: [
    { at: 0.25, text: "Some players play the game." },
    { at: 1.75, text: "*Few* *change* it." },
  ],
  stat: { label: "GOALS FOR BARCELONA", value: 672, suffix: "", caption: "2004 — 2021 · 778 APPEARANCES" },
  montageWords: ["VISION", "BALANCE", "TOUCH", "NERVE", "FLAIR", "MAGIC"],
  end: "THE ART OF FOOTBALL",
  handle: "BRIGHTONBOYEDITS",
};

// ---------------------------------------------------------------- palette
export const COLORS = { gold: "#f4c542", red: "#ff2e4d", sky: "#5fd0ff", violet: "#8b6bff", ink: "#f6f3ec", bg: "#06060a" };

// ---------------------------------------------------------------- slots
// focus: [x, y] of the subject in the 16:9 source (0–1), used for the
// vertical crop. start: source second the slot begins at.
export type ClipSlot = { id: string; file: string; start: number; focus: [number, number]; need: string; rate?: number };
export type PhotoSlot = { id: string; file: string; cut?: string; need: string };

export const CLIPS: Record<string, ClipSlot> = {
  hook: { id: "CLIP 01", file: "s-mx1.mp4", start: 0.0, focus: [0.62, 0.45], need: "Cold open — a calm, iconic moment (walking out, looking up, celebration). 3 s, slow is fine." },
  quote: { id: "CLIP 02", file: "s-bf3.mp4", start: 0.2, focus: [0.5, 0.55], need: "Quiet build — slow-motion or emotional shot for the quote. 4 s." },
  m1: { id: "CLIP 03", file: "s-st1.mp4", start: 0.0, focus: [0.55, 0.6], need: "Montage 1 — best dribble/skill, close camera. 2 s." },
  m2: { id: "CLIP 04", file: "s-fs1.mp4", start: 0.0, focus: [0.42, 0.62], need: "Montage 2 — a move that freezes well (ball visible, defender near). 2.5 s. Gets the freeze-frame annotation." },
  m3: { id: "CLIP 05", file: "s-el1.mp4", start: 0.0, focus: [0.62, 0.62], need: "Montage 3 — any skill/goal, wide or close. 2 s." },
  m4: { id: "CLIP 06", file: "s-ro1.mp4", start: 0.3, focus: [0.45, 0.6], need: "Montage 4 — close-up action. 2 s. Gets the colour-flash treatment." },
  m5: { id: "CLIP 07", file: "s-cq1.mp4", start: 0.2, focus: [0.3, 0.7], need: "Montage 5 — tight feet/ball shot. 2 s." },
  m6: { id: "CLIP 08", file: "s-mx2.mp4", start: 0.0, focus: [0.5, 0.6], need: "Montage 6 — goal or celebration to close the run. 2 s." },
  stat: { id: "CLIP 09", file: "s-bf1.mp4", start: 0.6, focus: [0.45, 0.55], need: "Stat backdrop — any clean 3 s shot of the player (darkened behind a number)." },
};

export const PHOTOS: PhotoSlot[] = [
  { id: "PHOTO 01", file: "p-785a0283.png", cut: "p-785a0283-cut.png", need: "Hero portrait for the name card — waist-up, plain-ish background (it gets cut out). Portrait orientation, 1000 px+ tall." },
  { id: "PHOTO 02", file: "p-1fa6cf3b.png", need: "Photo wall 1 — trophy / iconic moment." },
  { id: "PHOTO 03", file: "p-1ffe19d4.png", need: "Photo wall 2." },
  { id: "PHOTO 04", file: "p-17d36584.png", need: "Photo wall 3." },
  { id: "PHOTO 05", file: "p-12fbf6b3.png", need: "Photo wall 4." },
  { id: "PHOTO 06", file: "p-d923c80d.png", need: "Photo wall 5." },
  { id: "PHOTO 07", file: "p-d735f99e.png", need: "Photo wall 6." },
];
