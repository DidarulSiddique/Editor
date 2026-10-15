// GALLERY EDIT — built on R03 ("Love Me", framez_00). Everything a new
// edit changes lives here. Stand-ins are your earlier Messi/dribbling
// assets; PREVIEW shows the slot tags on screen.

export const PREVIEW = false;

export const MUSIC = { file: "love-me.wav" }; // reference song (0–28.5 s + 47.4–60.4 s), local timing only

export const TEXT = {
  words: { a: "LOVE", b: "ME", c: "OH", d: "BABY", e: "YEA" }, // lyric words (match the song)
  end: "THE ART OF FOOTBALL",
  handle: "BRIGHTONBOYEDITS",
};

// Hero cards: photo + cut-out (the template puts words behind the player).
// ytop = top of the subject in the cut-out (0–1), cx = subject centre in the
// cut-out (0–1), x = where that centre sits on screen, scale = height vs frame.
export type Hero = { id: string; photo: string; cut: string; ytop: number; cx: number; ar: number; x: number; scale: number; caption: string; need: string };
export const HEROES: Hero[] = [
  { id: "PHOTO 01", photo: "m4c4f489e.png", cut: "m4c4f489e-cut.png", ytop: 0.1, cx: 0.5, ar: 2118 / 1898, x: 1180, scale: 0.92, caption: "COPA AMÉRICA · 2021 · 2024", need: "Hero portrait 1" },
  { id: "PHOTO 02", photo: "m072c11e6.png", cut: "m072c11e6-cut.png", ytop: 0.02, cx: 0.47, ar: 1604 / 2360, x: 720, scale: 1.15, caption: "FIFA CLUB WORLD CUP · 2009", need: "Hero portrait 2" },
  { id: "PHOTO 03", photo: "m4ff1d30b.png", cut: "m4ff1d30b-cut.png", ytop: 0.05, cx: 0.52, ar: 1568 / 1552, x: 1130, scale: 0.95, caption: "CHAMPIONS LEAGUE · WEMBLEY 2011", need: "Hero portrait 3" },
  { id: "PHOTO 04", photo: "m283f87e4.png", cut: "m283f87e4-cut.png", ytop: 0.0, cx: 0.5, ar: 1312 / 2026, x: 1010, scale: 1.12, caption: "INTER MIAMI", need: "Hero portrait 4" },
];
export const YEA_HERO: Hero = { id: "PHOTO 05", photo: "mec553ca0.png", cut: "mec553ca0-cut.png", ytop: 0.25, cx: 0.5, ar: 1038 / 2342, x: 960, scale: 1.25, caption: "", need: "Player standing tall" };

// Clips for the mid section (16:9).
export type Clip = { id: string; file: string; start: number; need: string };
export const CLIPS: Clip[] = [
  { id: "CLIP 01", file: "r-clip1.mp4", start: 0.0, need: "Close-up / walk-back" },
  { id: "CLIP 02", file: "r-clip2.mp4", start: 0.0, need: "Dribble" },
  { id: "CLIP 03", file: "r-clip3.mp4", start: 0.0, need: "Dribble / celebration" },
];

// Gallery pool: landscape stills (frames from the clips + the photos).
export const GALLERY = [
  "rg-01.jpg", "m2e4a1fb5.png", "rg-02.jpg", "m92d09410.png", "rg-03.jpg", "m2455458b.png", "rg-04.jpg", "m4ff1d30b.png", "rg-05.jpg", "m0fd532a8.png",
  "rg-06.jpg", "m4c4f489e.png", "rg-07.jpg", "m19b181bc.png", "rg-08.jpg", "m283f87e4.png", "rg-09.jpg", "m072c11e6.png", "rg-10.jpg", "rg-11.jpg",
];
export const STRIP = ["m19b181bc.png", "m3ca03216.png", "m0fd532a8.png", "m2e4a1fb5.png"];
export const OH_PHOTO = "m2455458b.png";
export const FRAME_PHOTO = "m92d09410.png"; // landscape: the 5 Ballons d'Or in the gilt frame
export const STAR_CARDS = ["me6cd394b.png", "m072c11e6.png"];
