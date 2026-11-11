#!/usr/bin/env python3
"""Captions in the references' style: one word at a time (a short function word rides with the next word),
white heavy type, thin dark outline, soft shadow, centred at ~70% height.  usage: python3 subs.py > subs.ass"""
import json
W = json.load(open("work/words.json")); END = 1960 / 30
ts = lambda t: f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"
print("""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: W,Inter Black,92,&H00FFFFFF,&H00FFFFFF,&H00140C10,&H78000000,0,0,0,0,100,100,0,0,1,7,4,2,60,60,560,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text""")
groups, i = [], 0
while i < len(W):
    w = W[i]; txt = w["w"].replace("...", "…")
    short = len(w["w"].strip(".,?!…")) <= 3 and w["w"][-1] not in ".,?!" and i + 1 < len(W)
    if short and len(txt) + len(W[i + 1]["w"]) <= 13 and W[i + 1]["t0"] - w["t1"] < 0.25:
        groups.append((w["t0"], txt + " " + W[i + 1]["w"].replace("...", "…"), i + 1)); i += 2
    else: groups.append((w["t0"], txt, i)); i += 1
for k, (t0, txt, last) in enumerate(groups):
    t1 = groups[k + 1][0] if k + 1 < len(groups) else END
    t1 = min(t1, W[last]["t1"] + 0.45)
    pop = "{\\fscx112\\fscy112\\t(0,80,\\fscx100\\fscy100)}"
    print(f"Dialogue: 0,{ts(max(0, t0 - 0.03))},{ts(t1)},W,,0,0,0,,{pop}{txt}")
