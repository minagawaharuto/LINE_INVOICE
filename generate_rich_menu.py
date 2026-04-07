"""
LINE Rich Menu - 請求情報入力
1040 x 1040 px (square)
"""

from PIL import Image, ImageDraw, ImageFont
import os, math

FONT_DIR = r"C:\Users\Panasonic\.claude\plugins\cache\anthropic-agent-skills\example-skills\98669c11ca63\skills\canvas-design\canvas-fonts"
W, H = 1040, 1040

BG       = (8,  12,  22)
CARD     = (14, 20,  36)
ACCENT   = (255, 210, 60)
ACCENT2  = (200, 160, 30)
WHITE    = (242, 244, 250)
GREY_DIM = (70,  82, 110)
GREY_MID = (120, 135, 165)
GRID     = (20,  28,  48)
TEAL     = (30, 180, 140)

def fnt(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)

def jp(size):
    return ImageFont.truetype(r"C:\Windows\Fonts\BIZ-UDGothicB.ttc", size)

def jp_r(size):
    return ImageFont.truetype(r"C:\Windows\Fonts\BIZ-UDGothicR.ttc", size)

def rrect(draw, xy, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)

def circ(draw, cx, cy, r, fill=None, outline=None, width=1):
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=fill, outline=outline, width=width)

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# ── Grid ──────────────────────────────────────────────────────
for x in range(0, W, 52):
    draw.line([(x,0),(x,H)], fill=GRID, width=1)
for y in range(0, H, 52):
    draw.line([(0,y),(W,y)], fill=GRID, width=1)

# ── Glow top-right (gold) ─────────────────────────────────────
for i in range(20, 0, -1):
    r = i * 28
    col = (min(255, i*10), min(255, i*7), 0)
    draw.ellipse([W-r, -r, W+r, r], fill=col)

# ── Glow bottom-left (teal) ───────────────────────────────────
for i in range(14, 0, -1):
    r = i * 26
    col = (0, min(255, 20+i*8), min(255, 30+i*7))
    draw.ellipse([-r, H-r, r, H+r], fill=col)

# ── Card ──────────────────────────────────────────────────────
mx = 36
rrect(draw, [mx, mx, W-mx, H-mx], r=28, fill=CARD)
rrect(draw, [mx, mx, W-mx, mx+5], r=3, fill=ACCENT)

# ── Corner marks ─────────────────────────────────────────────
def cm(x, y, dx, dy):
    draw.line([(x,y),(x+dx*28,y)], fill=ACCENT2, width=2)
    draw.line([(x,y),(x,y+dy*28)], fill=ACCENT2, width=2)

cm(mx+18, mx+52,  1,  1)
cm(W-mx-18, mx+52, -1,  1)
cm(mx+18, H-mx-18, 1, -1)
cm(W-mx-18, H-mx-18, -1, -1)

# ── Header ───────────────────────────────────────────────────
f_brand = fnt("JetBrainsMono-Regular.ttf", 22)
draw.text((mx+28, mx+16), "THP", font=f_brand, fill=GREY_DIM)
draw.text((mx+28+68, mx+16), " · LINE INVOICE", font=f_brand, fill=(50,60,90))
draw.line([(mx+24, mx+52),(W-mx-24, mx+52)], fill=(24,32,56), width=1)

# ── Invoice document (left-center) ───────────────────────────
doc_x, doc_y = 70, 170
doc_w, doc_h = 310, 420

# Shadow
rrect(draw, [doc_x+8, doc_y+8, doc_x+doc_w+8, doc_y+doc_h+8],
      r=12, fill=(5,7,14))
# Body
rrect(draw, [doc_x, doc_y, doc_x+doc_w, doc_y+doc_h],
      r=12, fill=(18,26,50))
rrect(draw, [doc_x, doc_y, doc_x+doc_w, doc_y+doc_h],
      r=12, outline=(35,50,90), width=1)

# Dog-ear
fold = 38
draw.polygon([
    (doc_x+doc_w-fold, doc_y),
    (doc_x+doc_w, doc_y+fold),
    (doc_x+doc_w, doc_y),
], fill=(8,12,22))
draw.line([(doc_x+doc_w-fold, doc_y),(doc_x+doc_w, doc_y+fold)],
          fill=(35,50,90), width=1)

# Header stripe
rrect(draw, [doc_x, doc_y, doc_x+doc_w, doc_y+48], r=12, fill=ACCENT)
rrect(draw, [doc_x, doc_y+28, doc_x+doc_w, doc_y+48], r=0, fill=ACCENT)

f_inv = fnt("IBMPlexMono-Bold.ttf", 22)
draw.text((doc_x+14, doc_y+10), "INVOICE", font=f_inv, fill=(8,12,22))
draw.text((doc_x+doc_w-48, doc_y+8), "¥", font=f_inv, fill=(8,12,22))

# Line items
f_lbl = fnt("GeistMono-Regular.ttf", 14)
f_val = fnt("GeistMono-Regular.ttf", 14)
items = [("DATE","2026/04/07"), ("CLIENT","──────"), ("ITEM","──────"),
         ("QTY","───"), ("UNIT","───"), ("TOTAL","──────")]
iy = doc_y + 60
for lbl, val in items:
    draw.text((doc_x+14, iy), lbl, font=f_lbl, fill=GREY_DIM)
    draw.text((doc_x+90, iy), val, font=f_val, fill=GREY_MID)
    draw.line([(doc_x+10, iy+24),(doc_x+doc_w-10, iy+24)],
              fill=(28,38,68), width=1)
    iy += 36

# Total row
rrect(draw, [doc_x+10, iy+8, doc_x+doc_w-10, iy+46],
      r=6, fill=(30,50,24))
draw.text((doc_x+18, iy+14), "合計", font=jp_r(20), fill=ACCENT)
draw.text((doc_x+doc_w-90, iy+14), "¥ ──", font=f_val, fill=ACCENT)

# Stamp
s_cx = doc_x + doc_w - 52
s_cy = doc_y + doc_h - 52
for i in range(2):
    circ(draw, s_cx, s_cy, 36-i*3, outline=TEAL, width=1)
draw.text((s_cx-22, s_cy-8), "OK", font=fnt("JetBrainsMono-Bold.ttf", 14), fill=TEAL)

# ── Center: glow circle + icon ───────────────────────────────
cx, cy = W//2 + 80, H//2 - 50

for i in range(10, 0, -1):
    col = (min(255,i*16), min(255,i*11), 0)
    circ(draw, cx, cy, 120+i*12, fill=col)

circ(draw, cx, cy, 120, fill=(18,26,46))
circ(draw, cx, cy, 120, outline=ACCENT, width=4)
circ(draw, cx, cy, 104, outline=ACCENT2, width=1)

# Pen icon
pen_pts = [
    (cx-10, cy+38), (cx+38, cy-58),
    (cx+56, cy-40), (cx+8,  cy+56),
]
draw.polygon(pen_pts, fill=ACCENT)
draw.polygon([(cx-10,cy+38),(cx+8,cy+56),(cx-28,cy+48)], fill=ACCENT2)
draw.line([(cx+32,cy-50),(cx-4,cy+44)], fill=(8,12,22), width=3)

# ── Main title ────────────────────────────────────────────────
f_big = jp(72)
title = "請求情報入力"
bb = draw.textbbox((0,0), title, font=f_big)
tw = bb[2]-bb[0]
draw.text(((W-tw)//2, cy+175), title, font=f_big, fill=WHITE)

# Sub
f_sub = fnt("InstrumentSans-Regular.ttf", 24)
sub = "BILLING ENTRY FORM"
bb2 = draw.textbbox((0,0), sub, font=f_sub)
sw = bb2[2]-bb2[0]
draw.text(((W-sw)//2, cy+268), sub, font=f_sub, fill=GREY_MID)
draw.line([((W-100)//2, cy+306),((W+100)//2, cy+306)], fill=ACCENT, width=2)

# ── Step indicators ───────────────────────────────────────────
draw.line([(mx+24, H-mx-52),(W-mx-24, H-mx-52)], fill=(24,32,56), width=1)
steps = ["日程","案件名","名前","数量","送信"]
sp = (W - mx*2 - 48) // (len(steps)-1)
sx0 = mx + 28
f_st = jp_r(17)
for i, s in enumerate(steps):
    sx = sx0 + i*sp
    sy = H - mx - 40
    col = ACCENT if i == 0 else GREY_DIM
    circ(draw, sx, sy+10, 4, fill=col)
    bb3 = draw.textbbox((0,0), s, font=f_st)
    draw.text((sx - (bb3[2]-bb3[0])//2, sy+18), s, font=f_st, fill=col)

# Version
draw.text((W-mx-52, H-mx-38), "v1.0",
          font=fnt("GeistMono-Regular.ttf", 16), fill=GREY_DIM)

out = r"C:\Users\Panasonic\Downloads\LINE_INVOICE\rich_menu.png"
img.save(out, "PNG")
print(f"Saved: {out}  ({W}x{H})")
