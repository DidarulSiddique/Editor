#!/usr/bin/env python3
"""Captions for the Cleopatra short: one word at a time (gold on the key words), a title box,
name tags and stamps — all inside the phone/iPad safe frame.  usage: python3 subs.py > subs.ass"""
from lines import LINES
GOLD = {"egyptian", "wasn't", "greek", "egypt", "macedonia", "macedonian", "ptolemy", "alexander", "cleopatra", "isis", "pharaoh", "real", "cake",
        "seventh", "alexandria", "bloodline", "yes", "absolutely", "egyptian.", "greek."}
segs = [tuple(map(float, l.split())) for l in open("segs.txt")]
assert len(segs) == len(LINES), (len(segs), len(LINES))
ts = lambda t: f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"
import json
RT = json.load(open("retime.json")); MAP = RT["map"]; END = RT["total"] / 30
def toNew(f):  # v1 frame -> v2 frame (slower narration); tags/stamps below are written on the v1 timeline
    for (o0, n0), (o1, n1) in zip(MAP, MAP[1:]):
        if f <= o1: return n0 + (n1 - n0) * (f - o0) / (o1 - o0)
    return MAP[-1][1]
F = lambda f: toNew(f) / 30
print("""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: W,Bricolage Grotesque ExtraBold,108,&H00FFFFFF,&H00FFFFFF,&H00180F14,&H90000000,0,0,0,0,100,100,0,0,1,10,5,2,60,60,560,1
Style: T,Bricolage Grotesque ExtraBold,56,&H00141014,&H00141014,&H00FFFFFF,&H64000000,0,0,0,0,100,100,0,0,3,16,0,8,60,60,300,1
Style: N,Bricolage Grotesque ExtraBold,50,&H00141014,&H00141014,&H0031B5E8,&H64000000,0,0,0,0,100,100,1,0,3,12,0,5,0,0,0,1
Style: S,Bricolage Grotesque ExtraBold,92,&H0031C8FF,&H0031C8FF,&H00180F14,&H96000000,0,0,0,0,100,100,2,0,1,9,6,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text""")
# spoken words, one at a time, with a pop
for (a, b), text in zip(segs, LINES):
    words = text.split(); total = sum(len(w) + 1 for w in words); acc = 0
    for i, w in enumerate(words):
        s0 = a + (b - a) * acc / total; acc += len(w) + 1; s1 = a + (b - a) * acc / total
        if i == len(words) - 1: s1 += 0.12
        key = w.lower().strip("…,.?!'s").rstrip("’") if w.lower() != "she's" else "she"
        col = "{\\c&H31C8FF&}" if key in GOLD or w.lower().strip("…,.?!") in GOLD else ""
        pop = "{\\fscx122\\fscy122\\t(0,90,\\fscx100\\fscy100)}"
        print(f"Dialogue: 0,{ts(s0)},{ts(s1)},W,,0,0,0,,{pop}{col}{w}")
# title box (the question the video answers) — first act, then back for the payoff
for a, b in [(0.0, F(279)), (F(1626), END)]:
    print(f"Dialogue: 1,{ts(a)},{ts(b)},T,,0,0,0,,{{\\fad(120,200)}}WAS CLEOPATRA EGYPTIAN?")
# name tags / place labels: yellow boxes, popping in
def tag(f0, f1, x, y, text, layer=2):
    print(f"Dialogue: {layer},{ts(F(f0))},{ts(F(f1))},N,,0,0,0,,{{\\an5\\pos({x},{y})\\fscx40\\fscy40\\t(0,140,\\fscx100\\fscy100)\\fad(0,120)}}{text}")
tag(420, 470, 540, 520, "PTOLEMY")
tag(476, 525, 330, 430, "ALEXANDER THE GREAT"); tag(482, 525, 760, 520, "PTOLEMY")
tag(530, 566, 540, 470, "323 BC · DIES AGED 32")
tag(640, 699, 540, 470, "EGYPT = THE RICHEST SLICE")
tag(745, 803, 540, 470, "ALEXANDRIA")
tag(806, 862, 540, 335, "THE PTOLEMIES · ~300 YEARS")
tag(870, 937, 540, 470, "CLEOPATRA VII · 69 BC")
tag(1128, 1178, 540, 470, "\"THE NEW ISIS\"")
tag(1626, 1800, 300, 470, "GREEK BLOODLINE"); tag(1640, 1800, 780, 470, "EGYPTIAN CROWN")
# the rewind counter: 51 BC rolling back to 323 BC
for f in range(286, 356, 2):
    yr = int(51 + (323 - 51) * min(1, (f - 290) / 56) ** 1.6) if f > 290 else 51
    print(f"Dialogue: 2,{ts(F(f))},{ts(F(f + 2))},S,,0,0,0,,{{\\an5\\pos(540,800)\\fs120\\c&HFFFFFF&}}◀◀ {yr} BC")
print(f"Dialogue: 2,{ts(F(356))},{ts(F(415))},S,,0,0,0,,{{\\an5\\pos(540,520)\\fs96\\c&HFFFFFF&\\fad(0,150)}}323 BC")
# stamps: slam in (big -> normal), slight tilt
def stamp(f0, f1, text, y=760, rot=-6, col="&H31C8FF&"):
    print(f"Dialogue: 3,{ts(F(f0))},{ts(F(f1))},S,,0,0,0,,{{\\an5\\pos(540,{y})\\frz{rot}\\c{col}\\fscx260\\fscy260\\alpha&HFF&\\t(0,110,\\fscx100\\fscy100\\alpha&H00&)\\fad(0,150)}}{text}")
stamp(1299, 1317, "{\\fnDejaVu Sans Bold}✓{\\fnBricolage Grotesque ExtraBold} BORN IN EGYPT", 760, -5, "&H7FE07A&")
stamp(1362, 1392, "{\\fnDejaVu Sans Bold}✓{\\fnBricolage Grotesque ExtraBold} RULER OF EGYPT", 760, 5, "&H7FE07A&")
stamp(1440, 1481, "MACEDONIAN\\NGREEK", 640, -7)
stamp(1592, 1625, "MOST ICONIC PHARAOH", 520, 0)
