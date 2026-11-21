"""Crop screenshots for the R1 chapters into img/r1/*.png (originals stay untouched in img-v2/).

Kit slices are cut at the section gaps found by find_gaps.py. P2/D crops are cut around the dialog or header.
Writes ref/crops.png, a contact sheet for checking the crops by eye.
"""
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "img-v2")
OUT = os.path.join(HERE, "img", "r1")
os.makedirs(OUT, exist_ok=True)

KIT = {"kit-tokens": (100, 410, 1180, 866), "kit-buttons": (100, 948, 1180, 1444), "kit-chips": (100, 1526, 1180, 1897),
       "kit-flow": (100, 1981, 1180, 2561), "kit-count": (100, 2644, 1180, 2852), "kit-diff": (100, 2934, 1180, 3513),
       "kit-bq": (100, 3595, 1180, 3906)}
CROPS = {  # out name: (source file, box)
    "p2-swap": ("P2/03-desktop-swap-list.png", (380, 230, 900, 570)),
    "p2-preview": ("P2/04-desktop-reprice-preview.png", (380, 100, 900, 700)),
    "p2-rowflag": ("P2/05-desktop-row-indicator.png", (400, 60, 1280, 800)),
    "p2-decision": ("P2/05b-desktop-decision-sheet.png", (400, 140, 890, 720)),
    "p2-banner": ("P2/13-desktop-ditutup-banner-locked.png", (170, 170, 1250, 480)),
    "p2-picker": ("P2/02-desktop-picker.png", (230, 70, 1050, 730)),
    "p2-phone-before": ("P2/00-before-phone430-header.png", (0, 0, 860, 1230)),
    "p2-phone-after": ("P2/00-after-phone430-header.png", (0, 0, 860, 1230)),
    "p2-phone-stepper": ("P2/07-phone430-stepper-open.png", (0, 0, 860, 1230)),
    "p2-phone-preview": ("P2/09-phone430-reprice-preview.png", (0, 560, 860, 1700)),
    "p2-phone-locked": ("P2/14-phone430-locked-swap.png", (0, 560, 860, 1700)),
    "p2-phone-row": ("P2/10-phone430-row-indicator.png", (0, 150, 860, 1380)),
    "d-dash-phone": ("D/dashboard-phone.png", (0, 0, 860, 1300)),
    "d-sheet-phone": ("D/kit-sheet-phone.png", (0, 880, 860, 1864)),
}

made = {}
kit = Image.open(os.path.join(SRC, "D", "kit-desktop.png")).convert("RGB")
for name, box in KIT.items():
    kit.crop(box).save(os.path.join(OUT, name + ".png"))
for name, (rel, box) in CROPS.items():
    im = Image.open(os.path.join(SRC, rel)).convert("RGB")
    im.crop(box).save(os.path.join(OUT, name + ".png"))
    made[name] = box
print({k: (v[2] - v[0], v[3] - v[1]) for k, v in made.items()})

names = list(made)
cell = 300
sheet = Image.new("RGB", (4 * (cell + 6) + 6, 4 * (cell + 6) + 6), (90, 90, 90))
for i, name in enumerate(names):
    c = Image.open(os.path.join(OUT, name + ".png"))
    c.thumbnail((cell, cell))
    sheet.paste(c, (6 + (i % 4) * (cell + 6), 6 + (i // 4) * (cell + 6)))
sheet.save(os.path.join(HERE, "ref", "crops.png"))
