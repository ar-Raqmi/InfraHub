"""R1 charts for the InfraHub v2 Build Report (chapters 00-06). Writes charts/r1_*.svg.

Run:  env -u PYTHONPATH /home/rezephyr/.hermes/cache/scratch/v2/pw/bin/python charts_r1.py
Every number below is copied from LEAD-FACTS.md or from REPORT-F / REPORT-D / REPORT-P2 (Evidence sections); sums
that are derived are computed here and asserted against the quoted totals. Palette comes from svgkit (no new hues).
"""
import os

from diagrams import arrow, box
from svgkit import (AMBER, DEEP, EM, INK, PAPER, PURPLE, SLATE, TEAL, WHITE, Svg, mix, px, tint, wrap)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "charts")
FULL, HALF = px(174), px(83)
DARK_MUTE = mix(PAPER, INK, 0.35)


def out(name):
    return os.path.join(OUT, f"r1_{name}.svg")


def fmt(n):
    return f"{n:,}"


# ------------------------------------------------------------------------------------------------ cover
def cover():
    """490 squares (all linked to a sebutharga) plus two rows of 71 check squares (local, live preview)."""
    cols, rows = 35, 14
    assert cols * rows == 490
    pitch = FULL / cols
    sq = pitch - 4
    checks = [("O", 10), ("K", 21), ("P1", 21), ("P2", 19)]
    assert sum(n for _, n in checks) == 71
    gap = 8
    cpitch = (FULL - gap * 3) / 71
    csq = cpitch - 2.4
    grid_h = rows * pitch
    h = grid_h + 196
    s = Svg(FULL, h, "r1cover", "490 projects linked to a sebutharga; 71 of 71 browser checks pass twice")
    for i in range(490):
        r, c = divmod(i, cols)
        s.rect(c * pitch, r * pitch, sq, sq, mix(PURPLE, PAPER, 0.38))
    y0 = grid_h + 24
    s.text(0, y0, "490 OF 490 PROJECTS POINT AT A SEBUTHARGA (CONTRACT_ID + RATE_BOOK_VERSION_ID)", 10, "mono", 600,
           mix(PURPLE, PAPER, 0.62), ls=0.5)
    y1 = y0 + 40
    x = 0
    for name, n in checks:
        s.text(x, y1, f"{name} {n}", 9.5, "mono", 700, DARK_MUTE)
        x += n * cpitch + gap
    for yy in (y1 + 10, y1 + 27):
        x = 0
        for name, n in checks:
            for k in range(n):
                s.rect(x + k * cpitch, yy, csq, 10, EM)
            x += n * cpitch + gap
    y2 = y1 + 62
    s.text(0, y2, "71 OF 71 BROWSER CHECKS PASS ON THE LOCAL SERVER (TOP ROW) AND THE LIVE PREVIEW (BOTTOM ROW)", 10,
           "mono", 600, EM, ls=0.5)
    s.text(0, y2 + 26, "104 UNIT TESTS PASS · 31 COMMITS · PRODUCTION DATABASE UNTOUCHED (8 TABLES)", 10,
           "mono", 500, DARK_MUTE, ls=0.5)
    s.save(out("cover"))


# ------------------------------------------------------------------------------------------------ chapter 02
def model():
    """Before / after: one undated price list versus sebutharga-owned rate books."""
    W, H = FULL, 372
    s = Svg(W, H, "r1model", "Before and after: one global price list versus contracts that own versioned rate books")
    half = (W - 40) / 2
    xa, xb = 0, half + 40
    mkp = s.arrow_marker("p", PURPLE)
    mka = s.arrow_marker("a", AMBER)
    s.rect(xa, 0, half, 22, INK)
    s.text(xa + 10, 15, "BEFORE · V1 (DISCOVERY REPORT)", 9.5, "mono", 800, PAPER, ls=0.6)
    s.rect(xb, 0, half, 22, PURPLE)
    s.text(xb + 10, 15, "AFTER · V2 (THIS BUILD)", 9.5, "mono", 800, PAPER, ls=0.6)
    s.line(half + 20, 0, half + 20, H, mix(PAPER, INK, 0.75), 1, 'stroke-dasharray="3 4"')
    # before column
    box(s, xa, 38, half, 62, "Settings by calendar year", "panel companies and sebutharga numbers live inside a year, "
        "so a second sebutharga in one year cannot exist", WHITE, INK, tsize=10.5, ssize=9.2)
    box(s, xa, 120, half, 84, "Pustaka: one global master BQ", "no year, no sebutharga, no history. Saving deletes "
        "every row and inserts them again.", tint(AMBER, 0.78), AMBER, tsize=10.5, ssize=9.2, bar=AMBER)
    arrow(s, [(xa + half / 2, 204), (xa + half / 2, 246)], AMBER, 1.6, marker=mka)
    s.text(xa + half / 2 + 8, 230, "copied into each project", 9.2, "sans", 600, AMBER)
    box(s, xa, 250, half, 62, "489 projects, each with its own copy", "a project's rates come from today's list, "
        "not from the contract it was issued under", WHITE, INK, tsize=10.5, ssize=9.2)
    s.rect(xa, 326, half, 34, "none", PURPLE, 1, 'stroke-dasharray="4 3"')
    s.text(xa + 9, 347, "no_sebutharga = a text label", 10, "mono", 700, PURPLE)
    s.text(xa + half - 9, 347, "no link", 9.2, "sans", 600, AMBER, "end")
    # after column
    cx, cw = xb, half
    s.rect(cx, 38, cw, 96, PURPLE)
    s.text(cx + 10, 56, "MPS/SH/302/25", 11, "mono", 800, PAPER)
    s.text(cx + cw - 10, 56, "AKTIF", 9.2, "mono", 800, mix(PURPLE, PAPER, 0.7), "end", ls=0.5)
    for k, ln in enumerate(wrap("panel of 60 rows; rate book v1 (a LEGACY copy of today's Pustaka); every later "
                                "upload or edit adds a version, it never overwrites", 9.2, cw - 20)):
        s.text(cx + 10, 73 + k * 12, ln, 9.2, "sans", 500, PAPER)
    for k, (lab, on) in enumerate((("v1 LEGACY", True), ("v2 ...", False), ("v3 ...", False))):
        bx = cx + 10 + k * 70
        s.rect(bx, 112, 62, 16, mix(PURPLE, PAPER, 0.15) if on else "none", mix(PURPLE, PAPER, 0.55), 1,
               "" if on else 'stroke-dasharray="3 3"')
        s.text(bx + 31, 123.5, lab, 8.6, "mono", 700, PAPER, "middle")
    for ytop in (146, 188):
        s.rect(cx, ytop, cw, 34, tint(PURPLE, 0.82), PURPLE, 1)
        s.text(cx + 10, ytop + 15, "contract, DITUTUP", 9.6, "mono", 800, PURPLE)
        s.text(cx + 10, ytop + 27, "read-only; still prices its own projects", 9, "sans", 500, PURPLE)
    s.text(cx, 236, "3 contracts, 3 versions after the legacy migration", 9, "mono", 600, SLATE)
    for xx in (cx + cw * 0.25, cx + cw * 0.5, cx + cw * 0.75):
        arrow(s, [(xx, 244), (xx, 262)], PURPLE, 1.6, marker=mkp)
    box(s, cx, 266, cw, 46, "490 projects, each bound to a contract", "contract_id + rate_book_version_id on every row "
        "(490 of 490 linked)", WHITE, PURPLE, tsize=10.5, ssize=9.2, bar=PURPLE)
    s.rect(cx, 326, cw, 34, tint(DEEP, 0.85), DEEP, 1)
    s.text(cx + 9, 347, "change_log: who, when, diff", 10, "mono", 700, DEEP)
    s.text(cx + cw - 9, 347, "every write", 9.2, "sans", 600, DEEP, "end")
    s.save(out("model"))


def lifecycle():
    """Three lanes: contract status, rate-book version, project. All transitions are ones the API enforces."""
    W, H = FULL, 304
    s = Svg(W, H, "r1life", "Lifecycle of a sebutharga, its rate book and a project")
    lw, gap = 66, 20
    bw = (W - lw - 3 * gap) / 4
    mkp = s.arrow_marker("p", PURPLE)
    mkd = s.arrow_marker("d", DEEP)
    mka = s.arrow_marker("a", AMBER)
    bh = 80
    tops = {}
    for r, name, col in ((0, "SEBUTHARGA", PURPLE), (1, "RATE BOOK", PURPLE), (2, "PROJECT", DEEP)):
        top = 4 + r * (bh + 26)
        tops[r] = top
        s.rect(0, top, 54, bh, col)
        s.text(27, top + bh / 2 + 3.5, name, 8.2, "mono", 800, PAPER, "middle")

    def bx(c):
        return lw + c * (bw + gap)

    def cell(r, c, title, sub, kind):
        top = tops[r]
        fill, stroke, tcol, scol, bar = {
            "contract": (WHITE, PURPLE, PURPLE, INK, PURPLE),
            "solid": (PURPLE, PURPLE, PAPER, PAPER, None),
            "closed": (tint(PURPLE, 0.82), PURPLE, PURPLE, INK, None),
            "sys": (WHITE, DEEP, DEEP, INK, DEEP),
            "risk": (tint(AMBER, 0.8), AMBER, INK, INK, AMBER),
        }[kind]
        box(s, bx(c), top, bw, bh, title, sub, fill, stroke, tcol=tcol, scol=scol, tsize=10.2, ssize=9, bar=bar)

    cell(0, 0, "DRAF", "created or cloned by any officer; the book is imported here", "contract")
    cell(0, 1, "AKTIF", "needs a published book; new projects bind to the newest AKTIF panel contract", "solid")
    cell(0, 2, "DITUTUP", "read-only; keeps pricing its own projects; draf projects are flagged", "closed")
    cell(0, 3, "Padam (delete)", "refused (409) while AKTIF or while any project uses the contract", "risk")
    cell(1, 0, "Import to DRAF", "browser reads the Excel; matches are EXACT, CODE, FUZZY or NEW", "contract")
    cell(1, 1, "Decide PENDING", "an officer accepts or rejects each reworded line; no AI in the loop", "contract")
    cell(1, 2, "Publish: TERBIT", "message and diff stats are logged; publish is 409 while PENDING remain", "solid")
    cell(1, 3, "Current book", "a contract serves its highest TERBIT version; older versions stay viewable", "closed")
    cell(2, 0, "New project", "bound to the AKTIF contract unless the PJA picks another", "sys")
    cell(2, 1, "Swap + re-price", "preview old rate, new rate and total per row; nothing changes until Apply", "sys")
    cell(2, 2, "No. Inden issued", "the contract is locked: the swap API answers 423", "risk")
    cell(2, 3, "Unlock", "an explicit, logged action; the swap then works again", "sys")
    for r, mk, col in ((0, mkp, PURPLE), (1, mkp, PURPLE), (2, mkd, DEEP)):
        for c in range(3):
            y = tops[r] + bh / 2
            last_amber = r == 2 and c == 2
            arrow(s, [(bx(c) + bw + 1, y), (bx(c + 1) - 2, y)], AMBER if last_amber else col, 1.6,
                  marker=mka if last_amber else mk)
    arrow(s, [(bx(2) + bw / 2, tops[0] + bh), (bx(2) + bw / 2, tops[1] - 2)], PURPLE, 1.2, True, mkp)
    s.text(bx(2) + bw / 2 + 6, tops[0] + bh + 17, "close", 8.8, "mono", 700, PURPLE)
    arrow(s, [(bx(1) + bw / 2, tops[1] + bh), (bx(1) + bw / 2, tops[2] - 2)], PURPLE, 1.2, True, mkp)
    s.text(bx(1) + bw / 2 + 6, tops[1] + bh + 17, "a new book to re-price to", 8.8, "mono", 700, PURPLE)
    s.save(out("lifecycle"))


# ------------------------------------------------------------------------------------------------ chapter 03
TIMES = {  # minutes after 22:00 on 21 Nov 2026 (LEAD-FACTS timeline)
    "backup": 16, "contract": 26, "wave1": 30, "wave2": 74, "preview": 153, "specs": 156,
}
BUILDERS = [  # name, job, dispatch, merge (minutes after 22:00), run minutes and calls (state.db via LEAD-FACTS), wave
    ("F", "Foundation", 30, 65, 37, 114, 1),
    ("D", "Design system", 30, 49, 19, 58, 1),
    ("P2", "Project + BQ", 74, 117, 39, 124, 2),
    ("O", "Organisasi", 74, 126, 51, 132, 2),
    ("K", "Kontrak + import", 74, 139, 56, 129, 2),
    ("P1", "Dashboard + list", 74, 144, 56, 124, 2),
]


def clock(m):
    t = 22 * 60 + m
    return f"{(t // 60) % 24:02d}:{t % 60:02d}"


def gantt():
    W = FULL * 0.88
    x0, x1 = 150, W - 6
    sc = (x1 - x0) / 170

    def X(m):
        return x0 + m * sc

    top_h = 74
    row_h, bar_h = 31, 18
    H = top_h + 24 + len(BUILDERS) * row_h + 30
    s = Svg(W, H, "r1gantt", "Timeline of the build night, 21 to 22 Nov 2026")
    for m in range(0, 171, 30):
        s.line(X(m), top_h - 4, X(m), H - 22, mix(PAPER, INK, 0.8), 1, 'stroke-dasharray="2 4"')
        s.text(X(m), H - 8, clock(m), 9, "mono", 600, SLATE, "middle")
    s.text(0, 12, "LEAD", 9, "mono", 800, INK)
    base = top_h - 10
    s.line(x0, base, x1, base, INK, 1.2)
    marks = [  # minute, label, tier (0 high .. 2 low), anchor
        (TIMES["backup"], "22:16 D1 backup, restore test", 0, "start"),
        (TIMES["contract"], "22:26 CONTRACT.md", 1, "start"),
        (TIMES["wave1"], "22:30 wave 1 dispatched", 2, "start"),
        (TIMES["wave2"], "23:14 wave 2 dispatched", 0, "start"),
        (TIMES["preview"], "00:33 preview deployed", 2, "end"),
        (TIMES["specs"], "00:36 every spec passes live", 1, "end"),
    ]
    tier_y = (16, 32, 48)
    for m, lab, tier, anc in marks:
        y = tier_y[tier]
        s.line(X(m), y + 2, X(m), base, INK, 1)
        s.rect(X(m) - 3, base - 3, 6, 6, PURPLE if "CONTRACT" in lab else INK)
        s.text(X(m) + (4 if anc == "start" else -4), y, lab, 9.2, "sans", 600, INK, anc)
    y = top_h + 16
    for name, job, d, mg, run, calls, wave in BUILDERS:
        col = TEAL if wave == 1 else DEEP
        s.text(0, y + 12, name, 11, "mono", 800, col)
        s.text(24, y + 12, job, 9.2, "sans", 500, SLATE)
        s.rect(X(d), y, X(mg) - X(d), bar_h, col)
        s.text((X(d) + X(mg)) / 2, y + 12, f"{mg - d} min", 9, "mono", 700, WHITE, "middle")
        label = f"merged {clock(mg)} · run {run} min · {calls} calls"
        if wave == 1:
            s.text(X(mg) + 6, y + 12, label, 9, "mono", 500, INK)
        else:
            s.text(X(d) - 6, y + 12, label, 9, "mono", 500, INK, "end")
        y += row_h
    s.save(out("gantt"))


COST = [  # name, job, wall min, calls, est $, wave
    ("F", "Foundation", 37, 114, 10.90, 1),
    ("D", "Design system", 19, 58, 4.45, 1),
    ("K", "Kontrak + import", 56, 129, 10.60, 2),
    ("P1", "Dashboard + list", 56, 124, 12.51, 2),
    ("P2", "Project + BQ", 39, 124, 9.83, 2),
    ("O", "Organisasi", 51, 132, 11.59, 2),
    ("Lead", "whole conversation", None, 309, 41.73, 0),
]


def cost():
    total_calls = sum(c[3] for c in COST)
    total_cost = round(sum(c[4] for c in COST), 2)
    assert total_calls == 990 and total_cost == 101.61, (total_calls, total_cost)
    W = FULL
    row_h = 30
    H = 46 + len(COST) * row_h + 26
    s = Svg(W, H, "r1cost", "Wall time, API calls and estimated API price per builder")
    cA, cB, cC = 150, 336, 442
    wmax, kmax = 60, 45
    s.text(cA, 14, "WALL TIME (MIN)", 8.8, "mono", 700, SLATE, ls=0.5)
    s.text(cB + 24, 14, "API CALLS", 8.8, "mono", 700, SLATE, "end", ls=0.5)
    s.text(cC, 14, "EST. API LIST PRICE (USD)", 8.8, "mono", 700, SLATE, ls=0.5)
    s.line(0, 22, W, 22, INK, 1.2)
    y = 30
    for name, job, wall, calls, usd, wave in COST:
        col = {1: TEAL, 2: DEEP, 0: SLATE}[wave]
        s.text(0, y + 15, name, 11, "mono", 800, col)
        s.text(32, y + 15, job, 9.2, "sans", 500, SLATE)
        if wall is None:
            s.text(cA, y + 15, "not measured", 9, "mono", 500, SLATE)
        else:
            w = wall / wmax * 150
            s.rect(cA, y + 3, w, 17, col)
            s.text(cA + w + 6, y + 15.5, wall, 9.6, "mono", 700, INK)
        s.text(cB + 24, y + 15.5, calls, 9.6, "mono", 700, INK, "end")
        w = usd / kmax * 150
        s.rect(cC, y + 3, w, 17, col)
        s.text(cC + w + 6, y + 15.5, f"${usd:,.2f}", 9.6, "mono", 700, INK)
        s.line(0, y + row_h - 3, W, y + row_h - 3, mix(PAPER, INK, 0.85), 1)
        y += row_h
    s.text(0, y + 18, "TOTAL", 10, "mono", 800, INK)
    s.text(cB + 24, y + 18, f"{total_calls}", 10, "mono", 800, INK, "end")
    s.text(cC, y + 18, f"${total_cost:,.2f}", 10, "mono", 800, INK)
    s.save(out("cost"))
    return total_cost


# ------------------------------------------------------------------------------------------------ chapter 04 (F)
def f_match():
    assert 195 + 154 + 116 == 465 and 195 + 154 + 37 == 386
    assert 140 + 101 + 107 + 117 + 38 == 503
    W = FULL
    x0, bw = 150, W - 150 - 4
    s = Svg(W, 232, "r1fmatch", "How the real master BQ matched today's Pustaka, and what the publish diff counted")

    def stack(y, title, sub, parts, total):
        s.text(0, y + 11, title, 10, "sans", 700, INK)
        s.text(0, y + 24, sub, 8.8, "mono", 500, SLATE)
        x = x0
        for lab, n, col, tcol in parts:
            w = n / total * bw
            s.rect(x, y, w, 32, col)
            s.text(x + w / 2, y + 21, n, 12, "mono", 800, tcol, "middle")
            s.text(x + w / 2, y + 47, lab, 8.8, "sans", 600, INK, "middle")
            x += w

    stack(8, "New book", "465 priced rows", [("exact", 195, DEEP, WHITE), ("reworded", 154, AMBER, WHITE),
                                              ("new", 116, TEAL, WHITE)], 465)
    stack(82, "Today's Pustaka", "386 priced rows", [("exact", 195, DEEP, WHITE), ("reworded", 154, AMBER, WHITE),
                                                     ("removed", 37, SLATE, WHITE)], 465)
    stack(156, "Publish diff vs base", "503 rows counted", [("unchanged", 140, tint(SLATE, 0.45), INK),
                                                            ("rate changed", 101, AMBER, WHITE),
                                                            ("wording", 107, TEAL, WHITE),
                                                            ("added", 117, DEEP, WHITE),
                                                            ("removed", 38, SLATE, WHITE)], 503)
    s.save(out("f_match"))


def f_flow():
    W, H = FULL, 150
    s = Svg(W, H, "r1fflow", "Import, decide, publish: the path an Excel file takes into a contract")
    mkp = s.arrow_marker("p", PURPLE)
    mka = s.arrow_marker("a", AMBER)
    n, gap = 5, 16
    bw = (W - gap * (n - 1)) / n
    steps = [("1 Read", "SheetJS parses the file in the browser; every rate and unit is copied from its cell"),
             ("2 Match", "EXACT, CODE, FUZZY or NEW against the old book; unsure pairs stay PENDING"),
             ("3 Import", "POST /versions/import makes a DRAF version and its match rows (201)"),
             ("4 Decide", "an officer accepts or rejects each PENDING match (PATCH, 200)"),
             ("5 Publish", "TERBIT with a message; diff stats are logged (200)")]
    for k, (t, sub) in enumerate(steps):
        x = k * (bw + gap)
        solid = k == 4
        box(s, x, 8, bw, 98, t, sub, PURPLE if solid else WHITE, PURPLE, tcol=PAPER if solid else PURPLE,
            scol=PAPER if solid else INK, tsize=10.5, ssize=8.8, bar=None if solid else PURPLE)
        if k < n - 1:
            arrow(s, [(x + bw + 1, 57), (x + bw + gap - 2, 57)], PURPLE, 1.6, marker=mkp)
    xr = 3 * (bw + gap) + bw
    arrow(s, [(xr + gap / 2, 112), (xr + gap / 2, 126)], AMBER, 1.4, marker=mka)
    s.text(xr + gap / 2, 142, "publish before step 4 is done: 409 (call 17)", 9, "mono", 700, AMBER, "end")
    s.save(out("f_flow"))


def f_tests():
    W, H = HALF, 128
    s = Svg(W, H, "r1ftests", "Test counts: F alone, with O's tests, and on the merged code")
    rows = [("F, first green run", 70, TEAL, "9 files, 5 skipped"),
            ("after the vitest include", 81, DEEP, "adds O's 11 tests"),
            ("merged code (lead)", 104, DEEP, "5 skipped")]
    x0, sc = 118, (W - 118 - 40) / 104
    y = 6
    for lab, n, col, note in rows:
        s.text(0, y + 12, lab, 9.4, "sans", 600, INK)
        s.rect(x0, y, n * sc, 18, col)
        s.text(x0 + n * sc + 5, y + 13, n, 10.5, "mono", 800, INK)
        s.text(x0, y + 31, note, 8.4, "mono", 500, SLATE)
        y += 40
    s.save(out("f_tests"))


def f_lines():
    rows = [("API.md", 1590), ("functions/api (11 files)", 1056), ("domain source (10)", 1039),
            ("domain tests + fixture (10)", 653), ("hooks (4)", 198), ("migrations (2)", 121), ("lib/excel (2)", 78)]
    W = HALF
    H = len(rows) * 22 + 6
    s = Svg(W, H, "r1flines", "Lines written by F, by file group")
    x0, sc = 126, (W - 126 - 40) / 1600
    for k, (lab, n) in enumerate(rows):
        y = 2 + k * 22
        s.text(0, y + 12, lab, 9, "sans", 500, INK)
        s.rect(x0, y + 1, n * sc, 14, TEAL if "API" not in lab else SLATE)
        s.text(x0 + n * sc + 4, y + 12, fmt(n), 9, "mono", 700, INK)
    s.save(out("f_lines"))


# ------------------------------------------------------------------------------------------------ chapter 05 (D)
CONTRAST = [  # label, hex pair, ratio, status
    ("Ink on emerald-bright (button)", "#14211F/#10B981", 6.53, "ok"),
    ("Muted on paper", "#5B6B68/#F7F5EF", 5.14, "ok"),
    ("Muted on surface (white)", "#5B6B68/#FFFFFF", 5.6, "ok"),
    ("Ink on paper", "#14211F/#F7F5EF", 15.2, "ok"),
    ("Kontrak purple on its tint", "#3B2E8C/#EEEBF8", 9.14, "ok"),
    ("Amber on its tint, first try", "#B45309/#FCF1DE", 4.49, "fail"),
    ("Amber on its tint, after the fix", "#B45309/#FDF4E4", 4.6, "fixed"),
    ("Danger on its tint", "#B42318/#FCEBE8", 5.69, "ok"),
    ("Emerald-deep on its tint", "#047857/#E6F4EC", 4.84, "ok"),
    ("White on kontrak purple", "#FFFFFF/#3B2E8C", 10.74, "ok"),
    ("Paper on ink", "#F7F5EF/#14211F", 15.2, "ok"),
    ("Muted on paper-deep", "#5B6B68/#EFEBE1", 4.71, "ok"),
]


def d_contrast():
    W = FULL
    row = 21
    H = 26 + len(CONTRAST) * row + 26
    s = Svg(W, H, "r1dcontrast", "WCAG contrast ratios of the text colour pairs in the design system")
    x0, sc = 330, (W - 330 - 48) / 16
    s.text(0, 12, "TEXT / BACKGROUND PAIR", 8.8, "mono", 700, SLATE, ls=0.5)
    s.text(206, 12, "HEX", 8.8, "mono", 700, SLATE, ls=0.5)
    s.text(x0, 12, "CONTRAST RATIO", 8.8, "mono", 700, SLATE, ls=0.5)
    s.line(0, 18, W, 18, INK, 1.2)
    for k, (lab, hexes, ratio, state) in enumerate(CONTRAST):
        y = 26 + k * row
        col = {"ok": DEEP, "fail": AMBER, "fixed": TEAL}[state]
        s.text(0, y + 12, lab, 9.6, "sans", 600 if state != "ok" else 500, INK)
        s.text(206, y + 12, hexes, 8.4, "mono", 500, SLATE)
        s.rect(x0, y + 1, ratio * sc, 14, col)
        s.text(x0 + ratio * sc + 5, y + 12, f"{ratio:.2f}", 9.6, "mono", 700, AMBER if state == "fail" else INK)
    s.line(x0 + 4.5 * sc, 20, x0 + 4.5 * sc, 26 + len(CONTRAST) * row, INK, 1.2, 'stroke-dasharray="4 3"')
    s.text(x0 + 4.5 * sc + 4, H - 6, "4.5 = WCAG AA for body text", 8.8, "mono", 700, INK)
    s.save(out("d_contrast"))


def d_lines():
    rows = [("components/ui (21 files)", 805), ("entries/kit.tsx", 313), ("public/theme.css", 145), ("DESIGN.md", 113),
            ("Sidebar.tsx", 71), ("tw-config.js", 39), ("global.css, AppShell, Sheet", 39)]
    assert 16 + 13 + 10 == 39
    W = HALF
    H = len(rows) * 22 + 6
    s = Svg(W, H, "r1dlines", "Lines new or changed by D, by file")
    x0, sc = 138, (W - 138 - 34) / 820
    for k, (lab, n) in enumerate(rows):
        y = 2 + k * 22
        s.text(0, y + 12, lab, 9, "sans", 500, INK)
        s.rect(x0, y + 1, n * sc, 14, DEEP)
        s.text(x0 + n * sc + 4, y + 12, fmt(n), 9, "mono", 700, INK)
    s.save(out("d_lines"))


# ------------------------------------------------------------------------------------------------ chapter 06 (P2)
CHECKS = [
    ("LOGIN AND BIND", ["login pja01", "new project: AKTIF bound", "picker names the contract", "2 items priced from book"]),
    ("RE-PRICE", ["import matches both rows", "preview: 1 KADAR row", "total diff = qty x delta", "apply binds contract",
                  "apply: kos = preview"]),
    ("ROW INDICATOR", ["indicator on changed row", "Kekal keeps old rate", "Guna baharu: new rate"]),
    ("BANNER AND LOCK", ["banner: DITUTUP + draf", "API refuses swap: 423", "UI: lock + apply off", "Buka kunci swaps",
                         "unlock + re-price logged"]),
]


def p2_checks():
    assert sum(len(c[1]) for c in CHECKS) == 17
    W = FULL * 0.84
    gap = 12
    cw = (W - 3 * gap) / 4
    H = 26 + 5 * 22 + 4
    s = Svg(W, H, "r1p2checks", "The 17 checks of the P2 spec, grouped")
    n = 1
    for g, (title, items) in enumerate(CHECKS):
        x = g * (cw + gap)
        s.rect(x, 0, cw, 18, INK)
        s.text(x + 7, 12.5, title, 8.6, "mono", 800, PAPER, ls=0.5)
        for k, it in enumerate(items):
            y = 26 + k * 22
            s.rect(x, y, 17, 17, DEEP)
            s.text(x + 8.5, y + 12.5, n, 9, "mono", 800, WHITE, "middle")
            s.text(x + 24, y + 12.5, it, 9, "sans", 500, INK)
            n += 1
    s.save(out("p2_checks"))


def p2_parity():
    W, H = HALF, 176
    s = Svg(W, H, "r1p2parity", "Money parity: old inline rules against the new policy-fed rules")
    rows = [("First run, before the fix", 2940, 9, AMBER, "fields"),
            ("After the cent-compare fix", 2940, 0, DEEP, "fields"),
            ("Synthetic LAD and LoC sweep", 6860, 0, DEEP, "cases")]
    sc = (W - 70 - 10 - 64) / 6860
    y = 4
    for lab, n, d, col, unit in rows:
        s.text(0, y + 11, lab, 9.6, "sans", 700, INK)
        w = n * sc
        s.rect(0, y + 18, w, 14, tint(AMBER, 0.55) if d else tint(DEEP, 0.55))
        s.text(w + 5, y + 29, f"{fmt(n)} {unit}", 8.6, "mono", 500, SLATE)
        bx = W - 70
        s.rect(bx, y + 1, 70, 32, col)
        s.text(bx + 35, y + 17, d, 14, "mono", 800, WHITE, "middle")
        s.text(bx + 35, y + 28, "diffs", 8.4, "mono", 700, WHITE, "middle")
        y += 54
    s.save(out("p2_parity"))


def p2_lines():
    assert 149 + 177 + 105 + 69 + 60 + 44 + 124 + 42 + 45 == 815 and 1790 - 1629 == 161
    W = HALF
    rows = [("ProjectDetail.tsx", 1790, 1629), ("BQEditor.tsx", 2043, 2046), ("BQPelarasanEditor.tsx", 1766, 1757)]
    H = 3 * 40 + 52
    s = Svg(W, H, "r1p2lines", "Lines before and after in the three big P2 files, plus the nine new files")
    x0, sc = 112, (W - 112 - 40) / 2100
    y = 2
    for lab, a, b in rows:
        s.text(0, y + 20, lab, 9, "sans", 600, INK)
        s.rect(x0, y, a * sc, 14, mix(SLATE, PAPER, 0.55))
        s.text(x0 + a * sc + 4, y + 11, fmt(a), 8.6, "mono", 500, SLATE)
        s.rect(x0, y + 17, b * sc, 14, DEEP)
        s.text(x0 + b * sc + 4, y + 28, fmt(b), 8.6, "mono", 700, INK)
        y += 40
    s.text(0, y + 20, "9 new files", 9, "sans", 600, INK)
    s.rect(x0, y + 4, 815 * sc, 14, TEAL)
    s.text(x0 + 815 * sc + 4, y + 15, "815", 8.6, "mono", 700, INK)
    s.text(0, y + 44, "grey = before, green = after, teal = new", 8.2, "mono", 500, SLATE)
    s.save(out("p2_lines"))


def main():
    os.makedirs(OUT, exist_ok=True)
    cover()
    model()
    lifecycle()
    gantt()
    total = cost()
    f_match()
    f_flow()
    f_tests()
    f_lines()
    d_contrast()
    d_lines()
    p2_checks()
    p2_parity()
    p2_lines()
    six = round(sum(c[4] for c in COST if c[5] != 0), 2)
    print("charts_r1 ok; total cost", total, "six builders", six, "wall sum", sum(c[2] for c in COST if c[2]))


if __name__ == "__main__":
    main()
