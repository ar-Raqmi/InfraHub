"""Tiny SVG builder shared by charts.py and diagrams.py.

Units: 1 SVG unit = 1 CSS px (96 dpi). A chart meant for a container `w_mm` wide is built with
`Svg(px(w_mm), h)` so font sizes in the code are real CSS px (10 px = 7.5 pt). The SVG is inlined into
report.html by build.py, so the report fonts (Zodiak / General Sans / JetBrains Mono) apply.
Sharp corners only: nothing in here draws rounded shapes.
"""
from html import escape

INK, PAPER = "#0F1E1C", "#F6F4EE"
EM, DEEP, TEAL = "#10B981", "#059669", "#14B8A6"
PURPLE, AMBER, SLATE = "#3B2E8C", "#D97706", "#64748B"
WHITE = "#FFFFFF"

FAMILY = {
    "sans": "'General Sans', sans-serif",
    "mono": "'JetBrains Mono', monospace",
    "serif": "'Zodiak', serif",
}
# average advance width per em, used only for layout estimates (checked later in the browser)
ADVANCE = {"sans": 0.56, "mono": 0.60, "serif": 0.64}


def px(mm):
    return round(mm * 96 / 25.4, 2)


def mix(c1, c2, t):
    """Blend colour c1 towards c2 by t (0 = c1, 1 = c2)."""
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * t):02X}" for x, y in zip(a, b))


def tint(c, t):
    """Lighter tint of a palette colour: mix with paper."""
    return mix(c, PAPER, t)


STATUSES = ["FASA_DRAF", "MENUNGGU_LANTIKAN", "DALAM_PROSES", "PEMERIKSAAN_TAPAK", "TUNTUTAN_BAYARAN", "SIAP"]
STATUS_COL = {
    "FASA_DRAF": tint(SLATE, 0.5),
    "MENUNGGU_LANTIKAN": SLATE,
    "DALAM_PROSES": tint(TEAL, 0.45),
    "PEMERIKSAAN_TAPAK": TEAL,
    "TUNTUTAN_BAYARAN": EM,
    "SIAP": DEEP,
}


def text_width(s, size, fam="sans"):
    return len(str(s)) * size * ADVANCE[fam]


def wrap(s, size, max_w, fam="sans"):
    """Greedy word wrap using the advance estimate."""
    lines, cur = [], ""
    for word in str(s).split():
        trial = (cur + " " + word).strip()
        if cur and text_width(trial, size, fam) > max_w:
            lines.append(cur)
            cur = word
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines


def rm(v, dp=0):
    return f"RM {v:,.{dp}f}"


class Svg:
    def __init__(self, w, h, sid, label=""):
        self.w, self.h, self.sid = w, h, sid
        self.parts = []
        self.label = label

    def add(self, s):
        self.parts.append(s)
        return self

    def rect(self, x, y, w, h, fill="none", stroke=None, sw=1, extra=""):
        st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
        return self.add(f'<rect x="{x:.2f}" y="{y:.2f}" width="{max(w, 0):.2f}" height="{max(h, 0):.2f}" '
                        f'fill="{fill}"{st} {extra}/>')

    def line(self, x1, y1, x2, y2, stroke=INK, sw=1, extra=""):
        return self.add(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
                        f'stroke="{stroke}" stroke-width="{sw}" {extra}/>')

    def path(self, d, stroke=INK, sw=1, fill="none", extra=""):
        return self.add(f'<path d="{d}" stroke="{stroke}" stroke-width="{sw}" fill="{fill}" {extra}/>')

    def text(self, x, y, s, size=11, fam="sans", weight=400, fill=INK, anchor="start", extra="", ls=None):
        lsp = f' letter-spacing="{ls}"' if ls is not None else ""
        return self.add(f'<text x="{x:.2f}" y="{y:.2f}" font-family="{FAMILY[fam]}" font-size="{size}" '
                        f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{lsp} {extra}>'
                        f'{escape(str(s))}</text>')

    def lines(self, x, y, rows, size=11, lh=1.3, **kw):
        for i, r in enumerate(rows):
            self.text(x, y + i * size * lh, r, size=size, **kw)
        return y + len(rows) * size * lh

    def arrow_marker(self, name, color, size=7):
        mid = f"{self.sid}-{name}"
        self.add(f'<defs><marker id="{mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="{size}" '
                 f'markerHeight="{size}" orient="auto-start-reverse" markerUnits="userSpaceOnUse">'
                 f'<path d="M0,0 L10,5 L0,10 z" fill="{color}"/></marker></defs>')
        return f'url(#{mid})'

    def hatch(self, name, color, bg="none", gap=5):
        pid = f"{self.sid}-{name}"
        self.add(f'<defs><pattern id="{pid}" width="{gap}" height="{gap}" patternUnits="userSpaceOnUse" '
                 f'patternTransform="rotate(45)"><rect width="{gap}" height="{gap}" fill="{bg}"/>'
                 f'<line x1="0" y1="0" x2="0" y2="{gap}" stroke="{color}" stroke-width="1.4"/></pattern></defs>')
        return f'url(#{pid})'

    def save(self, path):
        aria = escape(self.label or self.sid)
        body = "\n".join(self.parts)
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" class="chart" id="svg-{self.sid}" '
               f'viewBox="0 0 {self.w:.2f} {self.h:.2f}" role="img" aria-label="{aria}" '
               f'style="display:block;width:100%;height:auto">\n{body}\n</svg>\n')
        with open(path, "w") as f:
            f.write(svg)
        return path
