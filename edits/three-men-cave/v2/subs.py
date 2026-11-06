#!/usr/bin/env python3
"""One-word-at-a-time captions (ricksclip style) for v2.  usage: python3 subs.py > subs.ass"""
LINES = ["Three men were sealed inside a mountain…", "and the only key", "was a secret.", "Imagine it's night.", "You and two friends duck into a cave.",
 "Then a rumble…", "and a huge rock", "slams over the entrance.", "Pitch black.", "One of them says:", "only a deed done purely for Allah,",
 "that nobody saw,", "can move this rock.", "But how can a secret move a rock?", "The first man:", "his parents always drank before anyone.",
 "One night they fell asleep,", "so he stood holding their milk until dawn, while his own kids cried at his feet.", "The rock shifts.",
 "A crack of moonlight.", "The second walked away from a great sin, with no one watching.", "The rock slides again…", "still too narrow.",
 "The third had a worker", "who left without his pay.", "He invested it for years, until it was a whole herd.", "Then", "he handed the worker",
 "every single animal.", "And the rock…", "rolls clear."]
segs = [tuple(map(float, l.split())) for l in open("segs.txt")]
assert len(segs) == len(LINES), (len(segs), len(LINES))
ts = lambda t: f"{int(t//3600)}:{int(t%3600//60):02d}:{t%60:05.2f}"
print("""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: W,Bricolage Grotesque ExtraBold,104,&H00FFFFFF,&H00FFFFFF,&H00180F14,&H90000000,0,0,0,0,100,100,0,0,1,9,4,2,60,60,620,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text""")
for (a, b), text in zip(segs, LINES):
    words = text.split(); total = sum(len(w) + 1 for w in words); acc = 0
    for i, w in enumerate(words):
        s0 = a + (b - a) * acc / total; acc += len(w) + 1; s1 = a + (b - a) * acc / total
        if i == len(words) - 1: s1 += 0.1
        pop = "{\\fscx120\\fscy120\\t(0,90,\\fscx100\\fscy100)}"
        print(f"Dialogue: 0,{ts(s0)},{ts(s1)},W,,0,0,0,,{pop}{w}")
