# Cleopatra v4: "The queen who had to learn Egyptian"

This is a rebuild of `edits/cleopatra` (v3.1), aimed at the 9 new @ricksclip-style references from 2026-11-11.
It runs 9:16 (1080×1920) at 30 fps and lasts about 65 s.

## What the references do that v3 did not

I measured this from the 9 references against `cleopatra-v3-share.mp4`.

| | References | Cleopatra v3 |
|---|---|---|
| Story | One protagonist doing something that sounds wrong. "They buried a man alive with a bell…", "He saw gaps into a railroad…", "He poured cooking oil into the sea…" | A fact explainer ("Egypt's most famous pharaoh wasn't Egyptian") |
| Cutting | Almost no hard cuts (1–2 per video at a 0.25 scene threshold). Changes are 10–30-frame camera flights, push-ins through windows, follow-the-object moves and 4–6-frame dissolves. | 31 hard cuts, 2.2 s per shot |
| Motion | Camera and characters always moving (median frame diff 4.4–4.9) | Many static holds (median diff 2.7) |
| Look | Painted, ornamented sets with depth of field on every close shot, warm key + cool fill, rim light, glows, god rays, haze, dust | Flat untextured blocks (e.g. the balcony tower), everything sharp, flat light |
| Cast | Bean heads shaded top to bottom with thick ink, stick limbs, eyebrows, sweat drops and popping eyes on reactions | Flat fills, white "bowling-pin" robes |
| Text | One word at a time, white heavy type with a thin dark outline at ~70% height, no title box or name tags | Title box, yellow tags, stamps |

## v4d narration (current)
The user supplied their own ElevenLabs read ("Jon", 75.7 s), and it replaces the vidIQ "Chris" voice.
- **Fitting:** `fit.py` caps pauses at 0.30 s and speeds the voice up by 1.03–1.27× (mean 1.12×), so each shot's first word lands
  within 0.4 s of its cut. The picture is unchanged.
- **Ending:** the read stops at "…in gold." (no closing line), so `script.txt` drops line 10 and the loop shot becomes a 66-frame
  wordless flip (Egyptian → Greek look, burst) ending on the opening framing. The video is now 65.3 s (1960 frames).
- **Files:** the v4b voice, words and script are kept in `work/` (`voice_v4b.wav`, `words_v4b.json`, `script_v4b.txt`).

## Script (v4b, ≈67 s; the main point is that she was not Egyptian)

1. The most famous Egyptian queen in history… was not Egyptian. At least, not the way you think.
2. You see, her family was Greek. They had ruled Egypt for two hundred and fifty years, and no king before her is known to have learned Egyptian.
3. Imagine you're a farmer on the Nile. You walk into the palace to beg for help… and your pharaoh needs a translator just to understand you.
4. How is that possible?
5. It starts with a stolen body. When Alexander the Great dies, his general Ptolemy hijacks the funeral cart… and drives Alexander's corpse all the way to Egypt. With the most famous corpse in the world as his trophy, he makes himself king.
6. His family rules from Alexandria, a Greek city. They speak Greek, they marry their own siblings, and they never bother with Egyptian.
7. It's like a landlord who owns your building for two hundred and fifty years… and never learns your name.
8. Then Cleopatra the Seventh is born, and she does the homework. She learns Egyptian. She dresses as a pharaoh. She calls herself the new Isis. And she talks to her people without a translator.
9. Egypt never forgot it. Four hundred years after she died, a scribe at an Egyptian temple was still covering her image… in gold.
10. Not bad for an Egyptian queen… who was not Egyptian. *(this loops into line 1)*

**v4b opening shots.**
- **Throne (0–2.2 s):** low-angle push in on the throne.
- **"was not Egyptian" (2.2–3.4 s):** close-up identity flip from her Egyptian to her Greek look, with a burst.
- **Smirk (3.4–4.8 s):** a smirk, then she flips back.
- **"her family was Greek" (4.8–6.4 s):** the Greek busts.
- **"ruled Egypt for 250 years" (6.4–8.7 s):** time-lapse of six Greek kings swapping on the throne.
- **"no king before her…" (8.7–11.6 s):** the busts ask "?".
- **Ending (63.1–67.2 s):** back on the throne. On "was not Egyptian" she flips to her Greek look, ending on the opening framing so the video loops.

**Accuracy notes**
- "No king before her is known to have learned it" comes from Plutarch (*Antony* 27).
- Ptolemaic rule dates from 323 BC (satrap) / 305 BC (king). Cleopatra was born in 69 BC, which gives the ~250 years.
- Ptolemy diverted Alexander's funeral cortege to Egypt in 321 BC.
- Several Ptolemies married their siblings, starting with Ptolemy II and Arsinoe II.
- Cleopatra appeared in public as the New Isis (Plutarch). She spoke with Egyptians without an interpreter (Plutarch).
- The scribe is Petesenufe, at Philae in AD 373: "I overlaid the figure of Cleopatra with gold". That is ~400 years after her death in 30 BC.
- "Greek queen" means her dynasty (Macedonian Greek). As LESSONS requires, the script never says "no Egyptian blood".

## Shot plan (31 shots, continuous camera, no static holds)

Transitions use the reference grammar: **F** = camera flight or match-move into the next set, **D** = 5-frame dissolve,
**W** = whip pan with motion blur. Every close shot has depth of field.

| # | Time | Line | What we see | In |
|---|---|---|---|---|
| 1 | 0.0–1.8 | The queen of Egypt | Low angle pushing up at Cleopatra on a gilded throne. God rays, a crown glint. | — |
| 2 | 1.8–3.4 | had to learn Egyptian… | Whip down to her study desk: hieroglyph flash cards, a squint, a sweat drop | W |
| 3 | 3.4–5.0 | like a foreign language. | Close-up as she flips a card. Wrong-answer buzz, a red ✗ pops, she slumps. | F |
| 4 | 5.0–7.5 | her family ruled… 250 years | Crane along a portrait wall of identical Ptolemies, all holding Greek scrolls | F |
| 5 | 7.5–10 | no king before her… learned it | The portraits shrug in turn. Speech bubbles hold Greek letters ΑΒΓ. | D |
| 6 | 10–12.5 | Imagine you're a farmer on the Nile | Sunrise. Low flight over the river (boats, ibis, palms) landing on the farmer with his hoe. | F |
| 7 | 12.5–15 | walk into the palace to beg for help… | Low angle: the tiny farmer walks through giant gilded doors between huge columns | F |
| 8 | 15–17.5 | your pharaoh needs a translator | The king leans to a whispering translator, blank-faced, with a "?" bubble | D |
| 9 | 17.5–19 | just to understand you. | Farmer close-up: his eyes pop and his jaw drops | W |
| 10 | 19–21 | How is that possible? | Fast pull back out of the palace window to the city at dusk | F |
| 11 | 21–23 | It starts with a stolen body. | Night, a desert road. Lantern light on a golden funeral cart. Slow dolly, deep blue. | D |
| 12 | 23–25.5 | When Alexander the Great dies, | Close-up of the gold sarcophagus: laurel, candles, dust motes | F |
| 13 | 25.5–27.5 | Ptolemy hijacks the funeral cart… | Ptolemy leaps on, shoves the driver off and grins. Speed lines. | W |
| 14 | 27.5–30 | drives Alexander's corpse… to Egypt | Tracking beside the galloping cart while generals chase with torches. A dust trail, and pyramids rise at dawn. | F |
| 15 | 30–33.5 | the most famous corpse… makes himself king | Ptolemy crowned. The gold coffin sits on display behind him and the courtiers clap. | D |
| 16 | 33.5–35.5 | rules from Alexandria, a Greek city | Aerial over Alexandria: the Pharos, the harbour, Greek temples | F |
| 17 | 35.5–37 | They speak Greek, | Banquet. The royals chatter in Greek-letter bubbles. | W |
| 18 | 37–38.5 | they marry their own siblings, | A wedding of two identical faces. The guests sweat. | W |
| 19 | 38.5–41 | they never bother with Egyptian | A servant speaks (hieroglyph bubble). The royals ignore him and sip wine. | D |
| 20 | 41–43 | a landlord who owns your building… | Modern apartment hallway. Landlord with keys while calendar pages fly and cobwebs grow. | D |
| 21 | 43–45.5 | …and never learns your name. | Landlord: "Hey… you." The tenant stares, deadpan. | W |
| 22 | 45.5–47.5 | Then Cleopatra the Seventh is born, | Golden cradle in a sunbeam, the baby's eyes open, sparkle | D |
| 23 | 47.5–49 | and she does the homework. | Back at the hook desk, time-lapse: scroll stacks grow and the candle burns down | F |
| 24 | 49–50.5 | She learns Egyptian. | The card is right this time: a ding, a sparkle, a grin | W |
| 25 | 50.5–52 | She dresses as a pharaoh. | 360° orbit costume change (Greek robe → crown and collar) with a flash | F |
| 26 | 52–53.5 | She calls herself the new Isis. | Temple: she steps in front of a giant Isis statue and matches its pose. Wings of light. | F |
| 27 | 53.5–56 | talks to her people without a translator | The farmer again. She speaks to him directly, the translator is out of a job, the farmer's eyes sparkle. | D |
| 28 | 56–57.5 | Egypt never forgot it. | Balcony over a huge roaring crowd, petals, sunlight | F |
| 29 | 57.5–60 | Four hundred years after she died, | Night temple time-lapse: stars wheel, stone weathers. A lone old scribe climbs a ladder with a lamp. | D |
| 30 | 60–62.5 | a scribe… covering her image… in gold. | **Payoff:** his brush touches a giant relief of Cleopatra and the gold floods the whole wall. Light rays. The camera pulls far back to show the temple glowing in the dark. | F |
| 31 | 62.5–65.5 | Not bad for a Greek queen… foreign language. | Back at her desk. She holds up a card and winks. The last frame matches shot 2 so the loop is seamless. | F |

**Sets.** These are reused from v3 and upgraded:
- throne hall
- library/desk
- busts → portrait gallery
- Alexandria
- balcony crowd
- cradle

These are new:
- Nile farm at sunrise
- night desert road with the funeral cart
- banquet/wedding dressing in the hall
- modern apartment hallway
- Isis temple, by day and at night with the relief wall

**Captions.** One word at a time, white heavy type with a thin dark outline, centred at y≈1340, inside the safe frame.
There is no title box. Every character stays inside x 110–970, y 250–1670 except declared close-ups.

## Audio and credits (balance 170)
- **Narration:** vidIQ voiceover, ≈1,050 characters → **56 credits** (28 per 1,000 started).
  - Recommended voice: **Chris – Charming, Down-to-Earth** (casual American storyteller, closest to the references' narrator).
  - Alternatives: Liam (energetic) or George (warm British storyteller).
- **Music:** vidIQ generated track, mysterious → playful → epic swell at the payoff → **25 credits**.
- **Total ≈ 81 credits.** That leaves ~89, enough for one narration retake if a line needs fixing.
- SFX are synthesized and duck under the voice, per LESSONS.
