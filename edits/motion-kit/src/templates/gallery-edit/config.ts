// GALLERY EDIT — built on R03 ("Love Me", framez_00). Everything a new
// edit changes lives here. Stand-ins are your earlier Messi/dribbling
// assets; PREVIEW shows the slot tags on screen.

export const PREVIEW = true;

export const MUSIC = { file: "love-me.wav" }; // reference song (0–28.5 s + 47.4–60.4 s), local timing only

export const TEXT = {
  words: { a: "LOVE", b: "ME", c: "OH", d: "BABY", e: "YEA" }, // lyric words (match the song)
  end: "THE ART OF FOOTBALL",
  handle: "BRIGHTONBOYEDITS",
};

// Hero cards: photo + cut-out (the template puts words behind the player).
// ytop = where the head starts in the cut-out (0–1), x = subject centre on screen.
export type Hero = { id: string; photo: string; cut: string; ytop: number; ar: number; x: number; caption: string; need: string };
export const HEROES: Hero[] = [
  { id: "PHOTO 01", photo: "p-785a0283.png", cut: "p-785a0283-cut.png", ytop: 0.37, ar: 1332 / 2194, x: 1150, caption: "FC BARCELONA · 2004 — 2021", need: "Hero portrait 1 — waist-up, clean background" },
  { id: "PHOTO 02", photo: "p-1fa6cf3b.png", cut: "p-1fa6cf3b-cut.png", ytop: 0.02, ar: 1298 / 1700, x: 760, caption: "WORLD CHAMPION · QATAR 2022", need: "Hero portrait 2" },
  { id: "PHOTO 03", photo: "p-12fbf6b3.png", cut: "p-12fbf6b3-cut.png", ytop: 0.11, ar: 1056 / 2324, x: 1140, caption: "COPA AMÉRICA CHAMPION", need: "Hero portrait 3" },
  { id: "PHOTO 04", photo: "p-17d36584.png", cut: "p-17d36584-cut.png", ytop: 0.15, ar: 1168 / 2092, x: 780, caption: "THE NUMBER 10", need: "Hero portrait 4" },
];
export const YEA_HERO: Hero = { id: "PHOTO 05", photo: "p-d923c80d.png", cut: "p-d923c80d-cut.png", ytop: 0.2, ar: 1278 / 2368, x: 960, caption: "", need: "Photo with the player standing tall (giant word goes behind)" };

// Clips for the mid section (16:9).
export type Clip = { id: string; file: string; start: number; need: string };
export const CLIPS: Clip[] = [
  { id: "CLIP 01", file: "s-mx1.mp4", start: 0.0, need: "Walk-out / close-up, 2 s" },
  { id: "CLIP 02", file: "s-st1.mp4", start: 0.2, need: "Skill or goal, 2 s" },
  { id: "CLIP 03", file: "s-fs1.mp4", start: 0.0, need: "Celebration or close-up, 2 s" },
];

// Gallery pool: any landscape stills (photos or frames from clips). Used on
// the 3D card corridor, the tile wall, the framed-photo wall and the strip.
export const GALLERY = Array.from({ length: 19 }, (_, i) => `g-${String(i + 1).padStart(2, "0")}.jpg`);
export const STRIP = ["p-1ffe19d4.png", "p-d735f99e.png", "p-1fa6cf3b.png", "p-12fbf6b3.png"]; // 4 portraits for the break-apart strip
export const FRAME_PHOTO = "p-785a0283.png"; // the hero in the gilt frame
export const STAR_CARDS = ["p-17d36584.png", "p-1ffe19d4.png"]; // slanted cards in the starfield
