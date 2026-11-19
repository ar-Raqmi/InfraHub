"""Contact sheets for page review: review/page-NN.png (pdftoppm -r 60) -> review/sheet-K.png, 6 pages each.
Run with the system python (has PIL):  env -i HOME=$HOME PATH=/usr/bin:/bin /usr/bin/python3 contact.py [first last]
"""
import glob
import os
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
REV = os.path.join(HERE, "review")
files = sorted(glob.glob(os.path.join(REV, "page-*.png")))
if len(sys.argv) == 3:
    a, b = int(sys.argv[1]), int(sys.argv[2])
    files = files[a - 1:b]
per, cols, gap = 6, 3, 12
for old in glob.glob(os.path.join(REV, "sheet-*.png")):
    os.remove(old)
for k in range(0, len(files), per):
    imgs = [Image.open(f).convert("RGB") for f in files[k:k + per]]
    w, h = imgs[0].size
    rows = -(-len(imgs) // cols)
    sheet = Image.new("RGB", (cols * w + (cols + 1) * gap, rows * h + (rows + 1) * gap), (120, 120, 120))
    d = ImageDraw.Draw(sheet)
    for i, im in enumerate(imgs):
        x, y = gap + (i % cols) * (w + gap), gap + (i // cols) * (h + gap)
        sheet.paste(im, (x, y))
        d.rectangle([x, y, x + 34, y + 16], fill=(255, 0, 80))
        d.text((x + 4, y + 3), os.path.basename(files[k + i])[5:-4], fill=(255, 255, 255))
    if sheet.width > 1280:
        sheet = sheet.resize((1280, round(sheet.height * 1280 / sheet.width)))
    out = os.path.join(REV, f"sheet-{k // per + 1}.png")
    sheet.save(out)
    print(out, sheet.size)
