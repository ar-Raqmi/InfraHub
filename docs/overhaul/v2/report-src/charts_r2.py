"""R2 charts for the v2 Build Report (chapters 07-12). Run: env -u PYTHONPATH ../../pw/bin/python charts_r2.py

Every number is typed from LEAD-FACTS.md or the REPORT-<K|O|P1>.md Evidence blocks (cited in the chapter text);
the only computed values are plain sums/differences of those numbers (marked in the chapter as such).
Output: charts/r2_*.svg (one SVG unit = 1 CSS px, FULL = 174 mm, HALF = 83 mm).
"""
import os

from svgkit import (AMBER, DEEP, EM, INK, PAPER, PURPLE, SLATE, STATUS_COL, STATUSES, TEAL, WHITE, Svg, mix, px,
                    text_width, tint, wrap)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "charts")
FULL, HALF = px(174), px(83)
HAIR = mix(PAPER, INK, 0.12)


def out(name):
    return os.path.join(OUT, name + ".svg")


def hbars(sid, rows, width, label_w, vmax, title="", value_w=84, bar_h=14, gap=9, label_size=10.5, note=None):
    """rows: dict(label, value, color, text, text_color?)."""
    top = 4
    h = top + len(rows) * (bar_h + gap) + (22 if note else 4)
    s = Svg(width, h, sid, title)
    x0, x1 = label_w, width - value_w
    for i, r in enumerate(rows):
        y = top + i * (bar_h + gap)
        s.text(0, y + bar_h - 3, r["label"], label_size, "sans", 500, INK)
        s.rect(x0, y, x1 - x0, bar_h, mix(PAPER, INK, 0.05))
        s.rect(x0, y, (x1 - x0) * r["value"] / vmax, bar_h, r["color"])
        s.text(width, y + bar_h - 3, r["text"], 10, "mono", 600, r.get("text_color", INK), "end")
    if note:
        s.text(0, h - 6, note, 9.5, "mono", 400, SLATE)
    s.save(out(sid))


# ------------------------------------------------------------------ 07 K: where every row went
def k_books():
    W = FULL
    s = Svg(W, 214, "r2_k_books", "Old book of 386 rows and the officer's file of 465 rows, split by what happened to each row")
    x0, scale = 150, 468 / 465
    bar_h = 34
    ytop, ybot = 34, 126
    c_sama, c_kad, c_word, c_new, c_gone = DEEP, EM, AMBER, TEAL, SLATE
    s.text(0, 14, "KESELURUHAN sheet, KONTRAKTOR column, against today's Pustaka", 10, "mono", 600, SLATE)
    # top bar: today's book
    s.text(0, ytop + 14, "Today's Pustaka", 11, "sans", 700)
    s.text(0, ytop + 28, "386 rows (book v1)", 10, "mono", 500, SLATE)
    s.text(0, ybot + 14, "Officer's Excel", 11, "sans", 700)
    s.text(0, ybot + 28, "465 priced rows", 10, "mono", 500, SLATE)
    top = [(195, mix(DEEP, EM, 0.5), "195"), (154, c_word, "154"), (37, c_gone, "37")]
    bot = [(145, c_sama, "145"), (50, c_kad, "50"), (154, c_word, "154"), (116, c_new, "116")]
    x = x0
    tpos = []
    for v, col, lab in top:
        w = v * scale
        s.rect(x, ytop, w, bar_h, col)
        s.text(x + w / 2, ytop + 22, lab, 13, "mono", 700, WHITE, "middle")
        tpos.append((x, x + w))
        x += w
    x = x0
    bpos = []
    for v, col, lab in bot:
        w = v * scale
        s.rect(x, ybot, w, bar_h, col)
        s.text(x + w / 2, ybot + 22, lab, 13, "mono", 700, WHITE, "middle")
        bpos.append((x, x + w))
        x += w
    # connectors: top 195 -> bottom 145+50, top 154 -> bottom 154
    for (ta, tb), (ba, bb), col in [((tpos[0][0], tpos[0][1]), (bpos[0][0], bpos[1][1]), mix(DEEP, EM, 0.5)),
                                    (tpos[1], bpos[2], c_word)]:
        s.add(f'<path d="M{ta:.2f},{ytop + bar_h} L{tb:.2f},{ytop + bar_h} L{bb:.2f},{ybot} L{ba:.2f},{ybot} Z" '
              f'fill="{tint(col, 0.72)}"/>')
    # labels under top bar's gone segment
    gx = (tpos[2][0] + tpos[2][1]) / 2
    s.text(gx, ytop + bar_h + 14, "removed", 10, "sans", 600, c_gone, "middle")
    s.text(gx, ytop + bar_h + 26, "from the book", 9.5, "sans", 400, c_gone, "middle")
    # labels in the band between bars
    s.text((tpos[0][0] + tpos[0][1]) / 2, 81, "same wording: 195 exact", 10.5, "sans", 700, DEEP, "middle")
    s.text((tpos[1][0] + tpos[1][1]) / 2, 81, "reworded: 154 to decide", 10.5, "sans", 700, mix(AMBER, INK, 0.25), "middle")
    # labels under bottom bar
    for (a, b), name, col in zip(bpos, ["Sama", "Kadar berubah", "Perkataan berubah", "Baharu"], [c_sama, c_kad, c_word, c_new]):
        cx = (a + b) / 2
        s.text(cx, ybot + bar_h + 15, name, 10, "sans", 600, mix(col, INK, 0.25), "middle")
    s.text((bpos[3][0] + bpos[3][1]) / 2, ybot + bar_h + 27, "new items", 9.5, "sans", 400, SLATE, "middle")
    s.text((bpos[2][0] + bpos[2][1]) / 2, ybot + bar_h + 27, "reworded", 9.5, "sans", 400, SLATE, "middle")
    s.text((bpos[0][0] + bpos[0][1]) / 2, ybot + bar_h + 27, "unchanged", 9.5, "sans", 400, SLATE, "middle")
    s.text((bpos[1][0] + bpos[1][1]) / 2, ybot + bar_h + 27, "new rate", 9.5, "sans", 400, SLATE, "middle")
    s.save(out("r2_k_books"))


# ------------------------------------------------------------------ 07 K: the 5 import steps
def k_flow():
    W = FULL
    steps = [
        ("1", "Muat naik", "Drop or choose the .xls or .xlsx. Read in the browser.", "read + parse 0.45 s"),
        ("2", "Helaian & lajur", "Pick the sheet and the rate column. Default: the KONTRAKTOR column.", "465 priced rows"),
        ("3", "Pratonton", "Counts, warnings with sheet and row, sum of rates as a cross-check.", "0 warnings"),
        ("4", "Semak padanan", "Old line against new line, side by side. Accept, reject or pick another.", "154 to decide"),
        ("5", "Terbit", "A commit message is required. Publishing makes the new book TERBIT.", "195/154/116/37 diff"),
    ]
    gap = 8
    bw = (W - gap * 4) / 5
    h = 168
    s = Svg(W, h, "r2_k_flow", "The five steps of the import wizard with the real-file numbers")
    for i, (n, name, body, real) in enumerate(steps):
        x = i * (bw + gap)
        review = i == 3
        s.rect(x, 0, bw, h, WHITE, mix(PAPER, INK, 0.14), 1)
        s.rect(x, 0, bw, 4, PURPLE if not review else AMBER)
        s.text(x + 9, 34, n, 24, "serif", 800, PURPLE if not review else AMBER)
        s.text(x + 9, 54, name, 11.5, "sans", 700)
        y = 70
        for line in wrap(body, 9.5, bw - 18)[:5]:
            s.text(x + 9, y, line, 9.5, "sans", 400, "#34413F")
            y += 12.5
        s.rect(x, h - 30, bw, 30, mix(PAPER, INK, 0.05))
        s.text(x + 9, h - 11, real, 9.2 if len(real) < 20 else 8.4, "mono", 600, INK)
        if i < 4:
            s.text(x + bw + gap / 2, 22, "", 8)
    s.save(out("r2_k_flow"))


# ------------------------------------------------------------------ 08 O: parity grid
def o_parity():
    W = FULL
    docs = ["CPC", "LAD", "LoC", "PRES", "AKU", "N-PEM", "N-P1", "N-P2", "N-P3", "KTS"]
    unchanged_docs = {1, 2}  # LAD and LoC sheets print no organisation text
    rows = [
        ("Config empty (defaults)", "30 / 30 identical", False),
        ("Config seeded via API", "30 / 30 identical", False),
        ("After e2e edit + restore", "30 / 30 identical", False),
        ("Another PBT's details", "6 same, 24 changed", True),
    ]
    label_w = 150
    sq, g, gg = 9.5, 2.2, 6.0
    grid_w = 10 * (3 * sq + 2 * g) + 9 * gg
    top = 16
    h = top + len(rows) * (sq + 11) + 36
    s = Svg(W, h, "r2_o_parity", "30 generated documents compared by text, four runs")
    for r, (label, res, changed) in enumerate(rows):
        y = top + r * (sq + 11)
        s.text(0, y + sq - 1.5, label, 10, "sans", 500)
        for d in range(10):
            for p in range(3):
                x = label_w + d * (3 * sq + 2 * g + gg) + p * (sq + g)
                if changed and d not in unchanged_docs:
                    col = AMBER
                else:
                    col = DEEP
                s.rect(x, y, sq, sq, col)
        s.text(W, y + sq - 1.5, res, 9.5, "mono", 600, AMBER if changed else DEEP, "end")
    yb = top + len(rows) * (sq + 11) + 8
    for d, name in enumerate(docs):
        cx = label_w + d * (3 * sq + 2 * g + gg) + (3 * sq + 2 * g) / 2
        s.text(cx, yb + 8, name, 8.4, "mono", 600, SLATE, "middle")
    s.text(0, yb + 24, "10 document types x 3 projects; one square = one PDF read back with pdftotext", 9, "mono", 400, SLATE)
    s.save(out("r2_o_parity"))


# ------------------------------------------------------------------ 09 P1 charts
def p1_pipeline():
    counts = [30, 34, 52, 31, 48, 291]
    names = ["Fasa Draf", "Menunggu Lantikan", "Dalam Proses", "Pemeriksaan Tapak", "Tuntutan Bayaran", "Siap"]
    rows = [dict(label=n, value=c, color=STATUS_COL[st], text=f"{c}") for n, c, st in zip(names, counts, STATUSES)]
    hbars("r2_p1_pipeline", rows, HALF, 104, 291, "Dashboard status counts for admin01, 2026", value_w=34,
          note="screen = /api/projects, every status")


def p1_mutation():
    W = HALF
    s = Svg(W, 146, "r2_p1_mutation", "Report totals with a status filter on, correct build against the deliberately broken build")
    rows = [("Built as shipped", 12026468.49, 422, DEEP), ("Totals from the filtered list", 8098687.89, 291, AMBER)]
    vmax = 12026468.49
    for i, (lab, v, n, col) in enumerate(rows):
        y = 8 + i * 58
        s.text(0, y + 10, lab, 10.5, "sans", 700)
        s.rect(0, y + 18, W * 0.9, 16, mix(PAPER, INK, 0.05))
        s.rect(0, y + 18, W * 0.9 * v / vmax, 16, col)
        s.text(0, y + 49, f"RM {v:,.2f}  over {n} projects", 10, "mono", 600, col if col != AMBER else mix(AMBER, INK, 0.2))
    s.text(0, 140, "status filter = SIAP on screen", 9.2, "mono", 400, SLATE)
    s.save(out("r2_p1_mutation"))


def p1_lines():
    W = HALF
    data = [("pages/Dashboard.tsx", 932, 355), ("pages/ProjectsList.tsx", 1518, 494),
            ("ProjectsListPDFExporter.ts", 402, 433)]
    s = Svg(W, 166, "r2_p1_lines", "Lines of code before and after, three P1 files")
    vmax = 1518
    x0, x1 = 0, W - 40
    for i, (name, a, b) in enumerate(data):
        y = 4 + i * 48
        s.text(0, y + 9, name, 10, "mono", 600)
        s.rect(0, y + 14, (x1 - x0) * a / vmax, 9, tint(SLATE, 0.35))
        s.text(W, y + 23, str(a), 9.5, "mono", 500, SLATE, "end")
        s.rect(0, y + 26, (x1 - x0) * b / vmax, 9, DEEP if b < a else AMBER)
        s.text(W, y + 35, str(b), 9.5, "mono", 700, DEEP if b < a else mix(AMBER, INK, 0.2), "end")
    s.rect(0, 154, 9, 6, tint(SLATE, 0.35))
    s.text(13, 161, "before", 8.6, "mono", 400, SLATE)
    s.rect(58, 154, 9, 6, DEEP)
    s.text(71, 161, "after", 8.6, "mono", 400, SLATE)
    s.save(out("r2_p1_lines"))


# ------------------------------------------------------------------ 10 lead: one rule, one place
def hub(sid, left, centre_title, centre_lines, right, left_head, right_head, h, label):
    W = FULL
    s = Svg(W, h, sid, label)
    lw, cw, rw = 188, 214, 184
    gap = (W - lw - cw - rw) / 2
    lx, cx, rx = 0, lw + gap, lw + gap + cw + gap
    s.text(lx, 10, left_head, 8.8, "mono", 700, SLATE)
    s.text(rx, 10, right_head, 8.8, "mono", 700, SLATE)
    mk = s.arrow_marker("a", PURPLE, 8)
    n = len(left)
    bh = 44
    span = h - 24
    ly = [16 + i * (span - bh) / max(n - 1, 1) for i in range(n)]
    cyc = 16 + (span - 120) / 2
    # centre box
    ch = max(120, 16 + 14 * len(centre_lines) + 36)
    cyc = 16 + (span - ch) / 2
    for y, (t1, t2) in zip(ly, left):
        s.rect(lx, y, lw, bh, WHITE, AMBER, 1.2)
        s.text(lx + 8, y + 17, t1, 10.5, "sans", 700)
        s.text(lx + 8, y + 32, t2, 9.5, "sans", 400, "#34413F")
        s.path(f"M{lx + lw},{y + bh / 2} L{cx - 3},{cyc + ch / 2}", AMBER, 1.1, extra=f'stroke-dasharray="3 3" marker-end="{mk}"')
    s.rect(cx, cyc, cw, ch, PURPLE)
    s.text(cx + 10, cyc + 20, centre_title, 11, "mono", 700, WHITE)
    yy = cyc + 38
    for ln in centre_lines:
        s.text(cx + 10, yy, ln, 9.8, "sans", 500, "#E7E4F3")
        yy += 14
    nr = len(right)
    rb = min(34, (span - 4 * (nr - 1)) / nr)
    ry = [16 + i * (span - rb) / max(nr - 1, 1) for i in range(nr)]
    for y, t in zip(ry, right):
        s.rect(rx, y, rw, rb, WHITE, DEEP, 1.2)
        s.text(rx + 8, y + rb / 2 + 3.5, t, 10, "sans", 600)
        s.path(f"M{cx + cw + 3},{cyc + ch / 2} L{rx - 2},{y + rb / 2}", PURPLE, 1.1, extra=f'marker-end="{mk}"')
    s.save(out(sid))


def hubs():
    hub("r2_hub_policy",
        [("P2 · the project form", "date for the LAD rate: its own choice"),
         ("O · certificates, notices", "date for the LAD rate: another choice")],
        "domain/policy.ts",
        ["ladPolicyDate(project)", "locPolicyDate(project)", "clampToRules(date, rules)", "contract start, then lantikan,", "serah tapak, tamat, buka"],
        ["Stored LAD amount (form)", "Printed LAD certificate", "Notis Peringatan LAD rate"],
        "BEFORE: two answers", "AFTER: one answer, two users", 150,
        "Two date rules replaced by one in domain/policy")
    hub("r2_hub_reprice",
        [("K · close sheet", "draf only"), ("P1 · dashboard", "draf + menunggu lantikan"),
         ("P2 · project banner", "draf only")],
        "domain/repricing.ts",
        ["FASA_DRAF or MENUNGGU_LANTIKAN,", "and no No. Inden issued.", "", "An issued No. Inden locks."],
        ["Close sheet (Tutup)", "Project banner", "Dashboard worklist", "Projects list", "API stat repriceableProjects"],
        "BEFORE: three definitions", "AFTER: one rule, five users", 196,
        "Three re-pricing definitions replaced by one in domain/repricing")


# ------------------------------------------------------------------ 11 proof
def proof_matrix():
    W = FULL
    specs = [("O  organisasi", 10), ("K  kontrak + import", 21), ("P1  dashboard + list", 21),
             ("P2  project + BQ", 19)]
    targets = [("local merged server :8790", DEEP), ("live preview", TEAL)]
    sq, g = 12.0, 3.0
    label_w, lab2 = 0, 215
    rowh = 20
    h = 22 + len(specs) * 2 * rowh + len(specs) * 6 + 22
    s = Svg(W, h, "r2_proof_matrix", "Every e2e check passes on the local merged server and on the live preview")
    s.text(lab2, 10, "one square = one check", 9, "mono", 500, SLATE)
    y = 20
    for name, n in specs:
        for (tl, col) in targets:
            s.text(0, y + 10, name if col == DEEP else "", 10.5, "sans", 700)
            s.text(lab2 - 10, y + 10, tl.replace("local merged server :8790", "local :8790"), 9, "mono", 500, SLATE, "end")
            for i in range(n):
                s.rect(lab2 + i * (sq + g), y, sq, sq, col)
            s.text(lab2 + 21 * (sq + g) + 8, y + 10, f"{n}/{n}", 10.5, "mono", 700, col if col == DEEP else mix(TEAL, INK, 0.35))
            y += rowh
        y += 6
    s.text(lab2, y + 8, "142 checks in total: 71 on each target (sum of the four spec sizes)", 9.5, "mono", 400, SLATE)
    s.save(out("r2_proof_matrix"))


def iso():
    W = HALF
    rows = [dict(label="Production infrahub-db", value=8, color=SLATE, text="8 tables"),
            dict(label="Preview D1", value=19, color=TEAL, text="19 tables")]
    hbars("r2_iso", rows, W, 120, 19, "Tables in the production database and in the preview database", value_w=60, bar_h=16, gap=12,
          note="production: none of the v2 tables")


# ------------------------------------------------------------------ 12 cost and process
def cost_bars():
    names = ["F  foundation", "D  design", "K  kontrak", "P1  dashboard", "P2  project", "O  organisasi"]
    cost = [10.90, 4.45, 10.60, 12.51, 9.83, 11.59]
    rows = [dict(label=n, value=c, color=PURPLE if n.startswith("K") else DEEP, text=f"${c:,.2f}") for n, c in zip(names, cost)]
    hbars("r2_cost", rows, HALF, 88, 12.51, "Estimated API-price cost per builder", value_w=48)
    mins = [37, 19, 56, 56, 39, 51]
    rows = [dict(label=n, value=m, color=PURPLE if n.startswith("K") else DEEP, text=f"{m} min") for n, m in zip(names, mins)]
    hbars("r2_wall", rows, HALF, 88, 56, "Wall time per builder", value_w=48)


def quota():
    W = HALF
    s = Svg(W, 170, "r2_quota", "Plan quota used at three moments: session and week")
    groups = [("Wave 1 start", 9, 5), ("Wave 2 start", 28, 8), ("After merge + preview", 72, 13)]
    base, top = 134, 14
    full = base - top
    s.line(0, base, W, base, INK, 1)
    gw = W / 3
    for i, (lab, ses, wk) in enumerate(groups):
        gx = i * gw + 14
        bw = 34
        for j, (v, col, nm) in enumerate([(ses, DEEP, "session"), (wk, AMBER, "week")]):
            x = gx + j * (bw + 6)
            hgt = full * v / 100
            s.rect(x, base - hgt, bw, hgt, col)
            s.text(x + bw / 2, base - hgt - 4, f"{v}%", 10.5, "mono", 700, col if col == DEEP else mix(AMBER, INK, 0.2), "middle")
        l1, l2 = (lab, "") if i < 2 else ("After merge", "+ preview")
        s.text(gx, base + 14, l1, 9, "sans", 600)
        if l2:
            s.text(gx, base + 26, l2, 9, "sans", 600)
    s.rect(0, 160, 9, 8, DEEP)
    s.text(13, 168, "session", 8.8, "mono", 500, SLATE)
    s.rect(62, 160, 9, 8, AMBER)
    s.text(75, 168, "week", 8.8, "mono", 500, SLATE)
    s.save(out("r2_quota"))


def main():
    os.makedirs(OUT, exist_ok=True)
    k_books()
    k_flow()
    o_parity()
    p1_pipeline()
    p1_mutation()
    p1_lines()
    hubs()
    proof_matrix()
    iso()
    cost_bars()
    quota()
    print("wrote", sorted(f for f in os.listdir(OUT) if f.startswith("r2_")))


if __name__ == "__main__":
    main()
