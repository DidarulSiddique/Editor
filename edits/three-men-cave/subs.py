#!/usr/bin/env python3
"""Burn-in captions (ASS) for the cave short: <=4-word chunks spread over each voice segment,
plus a title at the start and the source at the end.  usage: python3 subs.py > subs.ass"""
LINES = ["Three men were travelling when night fell,", "so they took shelter in a cave.", "Then a rock…", "…rolled down the mountain,",
 "and sealed it shut.", "Trapped, they said:", "“Only our sincere deeds can save us now.”", "The first said:", "“O Allah,",
 "I never fed my family before my old parents. One night they fell asleep, so I stood holding their milk until dawn.",
 "If that was for You,", "free us.”", "The rock moved…", "…a little.", "The second said:", "“I once had the chance to commit a great sin.",
 "But when I was reminded to fear You,", "I walked away.”", "The rock moved again.", "The third said:", "“A worker left without his wage.",
 "I invested it,", "until it became a whole herd.", "When he came back,", "I gave him all of it.”", "The rock rolled away…",
 "…and they walked out into the light.", "Sincere deeds, done for Allah alone,", "open the way out."]
segs = [tuple(map(float, l.split())) for l in open("work/segs.txt")]
assert len(segs) == len(LINES), (len(segs), len(LINES))
ts = lambda t: f"{int(t//3600)}:{int(t%3600//60):02d}:{t%60:05.2f}"
print("""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Bricolage Grotesque ExtraBold,78,&H00FFFFFF,&H00FFFFFF,&H00261724,&H80000000,0,0,0,0,100,100,0,0,1,7,3,2,80,80,520,1
Style: Title,Bricolage Grotesque ExtraBold,70,&H00B3E7FF,&H00FFFFFF,&H00261724,&H80000000,0,0,0,0,100,100,2,0,1,6,3,8,80,80,260,1
Style: Src,JetBrains Mono SemiBold,34,&H00B3E7FF,&H00FFFFFF,&H00261724,&H80000000,0,0,0,0,100,100,4,0,1,4,2,8,80,80,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text""")
print(f"Dialogue: 0,{ts(0.3)},{ts(4.8)},Title,,0,0,0,,{{\\fad(250,300)}}THE THREE MEN\\NIN THE CAVE")
print(f"Dialogue: 0,{ts(51.9)},{ts(57.6)},Src,,0,0,0,,{{\\fad(300,400)}}SAHIH AL-BUKHARI 2272")
for (a, b), text in zip(segs, LINES):
    words = text.split(); chunks = [words[i:i + 4] for i in range(0, len(words), 4)]
    total = sum(len(" ".join(c)) + 1 for c in chunks); acc = 0
    for c in chunks:
        n = len(" ".join(c)) + 1
        s0 = a + (b - a) * acc / total; s1 = a + (b - a) * (acc + n) / total + (0.12 if c is chunks[-1] else 0)
        acc += n
        print(f"Dialogue: 1,{ts(s0)},{ts(s1)},Sub,,0,0,0,,{{\\fad(60,60)}}{' '.join(c)}")
