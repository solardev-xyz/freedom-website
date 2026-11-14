"""One-off generator for the home share image and the app icons.
Inputs are files already in the repo; nothing is drawn by AI.

  python3 scripts/assets/make-og-and-icons.py

Writes:
  src/images/freedom-og.jpg          1200x630 home/link preview image
  src/static/favicon.ico             16/32/48 px, from images/logo/freedom-icon-rounded-dark.png
  src/static/apple-touch-icon.png    180 px, opaque, from images/logo/freedom-icon-dark.png
  src/static/icon-192.png, icon-512.png  for manifest.webmanifest
Needs Pillow. Run scripts/make-grain.js first (uses src/assets/grain-teal.png)."""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
S = lambda *p: os.path.join(ROOT, "src", *p)
os.makedirs(S("static"), exist_ok=True)

# --- icons ---------------------------------------------------------------
rounded = Image.open(S("images", "logo", "freedom-icon-rounded-dark.png")).convert("RGBA")
rounded.save(S("static", "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
square = Image.open(S("images", "logo", "freedom-icon-dark.png")).convert("RGB")
square.resize((180, 180), Image.LANCZOS).save(S("static", "apple-touch-icon.png"), optimize=True)
for n in (192, 512):
    square.resize((n, n), Image.LANCZOS).save(S("static", f"icon-{n}.png"), optimize=True)

# --- share image ---------------------------------------------------------
W, H = 1200, 630
# same look as the site's sections: grain tile over the compensated teal gradient
top, bottom = (0x1f, 0x2a, 0x2a), (0x00, 0x66, 0x6a)
bg = Image.new("RGBA", (W, H))
d = ImageDraw.Draw(bg)
for y in range(H):
    t = y / (H - 1)
    d.line([(0, y), (W, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
tile = Image.open(S("assets", "grain-teal.png")).convert("RGBA")
grain = Image.new("RGBA", (W, H))
for x in range(0, W, tile.width):
    for y in range(0, H, tile.height):
        grain.paste(tile, (x, y))
bg = Image.alpha_composite(bg, grain)

# screenshot on the right, running off the bottom edge
shot = Image.open(S("images", "freedom-0.8.8-hero.webp")).convert("RGBA")
sw = 560
shot = shot.resize((sw, round(shot.height * sw / shot.width)), Image.LANCZOS)
bg.alpha_composite(shot, (W - sw - 10, 30))

# wordmark and headline on the left
logo = Image.open(S("images", "logo", "freedom-logo-white.png")).convert("RGBA")
lw = 300
logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
bg.alpha_composite(logo, (72, 96))

font_path = S("assets", "fonts", "InterVariable.woff2")
def inter(size, weight):
    f = ImageFont.truetype(font_path, size)
    # InterVariable axes, in order: optical size (14-32), weight (100-900)
    f.set_variation_by_axes([min(32, max(14, size * 0.6)), weight])
    return f

d = ImageDraw.Draw(bg)
y = 96 + logo.height + 64
for line in ("The browser for a", "user-owned internet"):
    d.text((70, y), line, font=inter(54, 700), fill=(255, 255, 255))
    y += 64
y += 22
for line in ("Swarm, IPFS and ENS built in,", "with a wallet and an agent."):
    d.text((72, y), line, font=inter(27, 400), fill=(214, 228, 226))
    y += 38
d.text((72, H - 72), "freedom.baby", font=inter(24, 600), fill=(255, 255, 255))
bg.convert("RGB").save(S("images", "freedom-og.jpg"), quality=86, optimize=True, progressive=True)
print("ok")
