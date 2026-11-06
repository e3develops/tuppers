"""Iconos de la app: un tupper con tapa naranja, comida dentro y vapor, sobre fondo oscuro."""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public")
S = 1024


def draw(scale=1.0):
    img = Image.new("RGB", (S, S), "#0E1116")
    d = ImageDraw.Draw(img)
    # brillo suave de fondo
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([200, 260, 824, 884], fill=(255, 140, 60, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    img.paste(glow, (0, 0), glow)
    d = ImageDraw.Draw(img)

    def box(x0, y0, x1, y1):
        c = S / 2
        f = lambda v: c + (v - c) * scale
        return [f(x0), f(y0), f(x1), f(y1)]

    def r(v):
        return v * scale

    # vapor
    import math
    for k, x in enumerate((420, 512, 604)):
        top = 150 if k == 1 else 190
        pts = []
        for i in range(0, 61):
            y = 330 - (330 - top) * i / 60
            dx = 20 * math.sin(i / 60 * 2 * math.pi * 1.2 + k)
            pts.append((x + dx, y))
        pts = [(S / 2 + (px - S / 2) * scale, S / 2 + (py - S / 2) * scale) for px, py in pts]
        d.line(pts, fill="#AEB9C8", width=int(r(20)), joint="curve")
        for (px, py) in (pts[0], pts[-1]):
            rr = r(10)
            d.ellipse([px - rr, py - rr, px + rr, py + rr], fill="#AEB9C8")
    # cuerpo del tupper (translúcido)
    d.rounded_rectangle(box(210, 470, 814, 800), radius=r(70), fill="#2A3446", outline="#7D8CA3", width=int(r(16)))
    # comida
    d.rounded_rectangle(box(246, 540, 778, 770), radius=r(50), fill="#E8563C")
    d.ellipse(box(300, 540, 470, 690), fill="#FF9F45")
    d.ellipse(box(520, 560, 700, 720), fill="#FFB86B")
    d.ellipse(box(430, 640, 560, 760), fill="#7ED957")
    d.ellipse(box(640, 640, 740, 740), fill="#FFD54A")
    # tapa
    d.rounded_rectangle(box(180, 400, 844, 500), radius=r(40), fill="#FF9F45")
    d.rounded_rectangle(box(420, 362, 604, 420), radius=r(26), fill="#FF8A20")
    # brillo de la tapa
    d.rounded_rectangle(box(220, 418, 520, 440), radius=r(11), fill="#FFC285")
    return img


full = draw(1.0)
for size, name in [(512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png"), (64, "favicon.png")]:
    full.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name))
# maskable: el dibujo dentro de la zona segura (80 %)
draw(0.78).resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "icon-512-maskable.png"))
print("ok")
