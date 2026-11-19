"""Hand-designed diagrams (SVG) for the report: architecture, status machine, BQ flow, analogy, unsafe moves,
Option B ER diagram and contract lifecycle. Called by charts.main(). Content follows FINDINGS-system.md §2.5/§4.2/§4.5
and FINDINGS-bq.md 'Current flow', 'What goes wrong', 'Option B' (file:line cited in the chapters, not here).
Colour code: purple = contract / rate book, emerald/teal = system, amber = risk, slate = secondary.
"""
import os

from svgkit import (AMBER, DEEP, EM, INK, PAPER, PURPLE, SLATE, STATUS_COL, STATUSES, TEAL, WHITE, Svg, mix, px,
                    tint, wrap)

FULL = px(174)
LINE = mix(PAPER, INK, 0.75)


def box(s, x, y, w, h, title, sub="", fill=WHITE, stroke=INK, tcol=INK, scol=None, tsize=11, ssize=9.5,
        tfam="sans", bar=None, dashed=False, align="start"):
    extra = 'stroke-dasharray="4 3"' if dashed else ""
    s.rect(x, y, w, h, fill, stroke, 1, extra)
    if bar:
        s.rect(x, y, 4, h, bar)
    pad = 10 if bar else 8
    tx = x + pad if align == "start" else x + w / 2
    yy = y + tsize + 6
    for ln in wrap(title, tsize, w - pad - 6, tfam):
        s.text(tx, yy, ln, tsize, tfam, 600 if tfam != "mono" else 700, tcol, align if align != "start" else "start")
        yy += tsize * 1.2
    if sub:
        yy += 1
        for ln in wrap(sub, ssize, w - pad - 6):
            s.text(tx, yy, ln, ssize, "sans", 400, scol or mix(tcol, PAPER, 0.25), align if align != "start" else "start")
            yy += ssize * 1.3
    if yy - ssize * 0.9 > y + h:
        print(f"WARN box text overflows: {s.sid} '{title}' needs {yy - y:.0f}px, has {h}")
    return yy


def arrow(s, pts, color=INK, sw=1.2, dashed=False, marker=None):
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    extra = f'marker-end="{marker}"' if marker else ""
    if dashed:
        extra += ' stroke-dasharray="4 3"'
    s.path(d, color, sw, "none", extra)


def danger(s, x, y, n):
    s.rect(x - 9, y - 9, 18, 18, AMBER)
    s.text(x, y + 4.5, n, 11, "mono", 800, PAPER, "middle")


# ---------------------------------------------------------------- architecture
def arch(path):
    W, H = FULL, 404
    s = Svg(W, H, "arch", "InfraHub architecture")
    mk = s.arrow_marker("a", INK)
    cw, g = (W - 60) / 4, 20
    X = [i * (cw + g) for i in range(4)]
    r1, r2, r3, bh = 28, 114, 192, 64
    s.rect(0, 0, W, 236, tint(EM, 0.88))
    s.text(8, 16, "IN THE BROWSER  ·  React 19 + Vite, multi-page", 9.5, "mono", 700, DEEP, ls=0.4)
    s.rect(0, 250, W, H - 250, tint(TEAL, 0.86))
    s.text(8, 266, "ON CLOUDFLARE  ·  Pages Functions + Hono, D1 (SQLite), R2", 9.5, "mono", 700, mix(TEAL, INK, 0.4),
           ls=0.4)
    kw = dict(tsize=10.5)
    box(s, X[0] + 8, r1, cw - 8, bh, "8 HTML entry pages", "dashboard, projects, project, settings…", **kw)
    box(s, X[1], r1, cw, bh, "entries/*.tsx", "mountPage(): React root + query client", **kw)
    box(s, X[2], r1, cw, bh, "pages/*.tsx (16)", "ProjectDetail = the 4-phase form", bar=AMBER, **kw)
    box(s, X[3], r1, cw - 8, bh, "components/ (~80)", "AppShell, mobile cards, BQ helpers", **kw)
    box(s, X[0] + 8, r2, cw - 8, bh, "apiService.ts", "one class, ~50 methods, fetch('/api/…')", **kw)
    box(s, X[1], r2, cw, bh, "hooks/ react-query", "useProjects, useSettings(year)", **kw)
    box(s, X[2], r2, cw, bh, "services/finance.ts", "LAD constants (re-typed in the form too)", **kw)
    box(s, X[3], r2, cw - 8, bh, "services/pdf/ (11)", "jsPDF + autotable from a CDN", **kw)
    box(s, X[3], r3, cw - 8, 32, "PDF files to user", "", fill="none", dashed=True, tsize=10)
    for a, b in ((X[0] + cw, X[1]), (X[1] + cw, X[2]), (X[2] + cw, X[3])):
        arrow(s, [(a + 1, r1 + bh / 2), (b - 2, r1 + bh / 2)], marker=mk)
    arrow(s, [(X[2] + cw * 0.3, r1 + bh), (X[2] + cw * 0.3, r1 + bh + 11), (X[1] + cw * 0.5, r1 + bh + 11),
              (X[1] + cw * 0.5, r2 - 2)], marker=mk)
    arrow(s, [(X[2] + cw * 0.6, r1 + bh), (X[2] + cw * 0.6, r2 - 2)], marker=mk)
    arrow(s, [(X[1], r2 + bh / 2), (X[0] + cw + 2, r2 + bh / 2)], marker=mk)
    arrow(s, [(X[2] + cw * 0.85, r1 + bh), (X[2] + cw * 0.85, r1 + bh + 7), (X[3] + cw * 0.5, r1 + bh + 7),
              (X[3] + cw * 0.5, r2 - 2)], marker=mk)
    arrow(s, [(X[3] + cw * 0.5, r2 + bh), (X[3] + cw * 0.5, r3 - 2)], marker=mk, dashed=True)
    r4 = 282
    arrow(s, [(X[0] + cw * 0.5, r2 + bh), (X[0] + cw * 0.5, r4 - 2)], color=INK, sw=1.6, marker=mk)
    s.rect(X[0] + cw * 0.5 + 8, 200, 118, 30, PAPER)
    s.text(X[0] + cw * 0.5 + 14, 212, "fetch /api/*", 10, "mono", 700, INK)
    s.text(X[0] + cw * 0.5 + 14, 225, "JSON over HTTPS", 9.5, "sans", 400, SLATE)
    box(s, X[0] + 8, r4, cw - 8, bh, "Hono app at /api", "functions/api/[[route]].ts", **kw)
    box(s, X[1], r4, cw, bh, "routes/ (6 routers)", "projects, users, system, storage…", **kw)
    box(s, X[2], r4, cw, bh, "repositories/ (7)", "ProjectRepository maps ~66 fields", **kw)
    box(s, X[3], r4, cw - 8, bh, "D1 · infrahub-db", "8 tables · BQs as JSON in projects",
        fill=DEEP, stroke=DEEP, tcol=PAPER, scol=tint(EM, 0.7), **kw)
    box(s, X[3], r4 + bh + 8, cw - 8, 44, "R2 bucket", "staged photos, 24 h", fill=mix(TEAL, INK, 0.3),
        stroke=mix(TEAL, INK, 0.3), tcol=PAPER, scol=tint(TEAL, 0.7), **kw)
    for a, b in ((X[0] + cw, X[1]), (X[1] + cw, X[2]), (X[2] + cw, X[3])):
        arrow(s, [(a + 1, r4 + bh / 2), (b - 2, r4 + bh / 2)], marker=mk)
    arrow(s, [(X[2] + cw * 0.7, r4 + bh), (X[2] + cw * 0.7, r4 + bh + 30), (X[3] - 2, r4 + bh + 30)], marker=mk)
    s.save(path)


# ---------------------------------------------------------------- status machine
def states(path):
    W, H = FULL, 360
    s = Svg(W, H, "states", "Six statuses and what moves a project between them")
    mk = s.arrow_marker("a", INK)
    mka = s.arrow_marker("am", AMBER)
    mks = s.arrow_marker("s", SLATE)
    bw, g = 92, (W - 6 * 92) / 5
    X = [i * (bw + g) for i in range(6)]
    by, bh = 86, 84
    names = {"FASA_DRAF": ("FASA", "DRAF"), "MENUNGGU_LANTIKAN": ("MENUNGGU", "LANTIKAN"),
             "DALAM_PROSES": ("DALAM", "PROSES"), "PEMERIKSAAN_TAPAK": ("PEMERIKSAAN", "TAPAK"),
             "TUNTUTAN_BAYARAN": ("TUNTUTAN", "BAYARAN"), "SIAP": ("SIAP", "")}
    meaning = {"FASA_DRAF": "PJA opens the file and prices the BQ", "MENUNGGU_LANTIKAN": "file opened, no company yet",
               "DALAM_PROSES": "company appointed, work running", "PEMERIKSAAN_TAPAK": "site finished, inspected",
               "TUNTUTAN_BAYARAN": "claim lodged", "SIAP": "matched with Kewangan"}
    for i, st in enumerate(STATUSES):
        x = X[i]
        s.rect(x, by, bw, bh, WHITE, INK, 1)
        s.rect(x, by, bw, 6, STATUS_COL[st])
        a, b = names[st]
        s.text(x + 7, by + 22, a, 10, "mono", 800, INK)
        if b:
            s.text(x + 7, by + 34, b, 10, "mono", 800, INK)
        yy = by + (50 if b else 38)
        for ln in wrap(meaning[st], 9, bw - 12):
            s.text(x + 7, yy, ln, 9, "sans", 500, SLATE)
            yy += 11
    # main arrows
    for i in range(5):
        arrow(s, [(X[i] + bw + 1, by + 36), (X[i + 1] - 2, by + 36)], sw=1.6, marker=mk)
    # skip arcs above
    def arc(x1, x2, level, col, label, mkr, dash=False, label_x=None):
        ytop = by - 16 - level * 26
        arrow(s, [(x1, by - 1), (x1, ytop), (x2, ytop), (x2, by - 3)], color=col, sw=1.2, dashed=dash, marker=mkr)
        lx = label_x if label_x is not None else (x1 + x2) / 2
        tw = len(label) * 9 * 0.56 + 10
        s.rect(lx - tw / 2, ytop - 7, tw, 13, PAPER)
        s.text(lx, ytop + 3.5, label, 9, "sans", 600, col, "middle")
    arc(X[0] + bw * 0.5, X[2] + bw * 0.25, 0, DEEP, "company chosen straight from draft", mk)
    arc(X[2] + bw * 0.55, X[4] + bw * 0.4, 0, SLATE, "dates typed out of order (seen in 2 projects)", mks, True)
    arc(X[5] + bw * 0.5, X[2] + bw * 0.8, 1, AMBER, "SIAP back to DALAM PROSES if the company field is edited (code path)",
        mka, True, label_x=(X[2] + X[5] + bw * 1.3) / 2)
    # trigger cards
    trig = [("MANUAL", "Status drop-down in the header or card quick-edit. The only way in.", ""),
            ("AUTOMATIC", "Nama Syarikat chosen", ""),
            ("AUTOMATIC", "Tarikh Pemeriksaan entered", "+ Peratus Siap = 100"),
            ("AUTOMATIC", "Tarikh Tuntutan Bayaran entered", "+ Peratus Siap = 100"),
            ("AUTOMATIC", "Tarikh Padanan entered", "+ Peratus Siap = 100")]
    cy, cw = by + bh + 24, 106
    for i, (kind, t, extra) in enumerate(trig):
        cx = X[i] + bw + g / 2
        s.line(cx, by + 40, cx, cy, LINE, 0.8, 'stroke-dasharray="2 2"')
        x = min(max(cx - cw / 2, 0), W - cw)
        col = AMBER if kind == "MANUAL" else DEEP
        s.rect(x, cy, cw, 16, col)
        s.text(x + 6, cy + 11.5, kind, 9, "mono", 800, PAPER, ls=0.6)
        s.rect(x, cy + 16, cw, 70, WHITE, col, 1)
        yy = cy + 31
        for ln in wrap(t, 9.5, cw - 12):
            s.text(x + 6, yy, ln, 9.5, "sans", 600, INK)
            yy += 12
        if extra:
            s.text(x + 6, yy + 2, extra, 8.5, "mono", 500, SLATE)
    # phase band
    py = cy + 104
    s.text(0, py - 6, "WHICH TAB OF THE PROJECT FORM DOES THE WORK", 9, "mono", 700, SLATE, ls=0.4)
    phases = [(0, 0, "1 · BQ Building", "PJA", tint(EM, 0.55)), (1, 2, "2 · File Creation", "PT", tint(SLATE, 0.62)),
              (3, 4, "3 · Pelarasan", "PJA", tint(EM, 0.55)), (5, 5, "4 · Penutup", "PT", tint(SLATE, 0.62))]
    for a, b, lab, who, col in phases:
        x1, x2 = X[a], X[b] + bw
        s.rect(x1, py, x2 - x1, 30, col)
        s.text(x1 + 6, py + 13, lab, 9.5, "sans", 700, INK)
        s.text(x1 + 6, py + 25, who, 9, "mono", 700, INK)
    s.save(path)


# ---------------------------------------------------------------- analogy
def analogy(path):
    W, H = round(FULL * 0.86, 2), 236
    s = Svg(W, H, "analogy", "Menu and receipt analogy")
    mk = s.arrow_marker("a", INK)
    mka = s.arrow_marker("am", AMBER)
    pw = 172
    g = (W - 3 * pw) / 2
    X = [0, pw + g, 2 * (pw + g)]
    items = [("Konkrit 100mm tebal", "50.61"), ("Longkang 225mm", "23.04"), ("Insurans RM25k+", "510.00")]
    # menu
    x = X[0]
    s.rect(x, 0, pw, 200, WHITE, INK, 1)
    s.rect(x, 0, pw, 34, INK)
    s.text(x + 10, 15, "THE MENU", 9.5, "mono", 800, PAPER, ls=0.8)
    s.text(x + 10, 28, "= Pustaka BQ (library_groups)", 9.5, "sans", 500, tint(EM, 0.6))
    for k, (a, r) in enumerate(items):
        y = 58 + k * 24
        s.text(x + 10, y, a, 10, "sans", 500, INK)
        s.text(x + pw - 10, y, r, 10, "mono", 700, INK, "end")
        s.line(x + 10, y + 7, x + pw - 10, y + 7, mix(PAPER, INK, 0.12), 0.8)
    s.text(x + 10, 140, "… 499 priced points in all", 9.5, "sans", 400, SLATE)
    s.rect(x + 10, 154, 80, 18, AMBER)
    s.text(x + 16, 167, "NO DATE", 9.5, "mono", 800, PAPER, ls=0.6)
    s.rect(x + 94, 154, 74, 18, AMBER)
    s.text(x + 99, 167, "NO CONTRACT", 9, "mono", 800, PAPER)
    s.text(x + 10, 190, "one menu for the whole site", 9.5, "sans", 600, INK)
    # receipt
    x = X[1]
    s.rect(x, 0, pw, 200, WHITE, INK, 1)
    s.rect(x, 0, pw, 34, DEEP)
    s.text(x + 10, 15, "THE RECEIPT", 9.5, "mono", 800, PAPER, ls=0.8)
    s.text(x + 10, 28, "= project BQ (bq_data)", 9.5, "sans", 500, tint(EM, 0.7))
    for k, (a, r) in enumerate(items):
        y = 58 + k * 24
        s.text(x + 10, y, a, 10, "sans", 500, INK)
        s.text(x + pw - 10, y, r, 10, "mono", 700, DEEP, "end")
        s.line(x + 10, y + 7, x + pw - 10, y + 7, mix(PAPER, INK, 0.12), 0.8)
    s.text(x + 10, 140, "prices copied when ordered", 9.5, "sans", 400, SLATE)
    s.rect(x + 10, 154, pw - 20, 18, DEEP)
    s.text(x + 16, 167, "KEEPS ITS PRICES", 9.5, "mono", 800, PAPER, ls=0.6)
    s.text(x + 10, 190, "95.95% still equal today's menu", 9.5, "sans", 600, INK)
    # order more
    x = X[2]
    s.rect(x, 0, pw, 200, WHITE, AMBER, 1.5)
    s.rect(x, 0, pw, 34, AMBER)
    s.text(x + 10, 15, "ORDER MORE ON AN OLD BILL", 9.5, "mono", 800, PAPER)
    s.text(x + 10, 28, "= add item, template, pelarasan", 9.5, "sans", 500, PAPER)
    rows = ["Tambah Item", "Apply a template", "Add a BQ Pelarasan item"]
    for k, a in enumerate(rows):
        y = 58 + k * 24
        s.rect(x + 10, y - 10, 14, 14, AMBER)
        s.text(x + 17, y + 1, k + 1, 9, "mono", 800, PAPER, "middle")
        s.text(x + 30, y, a, 10, "sans", 600, INK)
    for k, ln in enumerate(wrap("Each one reads TODAY'S menu. Change the menu and an open 2026 bill quietly mixes "
                                "two price lists.", 9.5, pw - 20)):
        s.text(x + 10, 138 + k * 12.5, ln, 9.5, "sans", 500, INK)
    s.text(x + 10, 190, "the danger is here", 9.5, "sans", 700, AMBER)
    arrow(s, [(X[0] + pw + 2, 100), (X[1] - 3, 100)], marker=mk)
    s.text((X[0] + pw + X[1]) / 2, 92, "copy", 9, "mono", 700, INK, "middle")
    arrow(s, [(X[1] + pw + 2, 100), (X[2] - 3, 100)], AMBER, marker=mka)
    s.text((X[1] + pw + X[2]) / 2, 92, "later", 9, "mono", 700, AMBER, "middle")
    s.text(0, 226, "Rates shown are real library rates today (FINDINGS-bq M5); the rest is analogy.", 9, "mono", 400,
           SLATE)
    s.save(path)


# ---------------------------------------------------------------- current BQ flow
def bq_flow(path):
    W, H = FULL, 552
    s = Svg(W, H, "bqflow", "How a rate travels today")
    mk = s.arrow_marker("a", INK)
    mke = s.arrow_marker("e", DEEP)
    mka = s.arrow_marker("am", AMBER)
    mkp = s.arrow_marker("p", PURPLE)
    cx, cw = 236, 214
    # row A
    box(s, 0, 8, 150, 58, "PT / Admin", "Tetapan › Pustaka BQ, button Simpan Pustaka", bar=SLATE)
    s.rect(cx, 0, cw, 78, INK)
    s.text(cx + 10, 18, "library_groups", 12, "mono", 700, PAPER)
    s.text(cx + 10, 33, "the one global master BQ", 9.5, "sans", 500, tint(EM, 0.6))
    s.text(cx + 10, 49, "107 groups · 499 priced points", 9.5, "mono", 500, PAPER)
    s.text(cx + 10, 66, "NO YEAR · NO CONTRACT · NO HISTORY", 9, "mono", 800, AMBER, ls=0.3)
    box(s, 500, 8, W - 500, 58, "templates (9)", "rows re-priced from the library when applied", bar=SLATE)
    arrow(s, [(151, 30), (cx - 3, 30)], AMBER, 1.6, marker=mka)
    s.text(0, 84, "SIMPAN = DELETE ALL + RE-INSERT", 8.5, "mono", 800, AMBER)
    s.text(0, 96, "no copy kept, no date recorded", 8.5, "mono", 600, AMBER)
    # row B: editor
    ry = 128
    box(s, cx, ry, cw, 54, "BQ Editor · PJA, phase 1", "loads library + templates once, when the page opens",
        bar=EM)
    arrow(s, [(cx + cw / 2, 79), (cx + cw / 2, ry - 2)], marker=mk)
    s.text(cx + cw / 2 + 6, 104, "loaded once", 9, "mono", 600, SLATE)
    arrow(s, [(578, 67), (578, ry + 27), (cx + cw + 3, ry + 27)], marker=mk)
    # row C: bq_data
    rc = 256
    s.rect(cx, rc, cw, 58, DEEP)
    s.text(cx + 10, rc + 20, "projects.bq_data", 12, "mono", 700, PAPER)
    s.text(cx + 10, rc + 36, "the contract BQ: copied rows", 9.5, "sans", 500, tint(EM, 0.7))
    s.text(cx + 10, rc + 50, "+ sourceGroupId / ItemId / VariantId", 9, "mono", 500, tint(EM, 0.7))
    arrow(s, [(cx + 60, ry + 55), (cx + 60, rc - 2)], DEEP, 1.6, marker=mke)
    danger(s, cx + 60, ry + 92, "1")
    for k, ln in enumerate(["Tambah Item: COPY", "description + unit +", "rate + the 3 ids", "(reads TODAY's rate)"]):
        s.text(cx - 6, ry + 74 + k * 12, ln, 9.5, "sans", 600 if k < 3 else 700, INK if k < 3 else AMBER, "end")
    arrow(s, [(cx + cw - 50, ry + 55), (cx + cw - 50, rc - 2)], DEEP, 1.6, marker=mke)
    danger(s, cx + cw - 50, ry + 92, "2")
    for k, ln in enumerate(["Apply template:", "rate + unit re-read", "from the library"]):
        s.text(cx + cw - 32, ry + 74 + k * 12, ln, 9.5, "sans", 600, INK if k < 1 else AMBER)
    box(s, 500, rc + 6, W - 500, 46, "kos_projek", "= sum of row amounts", bar=DEEP, tfam="mono", tsize=10.5)
    arrow(s, [(cx + cw + 1, rc + 29), (500 - 3, rc + 29)], marker=mk)
    # row D: pelarasan
    rd = 392
    s.rect(cx, rd, cw, 58, mix(TEAL, INK, 0.25))
    s.text(cx + 10, rd + 20, "projects.bq_data_pelarasan", 11, "mono", 700, PAPER)
    s.text(cx + 10, rd + 36, "the adjusted BQ: a deep copy", 9.5, "sans", 500, tint(TEAL, 0.7))
    s.text(cx + 10, rd + 50, "+ isAdjustment rows", 9, "mono", 500, tint(TEAL, 0.7))
    arrow(s, [(cx + cw / 2, rc + 59), (cx + cw / 2, rd - 2)], marker=mk)
    s.text(cx + cw / 2 + 6, rc + 86, "Mulakan Pelarasan:", 9.5, "sans", 600, INK)
    s.text(cx + cw / 2 + 6, rc + 98, "deep copy (JSON)", 9.5, "sans", 600, INK)
    # bypass from library to pelarasan (danger 3)
    bx = 200
    arrow(s, [(cx - 1, 60), (bx, 60), (bx, rd + 22), (cx - 3, rd + 22)], AMBER, 1.6, marker=mka)
    danger(s, bx, rd - 30, "3")
    for k, ln in enumerate(["Tambah Item in", "BQ Pelarasan:", "TODAY's rate,", "isAdjustment = true"]):
        s.text(bx - 16, rd - 34 + k * 12, ln, 9.5, "sans", 600, AMBER if k in (2, 3) else INK, "end")
    box(s, 470, rd - 22, W - 470, 50, "kos_sebenar", "= min(sum, kos_projek) − LAD − LoC − wang tahanan", bar=DEEP,
        tfam="mono", tsize=10.5)
    box(s, 470, rd + 38, W - 470, 50, "bq_pelarasan_extra", "= max(0, sum − kos_projek): the unpaid overflow",
        bar=AMBER, tfam="mono", tsize=10.5)
    arrow(s, [(cx + cw + 1, rd + 18), (470 - 3, rd + 3)], marker=mk)
    arrow(s, [(cx + cw + 1, rd + 42), (470 - 3, rd + 60)], marker=mk)
    # row E: sebutharga label
    re = 498
    box(s, 0, re, 196, 48, "system_settings", "one row per YEAR · sebutharga_numbers", bar=SLATE)
    s.rect(cx, re, cw, 48, tint(PURPLE, 0.88), PURPLE, 1)
    s.text(cx + 10, re + 18, "projects.no_sebutharga", 11, "mono", 700, PURPLE)
    s.text(cx + 10, re + 34, "a text label chosen in phase 2", 9.5, "sans", 500, PURPLE)
    arrow(s, [(197, re + 24), (cx - 3, re + 24)], PURPLE, 1.2, marker=mkp)
    s.rect(470, re + 4, W - 470, 40, PAPER, AMBER, 1, 'stroke-dasharray="4 3"')
    s.text(480, re + 21, "NOT CONNECTED TO ANY RATE", 9, "mono", 800, AMBER, ls=0.3)
    s.text(480, re + 35, "printed on CPC and notices only", 9.5, "sans", 500, INK)
    arrow(s, [(cx + cw + 1, re + 24), (470 - 3, re + 24)], AMBER, 1, dashed=True)
    s.save(path)


# ---------------------------------------------------------------- unsafe moves
def unsafe(path):
    W, H = round(FULL * 0.88, 2), 228
    s = Svg(W, H, "unsafe", "The two unsafe moves")
    pw = (W - 24) / 2
    for k in range(2):
        x = k * (pw + 24)
        s.rect(x, 0, pw, 24, AMBER)
        s.text(x + 8, 16, f"MOVE {k + 1}", 9.5, "mono", 800, PAPER, ls=0.8)
        s.text(x + 64, 16, ["Type the new rates over the old ones", "Add the new items next to the old"][k], 10.5,
               "sans", 700, PAPER)
    # move 1: one library, overwritten
    x = 0
    lw1 = 108
    s.rect(x, 36, lw1, 116, WHITE, INK, 1)
    s.text(x + 8, 52, "PUSTAKA", 9, "mono", 800, INK, ls=0.6)
    for r in range(4):
        y = 70 + r * 20
        s.text(x + 8, y, f"item {r + 1}", 9.5, "sans", 500, INK)
        s.text(x + lw1 - 8, y, "old" if r == 3 else "NEW", 9, "mono", 800, SLATE if r == 3 else PURPLE, "end")
        if r < 3:
            s.text(x + 66, y, "old", 9, "mono", 500, SLATE, "middle")
            s.line(x + 56, y - 3, x + 76, y - 3, SLATE, 1)
    s.text(x + 8, 166, "2026 schedule gone", 9.5, "sans", 700, AMBER)
    px0 = x + lw1 + 12
    pw0 = pw - lw1 - 12
    s.rect(px0, 36, pw0, 116, WHITE, INK, 1)
    s.text(px0 + 8, 52, "OPEN 2026 PROJECT BQ", 9, "mono", 800, INK, ls=0.3)
    for r in range(4):
        y = 70 + r * 20
        new = r == 3
        s.rect(px0 + 6, y - 11, pw0 - 12, 15, tint(AMBER, 0.75) if new else tint(EM, 0.85))
        s.text(px0 + 10, y, "row added today" if new else f"row {r + 1} (copy)", 9.5, "sans", 600, INK)
        s.text(px0 + pw0 - 10, y, "NEW rate" if new else "old rate", 9, "mono", 700, AMBER if new else DEEP, "end")
    s.text(px0, 166, "two schedules mixed, no warning", 9.5, "sans", 700, AMBER)
    # move 2: doubled library
    x = pw + 24
    lw2 = 140
    s.rect(x, 36, lw2, 116, WHITE, INK, 1)
    s.text(x + 8, 52, "PUSTAKA (DOUBLED)", 9, "mono", 800, INK, ls=0.3)
    for r, (lab, col) in enumerate([("Longkang 225mm · 2026", SLATE), ("Longkang 225mm · 2027", PURPLE),
                                    ("Konkrit 100mm · 2026", SLATE), ("Konkrit 100mm · 2027", PURPLE)]):
        y = 70 + r * 20
        s.rect(x + 8, y - 11, 4, 15, col)
        s.text(x + 17, y, lab, 9.5, "sans", 500, INK)
    s.text(x + 8, 166, "the library grows every year", 9.5, "sans", 700, AMBER)
    px1 = x + lw2 + 12
    s.rect(px1, 36, W - px1, 116, WHITE, INK, 1)
    s.text(px1 + 8, 52, "PJA'S PICKER", 9, "mono", 800, INK, ls=0.3)
    for k, ln in enumerate(wrap("Shows both. Nothing stops the wrong year's item.", 9.5, W - px1 - 16)):
        s.text(px1 + 8, 70 + k * 13, ln, 9.5, "sans", 500, INK)
    s.rect(px1 + 8, 122, 20, 20, AMBER)
    s.text(px1 + 18, 137, "?", 13, "mono", 800, PAPER, "middle")
    s.text(px1 + 34, 136, "which one?", 9.5, "sans", 700, AMBER)
    for k, ln in enumerate(wrap("Both moves: a project priced under the old schedule but awarded under the new one "
                                "has to be re-priced row by row, by hand. No re-price function exists.", 9.5, W)):
        s.text(0, 196 + k * 14, ln, 9.5, "sans", 600, INK)
    s.save(path)


# ---------------------------------------------------------------- Option B ER
def entity(s, x, y, w, name, fields, head, hcol=PAPER, note=""):
    s.rect(x, y, w, 24, head)
    s.text(x + 8, y + 16, name, 10.5, "mono", 800, hcol, ls=0.3)
    h = 24 + len(fields) * 15 + 8
    s.rect(x, y + 24, w, h - 24, WHITE, head, 1)
    for k, (f, kind, hl) in enumerate(fields):
        yy = y + 24 + 15 + k * 15
        s.text(x + 8, yy, f, 9.5, "mono", 700 if hl else 500, PURPLE if hl else INK)
        s.text(x + w - 8, yy, kind, 8.5, "mono", 500, SLATE, "end")
    return y + h


def er_b(path):
    W, H = FULL, 330
    s = Svg(W, H, "erb", "Option B data model")
    mkp = s.arrow_marker("p", PURPLE)
    mks = s.arrow_marker("s", SLATE)
    e1 = entity(s, 0, 0, 196, "contracts", [("id", "PK", False), ("code", "No. Sebutharga", True),
                ("title", "", False), ("valid_from / valid_to", "", False), ("status", "DRAFT|ACTIVE|CLOSED", True),
                ("meeting_number / date", "", False), ("cloned_from", "FK", True),
                ("created / activated / closed_at", "", False)], PURPLE)
    entity(s, 262, 0, 200, "rate_book_groups", [("contract_id", "PK, FK", True), ("id", "PK, same id in clones", False),
           ("title, category", "", False), ("items", "JSON rates", False), ("sort_index", "", False)],
           tint(PURPLE, 0.25))
    entity(s, 522, 0, W - 522, "templates", [("id", "PK", False), ("bills", "ids", False)], SLATE)
    p_end = entity(s, 262, 170, 200, "projects", [("id", "PK", False), ("contract_id", "FK · NEW", True),
                   ("no_sebutharga", "printed value", False), ("bq_data", "JSON copy", False),
                   ("bq_data_pelarasan", "JSON copy", False)], DEEP)
    entity(s, 522, 170, W - 522, "system_settings", [("year", "PK", False), ("companies", "", False),
           ("vote_numbers", "", False)], SLATE)
    arrow(s, [(197, 40), (262 - 3, 40)], PURPLE, 1.6, marker=mkp)
    s.text(229, 33, "owns", 9.5, "sans", 700, PURPLE, "middle")
    s.text(229, 54, "1 to many", 8.5, "mono", 500, PURPLE, "middle")
    arrow(s, [(150, e1 + 1), (150, 214), (262 - 3, 214)], PURPLE, 1.6, marker=mkp)
    s.text(158, e1 + 26, "prices", 9.5, "sans", 700, PURPLE)
    s.text(158, e1 + 38, "1 to many", 8.5, "mono", 500, PURPLE)
    arrow(s, [(40, e1 + 1), (40, e1 + 26), (10, e1 + 26), (10, e1 + 3)], PURPLE, 1.2, dashed=True, marker=mkp)
    s.text(48, e1 + 30, "cloned from", 9.5, "sans", 600, PURPLE)
    arrow(s, [(463, 45), (522 - 3, 45)], SLATE, 1, dashed=True, marker=mks)
    s.text(492, 70, "stable ids", 8.5, "mono", 500, SLATE, "middle")
    arrow(s, [(522, 214), (463 + 3, 214)], SLATE, 1, dashed=True, marker=mks)
    s.text(492, 236, "votes by", 8.5, "mono", 500, SLATE, "middle")
    s.text(492, 247, "year", 8.5, "mono", 500, SLATE, "middle")
    s.text(0, H - 22, "PURPLE = contract things. projects.contract_id is the one new column on an existing table; "
           "no BQ JSON", 9.5, "sans", 500, INK)
    s.text(0, H - 8, "is rewritten. Group, item and variant ids stay identical when a book is cloned.", 9.5, "sans",
           500, INK)
    del p_end
    s.save(path)


# ---------------------------------------------------------------- lifecycle
def lifecycle(path):
    W, H = FULL, 300
    s = Svg(W, H, "life", "Contract lifecycle")
    mkp = s.arrow_marker("p", PURPLE)
    mk = s.arrow_marker("a", INK)
    cols = ["DRAFT", "ACTIVE", "CLOSED"]
    lw = 64
    cw = (W - lw) / 3
    for k, c in enumerate(cols):
        x = lw + k * cw
        s.rect(x + 4, 0, cw - 8, 20, [tint(PURPLE, 0.6), PURPLE, mix(PURPLE, INK, 0.45)][k])
        s.text(x + 12, 14, c, 9.5, "mono", 800, PAPER, ls=0.8)
    s.text(0, 14, "STATUS ›", 9, "mono", 700, SLATE)
    r1, r2, bh = 40, 132, 62
    s.text(0, r1 + 26, "2026", 13, "serif", 800, PURPLE)
    s.text(0, r2 + 26, "2027", 13, "serif", 800, PURPLE)
    def cbox(col, y, title, sub, fill, tc):
        x = lw + col * cw + 4
        s.rect(x, y, cw - 8, bh, fill, PURPLE, 1)
        s.text(x + 8, y + 17, title, 10, "mono", 800, tc)
        for k, ln in enumerate(wrap(sub, 9.5, cw - 24)):
            s.text(x + 8, y + 33 + k * 12, ln, 9.5, "sans", 500, tc)
        return x
    cbox(1, r1, "MPS/SH/302/25", "rate book 2026, served to new projects", PURPLE, PAPER)
    cbox(2, r1, "MPS/SH/302/25", "read-only book, still served to its own projects", tint(PURPLE, 0.82), PURPLE)
    cbox(0, r2, "next sebutharga", "a full copy of the 2026 book; PT edits the rates", WHITE, PURPLE)
    cbox(1, r2, "next sebutharga", "rate book 2027, served to new projects", PURPLE, PAPER)
    arrow(s, [(lw + 2 * cw - 3, r1 + bh / 2), (lw + 2 * cw + 2, r1 + bh / 2)], PURPLE, 1.6, marker=mkp)
    s.text(lw + 2 * cw, r1 - 6, "Tutup kontrak", 9.5, "sans", 700, PURPLE, "middle")
    arrow(s, [(lw + cw - 3, r2 + bh / 2), (lw + cw + 2, r2 + bh / 2)], PURPLE, 1.6, marker=mkp)
    s.text(lw + cw, r2 + bh + 14, "edit rates, then Aktifkan", 9.5, "sans", 700, PURPLE, "middle")
    arrow(s, [(lw + cw + 30, r1 + bh), (lw + cw + 30, r1 + bh + 15), (lw + cw * 0.5, r1 + bh + 15),
              (lw + cw * 0.5, r2 - 2)], PURPLE, 1.6, marker=mkp)
    s.text(lw + cw * 0.5 - 6, r1 + bh + 11, "Salin ke kontrak baharu", 9.5, "sans", 700, PURPLE, "end")
    # projects strip
    py = r2 + bh + 30
    s.rect(0, py, W, 40, tint(EM, 0.85))
    s.rect(0, py, 4, 40, DEEP)
    s.text(12, py + 16, "A PROJECT", 9, "mono", 800, DEEP, ls=0.5)
    s.text(12, py + 31, "binds to the ACTIVE contract (choose if two are active); PT confirms at lantikan; "
           "locked once inden exists.", 9.5, "sans", 500, INK)
    for k, ln in enumerate(wrap("Tukar kontrak & harga semula: re-price one project against another book by "
                                "matching ids, showing old rate, new rate and difference per row before anything "
                                "is applied.", 9.5, W - 4)):
        s.text(0, py + 58 + k * 13, ln, 9.5, "sans", 600, INK)
    del mk
    s.save(path)


def main(out):
    for name, fn in (("arch", arch), ("states", states), ("analogy", analogy), ("bq_flow", bq_flow),
                     ("unsafe", unsafe), ("er_b", er_b), ("lifecycle", lifecycle)):
        fn(os.path.join(out, name + ".svg"))
