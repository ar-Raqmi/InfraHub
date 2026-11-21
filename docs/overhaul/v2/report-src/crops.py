"""Pre-crop tall screenshots (so no CSS overflow clipping is needed). Writes img/r2/r2_*.png from img-v2/."""
import os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, "img-v2"), os.path.join(HERE, "img", "r2")
os.makedirs(DST, exist_ok=True)
CROPS = {
    "r2_o_profil": ("O/04-profil-desktop.png", (0, 0, 1280, 930)),
    "r2_o_teks": ("O/08-teks-desktop.png", (0, 0, 1280, 930)),
    "r2_o_lad": ("O/17-e2e-lad-check.png", (0, 0, 1280, 900)),
    "r2_k_versions": ("K/10-version-log-diff-desktop.png", (0, 490, 1280, 1400)),
    "r2_o_m_profil": ("O/05-profil-430.png", (0, 380, 430, 1312)),
    "r2_o_m_teks": ("O/09-teks-430.png", (0, 380, 430, 1312)),
    "r2_o_m_peraturan": ("O/13-peraturan-430.png", (0, 380, 430, 1312)),
}
for name, (f, box) in CROPS.items():
    im = Image.open(os.path.join(SRC, f)).convert("RGB").crop(box)
    im.save(os.path.join(DST, name + ".png"), optimize=True)
    print(name, im.size)
