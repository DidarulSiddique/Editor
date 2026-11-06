import glob, sys
from PIL import Image, ImageDraw
fs = sorted(glob.glob(sys.argv[1] + '/f*.jpg')); out = sys.argv[2]; a = int(sys.argv[3]) if len(sys.argv) > 3 else 0; n = int(sys.argv[4]) if len(sys.argv) > 4 else 15
fs = fs[a:a + n]; W = 5; w, h = 360, 640
sh = Image.new('RGB', (w * W, h * ((len(fs) + W - 1) // W)), 'black')
for i, f in enumerate(fs):
    im = Image.open(f).resize((w, h)); d = ImageDraw.Draw(im)
    d.rectangle([110 / 3, 250 / 3, 970 / 3, 1670 / 3], outline=(0, 255, 0)); d.text((6, 6), f[-9:-4], fill=(255, 255, 0))
    sh.paste(im, ((i % W) * w, (i // W) * h))
sh.save(out, quality=85)
