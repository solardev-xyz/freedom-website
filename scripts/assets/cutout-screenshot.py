"""Turn a macOS window screenshot taken on a white background into a
transparent PNG/WebP: the window stays opaque, the drop shadow becomes
black with alpha. Used once for images/freedom-0.8.8-hero*.webp.

usage: python3 cutout-screenshot.py in.webp out-prefix left top right bottom radius
(window bounds in pixels, edges inclusive)."""
import sys
from PIL import Image, ImageDraw, ImageChops

src, out, l, t, r, b, rad = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:8])
im = Image.open(src).convert("RGB")
W, H = im.size
S = 4  # supersample the window mask for an anti-aliased edge
m = Image.new("L", (W * S, H * S), 0)
ImageDraw.Draw(m).rounded_rectangle(
    (l * S, t * S, (r + 1) * S - 1, (b + 1) * S - 1), radius=rad * S, fill=255)
mask = m.resize((W, H), Image.LANCZOS)

# shadow: grey over white -> black at alpha (255 - grey)
grey = im.convert("L")
shadow_a = ImageChops.invert(grey)
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
shadow.putalpha(shadow_a)
window = im.convert("RGBA")
window.putalpha(mask)
outim = Image.alpha_composite(shadow, window)
# outside the window keep only the shadow, inside only the window
outim.save(out + ".png")
for w in (1121, 560):
    v = outim if w == W else outim.resize((w, round(H * w / W)), Image.LANCZOS)
    v.save(f"{out}-{w}.webp", "WEBP", quality=86, method=6)
    print(out, w, v.size)
