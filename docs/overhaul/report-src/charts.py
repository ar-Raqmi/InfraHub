"""Read the sub-Yiyi CSVs and write every data chart of the report as hand-built SVG into charts/.

Run:  env -u PYTHONPATH ../pw/bin/python charts.py   (build.py runs it first)
Every number drawn here comes from work/system/raw/csv, work/bq/raw/csv or (for the two tables that only exist in
markdown) the cited FINDINGS line. Derived numbers (percentages, outlier-excluded sums) are computed here and
written to charts/derived.json so the prose can quote them.
"""
import csv
import json
import os

from svgkit import (AMBER, DEEP, EM, INK, PAPER, PURPLE, SLATE, STATUS_COL, STATUSES, TEAL, Svg, mix, px, rm,
                    text_width, tint)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SYS = os.path.join(ROOT, "work/system/raw/csv")
BQ = os.path.join(ROOT, "work/bq/raw/csv")
OUT = os.path.join(HERE, "charts")
FULL, HALF = px(174), px(83)
OUTLIER_RM = 1484384.57  # FINDINGS-bq.md:238-240 (one FASA_DRAF row, stored rate vs library RM 120.70)
DERIVED = {}

SHORT = {"FASA_DRAF": "Fasa Draf", "MENUNGGU_LANTIKAN": "Menunggu Lantikan", "DALAM_PROSES": "Dalam Proses",
         "PEMERIKSAAN_TAPAK": "Pemeriksaan Tapak", "TUNTUTAN_BAYARAN": "Tuntutan Bayaran", "SIAP": "Siap"}


def load(folder, name):
    with open(os.path.join(folder, name + ".csv"), newline="") as f:
        return [{k.strip(): (v or "").strip() for k, v in r.items()} for r in csv.DictReader(f)]


def out(name):
    return os.path.join(OUT, name + ".svg")


def status_totals():
    rows = load(SYS, "funnel_by_year")
    return {s: sum(int(r[s]) for r in rows) for s in STATUSES}


# ---------------------------------------------------------------- cover
def cover_motif():
    counts = status_totals()
    total = sum(counts.values())
    cols, pitch, sq = 30, FULL / 30, FULL / 30 - 4
    rows_n = -(-total // cols)
    grid_h = rows_n * pitch
    sh = {r["no_sebutharga"]: int(r["projects"]) for r in load(BQ, "no_sebutharga_distinct")}
    h = grid_h + 150
    s = Svg(FULL, h, "cover", f"{total} projects as squares coloured by status")
    i = 0
    for st in STATUSES:
        for _ in range(counts[st]):
            r, c = divmod(i, cols)
            s.rect(c * pitch, r * pitch, sq, sq, STATUS_COL[st])
            i += 1
    while i < rows_n * cols:
        r, c = divmod(i, cols)
        s.rect(c * pitch + 0.5, r * pitch + 0.5, sq - 1, sq - 1, "none", mix(INK, PAPER, 0.18), 1)
        i += 1
    # legend: two rows of three
    y0 = grid_h + 22
    for k, st in enumerate(STATUSES):
        x = (k % 3) * (FULL / 3)
        y = y0 + (k // 3) * 24
        s.rect(x, y - 10, 11, 11, STATUS_COL[st])
        s.text(x + 18, y, SHORT[st].upper(), 10, "mono", 500, PAPER, ls=0.5)
        s.text(x + FULL / 3 - 24, y, counts[st], 10, "mono", 700, PAPER, "end")
    # contract strip (purple = contract)
    y1 = y0 + 62
    main = sh.get("MPS/SH/302/25", 0)
    blank = sh.get("(empty)", 0)
    other = total - main - blank
    w_main, w_blank = FULL * main / total, FULL * blank / total
    s.rect(0, y1, w_main, 10, PURPLE)
    s.rect(w_main, y1, FULL * other / total, 10, tint(PURPLE, 0.45))
    s.rect(w_main + FULL * other / total, y1, w_blank, 10, "none", SLATE, 1)
    s.text(0, y1 + 30, f"{main} OF {total} PROJECTS CARRY ONE SEBUTHARGA NUMBER: MPS/SH/302/25", 10, "mono", 600,
           tint(PURPLE, 0.6), ls=0.5)
    s.text(FULL, y1 + 30, f"{other} OTHER · {blank} BLANK", 10, "mono", 500, mix(PAPER, INK, 0.35), "end", ls=0.5)
    DERIVED["cover"] = {"total": total, "counts": counts, "sebutharga_main": main, "blank": blank, "other": other}
    s.save(out("cover"))


# ---------------------------------------------------------------- generic horizontal bars
def hbars(sid, rows, width, label_w, vmax, title="", value_w=70, bar_h=14, gap=9, label_size=10.5,
          label_fam="sans", note=None):
    """rows: list of dict(label, value, color, text, mark?)."""
    top = 4
    h = top + len(rows) * (bar_h + gap) + (22 if note else 4)
    s = Svg(width, h, sid, title)
    x0, x1 = label_w, width - value_w
    for i, r in enumerate(rows):
        y = top + i * (bar_h + gap)
        s.text(0, y + bar_h - 3, r["label"], label_size, label_fam, r.get("weight", 500), INK)
        s.rect(x0, y, x1 - x0, bar_h, mix(PAPER, INK, 0.05))
        segs = r.get("segments") or [(r["value"], r["color"])]
        x = x0
        for v, col in segs:
            w = (x1 - x0) * v / vmax
            s.rect(x, y, w, bar_h, col)
            x += w
        s.text(width, y + bar_h - 3, r["text"], 10.5, "mono", 600, r.get("text_color", INK), "end")
    if note:
        s.text(0, h - 6, note, 9.5, "mono", 400, SLATE)
    s.save(out(sid))


# ---------------------------------------------------------------- chapter 02
LARGEST_FILES = [  # FINDINGS-system.md:66-75 (wc -l), no CSV exists for this table
    ("pages/BQEditor.tsx", 2043, "dup"), ("pages/ProjectDetail.tsx", 1790, "rules"),
    ("pages/BQPelarasanEditor.tsx", 1766, "dup"), ("pages/ImageReportGenerator.tsx", 1729, ""),
    ("pages/ProjectsList.tsx", 1518, ""), ("pages/AdminSettings.tsx", 1467, ""), ("pages/Dashboard.tsx", 932, ""),
    ("services/pdf/NotisPDFExporter.ts", 875, ""), ("services/pdf/BQPDFExporter.ts", 824, ""),
]


def code_files():
    col = {"dup": AMBER, "rules": AMBER, "": DEEP}
    rows = [{"label": f, "value": n, "color": col[k], "text": f"{n:,}"} for f, n, k in LARGEST_FILES]
    hbars("code_files", rows, FULL, 215, 2100, "Largest source files by line count", value_w=48, bar_h=13, gap=8,
          label_size=10, label_fam="mono",
          note="AMBER = the two near-duplicate BQ editors (54% shared lines) and the form that holds the money rules")


def code_area():
    rows = load(SYS, "code_size_by_area")
    rows.sort(key=lambda r: -int(r["lines"]))
    total = sum(int(r["lines"]) for r in rows)
    s = Svg(FULL, 72, "code_area", "Lines of code by area")
    x = 0
    for k, r in enumerate(rows):
        n = int(r["lines"])
        w = FULL * n / total
        fill = DEEP if r["area"] == "pages" else (TEAL if r["area"] == "services/pdf" else
                                                   mix(tint(TEAL, 0.55), PAPER, (k % 2) * 0.25))
        s.rect(x, 0, w - 1, 26, fill)
        if r["area"] in ("pages", "services/pdf"):
            pct = round(100 * n / total)
            s.text(x + 6, 17.5, f"{r['area']} · {n:,} lines · {pct}%", 10, "mono", 600, PAPER)
        x += w
    s.text(0, 46, f"{len(rows)} AREAS · {total:,} LINES OF TYPESCRIPT · NO TEST FILES", 9.5, "mono", 600, INK, ls=0.4)
    s.text(0, 64, "pale blocks = 13 smaller areas (components, hooks, lib, API...)", 9.5, "mono", 400, SLATE)
    DERIVED["code_total_lines"] = total
    DERIVED["pages_share_pct"] = round(100 * int(rows[0]["lines"]) / total, 1)
    s.save(out("code_area"))


# ---------------------------------------------------------------- chapter 04
def funnel():
    c = status_totals()
    total = sum(c.values())
    rows = [{"label": SHORT[st], "value": c[st], "color": STATUS_COL[st],
             "text": f"{c[st]} · {round(100 * c[st] / total)}%"} for st in STATUSES]
    hbars("funnel", rows, HALF, 112, max(c.values()), "Projects per status", value_w=62, bar_h=22, gap=12,
          note=f"ALL {total} PROJECTS · SNAPSHOT 20 NOV 2026")
    DERIVED["siap_pct_all"] = round(100 * c["SIAP"] / total, 1)
    DERIVED["open_all"] = total - c["SIAP"]


def opened_month():
    rows = load(SYS, "milestones_per_month")
    w, h = HALF, 232
    s = Svg(w, h, "opened_month", "Projects opened and matched per month")
    x0, x1, y0, y1 = 26, w - 2, 18, h - 40
    vmax = 100
    for v in (0, 25, 50, 75, 100):
        y = y1 - (y1 - y0) * v / vmax
        s.line(x0, y, x1, y, mix(PAPER, INK, 0.12), 0.8)
        s.text(x0 - 5, y + 3.5, v, 9, "mono", 400, SLATE, "end")
    n = len(rows)
    step = (x1 - x0) / n
    pts = []
    for i, r in enumerate(rows):
        o, m = int(r["opened"]), int(r["matched"])
        bx = x0 + i * step + 3
        bh = (y1 - y0) * o / vmax
        s.rect(bx, y1 - bh, step - 6, bh, TEAL if r["month"] != "2026-01" else DEEP)
        if r["month"] == "2026-01":
            s.text(bx + (step - 6) / 2, y1 - bh - 5, o, 10, "mono", 700, INK, "middle")
        pts.append((bx + (step - 6) / 2, y1 - (y1 - y0) * m / vmax))
        mon = "JFMAMJJASOND"[int(r["month"][5:]) - 1]
        s.text(bx + (step - 6) / 2, y1 + 13, mon, 9.5, "mono", 500, INK, "middle")
    s.path("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts), INK, 1.6)
    for x, y in pts:
        s.rect(x - 2.5, y - 2.5, 5, 5, INK)
    s.text(x0, y1 + 30, "DEC 2025 – NOV 2026", 9, "mono", 500, SLATE)
    s.rect(x1 - 152, y1 + 22, 9, 9, TEAL)
    s.text(x1 - 139, y1 + 30, "OPENED", 9, "mono", 600, INK)
    s.rect(x1 - 92, y1 + 25, 9, 3, INK)
    s.text(x1, y1 + 30, "MATCHED (SIAP)", 9, "mono", 600, INK, "end")
    s.save(out("opened_month"))


def timeline():
    """THE chart: the median journey, and how wide each phase is."""
    budget = {r["phase"].split(" (")[0]: r for r in load(SYS, "stage_budget_siap_days")}
    dur = {(r["from"], r["to"]): r for r in load(SYS, "stage_durations_siap_days")}
    pre, site, paper, whole = (budget["Pre-contract admin"], budget["On site"],
                               budget["Post-site paperwork"], budget["Whole journey"])
    claim = dur[("tarikh_siap_sebenar", "tarikh_tuntutan_bayaran")]
    kew = dur[("tarikh_tuntutan_bayaran", "tarikh_hantar_kewangan")]
    match = dur[("tarikh_hantar_kewangan", "tarikh_padanan")]
    f = float
    w, h = FULL, 500
    s = Svg(w, h, "timeline", "Median journey of a finished project")
    x0, x1, dmax = 2, w - 2, 150
    X = lambda d: x0 + (x1 - x0) * d / dmax  # noqa: E731
    hatch = s.hatch("gap", tint(AMBER, 0.3), PAPER, 4)
    # legend row
    leg = [(SLATE, "BEFORE THE SITE"), (EM, "ON SITE: hand-over to completion"),
           (AMBER, "AFTER THE SITE: completion to Pemadanan")]
    lx = 0
    for col, t in leg:
        s.rect(lx, 3, 10, 10, col)
        s.text(lx + 15, 12, t, 9, "mono", 600, INK)
        lx += 30 + text_width(t, 9, "mono")
    # median journey bar
    ya, bh = 46, 76
    segs = [(f(pre["median"]), SLATE), (f(site["median"]), EM), (f(paper["median"]), AMBER)]
    subs = {1: "days on site", 2: "days of paperwork"}
    d = 0
    for k, (v, col) in enumerate(segs):
        s.rect(X(d), ya, X(d + v) - X(d) - 2, bh, col)
        s.text(X(d) + 7, ya + 50, f"{v:g}", 40, "serif", 800, PAPER)
        if k in subs:
            s.text(X(d) + 12 + text_width(f"{v:g}", 40, "serif"), ya + 49, subs[k], 10, "sans", 600, PAPER)
        d += v
    sum_med = d
    # whole-journey marker + whisker
    wm, p25, p75 = f(whole["median"]), f(whole["p25"]), f(whole["p75"])
    s.line(X(wm), ya - 12, X(wm), ya + bh + 22, INK, 2.2)
    s.text(X(wm) - 6, ya - 18, f"{wm:g} DAYS · MEDIAN OF THE WHOLE JOURNEY", 9.5, "mono", 800, INK, "end")
    yw = ya + bh + 16
    s.line(X(p25), yw, X(p75), yw, INK, 1.2)
    s.line(X(p25), yw - 5, X(p25), yw + 5, INK, 1.2)
    s.line(X(p75), yw - 5, X(p75), yw + 5, INK, 1.2)
    s.text(X(p75), yw + 17, f"half of all projects: {p25:g}–{p75:g} days", 9.5, "sans", 600, INK, "end")
    # paperwork breakdown
    yb = ya + bh + 52
    start = f(pre["median"]) + f(site["median"])
    s.path(f"M{X(start):.1f},{ya + bh} L{X(start):.1f},{yb}", AMBER, 0.9, extra='stroke-dasharray="2 2"')
    s.text(X(start) - 8, yb + 21, f"{paper['median']} days =", 11, "mono", 700, AMBER, "end")
    parts = [(f(claim["median"]), "lodge the claim"), (f(kew["median"]), "claim reaches Kewangan"),
             (f(match["median"]), "matched")]
    d = start
    for k, (v, lab) in enumerate(parts):
        col = [tint(AMBER, 0.2), AMBER, mix(AMBER, INK, 0.35)][k]
        s.rect(X(d), yb, X(d + v) - X(d) - 1.5, 32, col)
        s.text(X(d) + 4, yb + 22, f"{v:g}", 17, "serif", 800, PAPER if k else INK)
        s.line(X(d) + 1, yb + 32, X(d) + 1, yb + 40 + k * 14, AMBER, 0.8)
        s.text(X(d) + 5, yb + 48 + k * 14, lab, 9.5, "sans", 600, INK)
        d += v
    rest = f(paper["median"]) - sum(v for v, _ in parts)
    s.rect(X(d), yb, X(d + rest) - X(d), 32, hatch)
    s.text(X(d + rest) + 5, yb + 13, f"+{rest:g}: medians", 9, "mono", 500, SLATE)
    s.text(X(d + rest) + 5, yb + 25, "don't add up", 9, "mono", 500, SLATE)
    # axis
    ax = yb + 104
    s.line(X(0), ax, X(dmax), ax, INK, 1)
    for dd in range(0, 151, 10):
        s.line(X(dd), ax, X(dd), ax + (6 if dd % 30 == 0 else 3), INK, 0.8)
        if dd % 30 == 0:
            s.text(X(dd), ax + 18, dd, 9.5, "mono", 500, SLATE,
                   "start" if dd == 0 else ("end" if dd == dmax else "middle"))
    s.text(X(dmax), ax - 8, "DAYS FROM OPENING THE FILE", 9, "mono", 600, SLATE, "end")
    # spread panel
    yc = ax + 52
    s.text(0, yc, "HOW MUCH DOES EACH PHASE VARY?  bar = middle half of projects (p25–p75), tick = median",
           9.5, "mono", 700, INK)
    spread = [("Before the site", pre, SLATE), ("On site", site, EM), ("After the site", paper, AMBER),
              ("Whole journey", whole, INK)]
    for k, (lab, r, col) in enumerate(spread):
        y = yc + 16 + k * 25
        a25, med, a75 = f(r["p25"]), f(r["median"]), f(r["p75"])
        s.rect(X(0), y + 4, X(dmax) - X(0), 4, mix(PAPER, INK, 0.07))
        s.rect(X(a25), y, X(a75) - X(a25), 12, col if col != INK else tint(SLATE, 0.25))
        s.rect(X(med) - 1.5, y - 4, 3, 20, INK)
        t = f"{lab}  {a25:g}–{a75:g} d · median {med:g}"
        if X(a75) + 10 + text_width(t, 10) <= x1:
            s.text(X(a75) + 10, y + 10, t, 10, "sans", 600, INK)
        else:
            s.text(X(a25) - 10, y + 10, t, 10, "sans", 600, INK, "end")
    DERIVED["timeline"] = {"pre": f(pre["median"]), "site": f(site["median"]), "paper": f(paper["median"]),
                           "whole": wm, "sum_of_medians": sum_med,
                           "site_share_pct": round(100 * f(site["median"]) / wm, 1),
                           "paper_share_pct": round(100 * f(paper["median"]) / wm, 1),
                           "paper_parts": [v for v, _ in parts], "paper_rest": rest}
    s.save(out("timeline"))


def bp():
    rows = [r for r in load(SYS, "projects_per_bp")]
    total = sum(int(r["projects"]) for r in rows)
    named = sorted([r for r in rows if r["bp"].startswith("BP")], key=lambda r: -int(r["projects"]))
    blank = sum(int(r["projects"]) for r in rows if not r["bp"].startswith("BP"))
    out_rows = []
    for r in named:
        num, name = r["bp"].split(": ")
        top = num in ("BP 4", "BP 5")
        out_rows.append({"label": f"{num} {name.title()}", "value": int(r["projects"]),
                         "color": DEEP if top else tint(TEAL, 0.4), "text": r["projects"]})
    out_rows.append({"label": "blank or '-'", "value": blank, "color": tint(SLATE, 0.5), "text": str(blank)})
    hbars("bp", out_rows, HALF, 150, 170, "Projects per BP", value_w=30, bar_h=12, gap=7, label_size=9.5,
          note=f"n = {total} PROJECTS")
    top2 = sum(int(r["projects"]) for r in named[:2])
    DERIVED["bp_top2_pct"] = round(100 * top2 / total, 1)


def kos_bands():
    rows = load(SYS, "kos_projek_bins_by_status")
    lab = {"0-5000": "RM 0–5k", "5000-10000": "RM 5–10k", "10000-20000": "RM 10–20k", "20000-50000": "RM 20–50k",
           "50000-100000": "RM 50–100k", "100000-150000": "RM 100–150k", "150000-200000": "RM 150–200k",
           ">=200000": "RM 200k+"}
    out_rows, total, band2050 = [], 0, 0
    for r in rows:
        segs = [(int(r[st]), STATUS_COL[st]) for st in STATUSES]
        n = sum(v for v, _ in segs)
        total += n
        if r["rm_band"] == "20000-50000":
            band2050 = n
        flag = r["rm_band"] in ("150000-200000", ">=200000")
        out_rows.append({"label": lab[r["rm_band"]], "value": n, "segments": segs, "color": INK,
                         "text": f"{n}" + (" !" if flag else ""), "text_color": AMBER if flag else INK})
    hbars("kos_bands", out_rows, HALF, 82, 400, "Kos Projek bands", value_w=34, bar_h=13, gap=7, label_size=10,
          label_fam="mono", note="! = the two draft outliers (max RM 1.48M)")
    DERIVED["kos_band_20_50_pct"] = round(100 * band2050 / total, 1)
    DERIVED["kos_band_total"] = total


def pja():
    rows = load(SYS, "projects_per_pja")
    out_rows = []
    for r in rows:
        t, o = int(r["projects_total"]), int(r["projects_not_siap"])
        out_rows.append({"label": r["pja"], "value": t, "segments": [(t - o, DEEP), (o, tint(TEAL, 0.45))],
                         "color": DEEP, "text": f"{t}"})
    hbars("pja", out_rows, HALF, 52, 110, "Projects per PJA", value_w=30, bar_h=11, gap=6, label_size=10,
          label_fam="mono", note="DARK = SIAP · PALE = still open")
    tot = sum(int(r["projects_total"]) for r in rows)
    top4 = sum(int(r["projects_total"]) for r in rows[:4])
    DERIVED["pja_top4"] = {"n": top4, "pct": round(100 * top4 / tot, 1), "total": tot}


def companies():
    rows = sorted(load(SYS, "projects_per_company"), key=lambda r: -float(r["sum_kos_projek_rm"]))
    w, h = FULL, 230
    s = Svg(w, h, "companies", "Contract value per company against the RM 200,000 cap")
    x0, x1, y0, y1 = 44, w - 2, 16, h - 52
    vmax = 220000
    Y = lambda v: y1 - (y1 - y0) * v / vmax  # noqa: E731
    for v in (0, 50000, 100000, 150000, 200000):
        s.line(x0, Y(v), x1, Y(v), mix(PAPER, INK, 0.1), 0.8)
        s.text(x0 - 5, Y(v) + 3.5, f"{v // 1000}k", 9, "mono", 400, SLATE, "end")
    step = (x1 - x0) / len(rows)
    over = None
    for i, r in enumerate(rows):
        v, n = float(r["sum_kos_projek_rm"]), int(r["projects"])
        col = {7: DEEP, 8: TEAL}.get(n, tint(SLATE, 0.35))
        s.rect(x0 + i * step + 1, Y(v), step - 2, y1 - Y(v), col)
        if v > 200000:
            over = (i, v)
    s.line(x0, Y(200000), x1, Y(200000), AMBER, 1.5, 'stroke-dasharray="5 3"')
    s.text(x1, Y(200000) - 6, "RM 200,000 CAP PER COMPANY (REPORTED, NOT ENFORCED)", 9, "mono", 700, AMBER, "end")
    if over:
        i, v = over
        cx = x0 + i * step + step / 2
        s.text(cx + 8, Y(200000) - 6, f"‹ 1 company over the cap by {rm(v - 200000, 2)}", 9.5, "sans", 700, INK)
    hist = {int(r["projects_per_company"]): int(r["n_companies"]) for r in load(SYS, "company_project_count_histogram")}
    ly = y1 + 20
    items = [(DEEP, f"{hist.get(7, 0)} COMPANIES · 7 PROJECTS"), (TEAL, f"{hist.get(8, 0)} · 8 PROJECTS"),
             (tint(SLATE, 0.35), f"{hist.get(1, 0)} · 1 PROJECT (2025 PANEL)")]
    x = x0
    for col, t in items:
        s.rect(x, ly - 9, 10, 10, col)
        s.text(x + 15, ly, t, 9.5, "mono", 600, INK)
        x += 30 + text_width(t, 9.5, "mono")
    s.text(x0, ly + 20, f"{len(rows)} company names used · each column one company, sorted by contract value", 9.5,
           "mono", 400, SLATE)
    s.save(out("companies"))


def votes():
    rows = [r for r in load(SYS, "vote_allocation_vs_committed_2026") if r["allocation_rm"]]
    w = FULL
    bar_h, gap, top = 15, 9, 22
    h = top + len(rows) * (bar_h + gap) + 26
    s = Svg(w, h, "votes", "Vote allocation vs committed, 2026")
    x0, x1, pmax = 262, w - 150, 110
    X = lambda p: x0 + (x1 - x0) * p / pmax  # noqa: E731
    for p in (0, 50, 100):
        s.text(X(p), 12, f"{p}%", 9, "mono", 500, SLATE, "middle")
    overs = []
    for i, r in enumerate(rows):
        y = top + i * (bar_h + gap)
        alloc, comm = float(r["allocation_rm"]), float(r["committed_kos_projek_rm"])
        pct = 100 * comm / alloc
        over = comm > alloc
        if over:
            overs.append((r["vote_code"], round(comm - alloc, 2)))
        name = r["vote_name"] if len(r["vote_name"]) <= 34 else r["vote_name"][:32] + "…"
        s.text(0, y + 11.5, r["vote_code"], 10, "mono", 600, INK)
        s.text(52, y + 11.5, name, 10, "sans", 500, INK)
        s.rect(X(0), y, X(pmax) - X(0), bar_h, mix(PAPER, INK, 0.05))
        s.rect(X(0), y, X(min(pct, 100)) - X(0), bar_h, DEEP if pct < 100.005 else DEEP)
        if over:
            s.rect(X(100), y, X(pct) - X(100), bar_h, AMBER)
        s.text(w, y + 11.5, f"{pct:.1f}% of {rm(alloc)}", 10, "mono", 600, AMBER if over else INK, "end")
    s.line(X(100), top - 4, X(100), h - 22, INK, 1.2, 'stroke-dasharray="3 2"')
    s.text(0, h - 6, "Bar = committed Kos Projek ÷ allocation (2026 settings). AMBER = committed above allocation.",
           9.5, "mono", 400, SLATE)
    DERIVED["votes_over"] = overs
    s.save(out("votes"))


# ---------------------------------------------------------------- chapter 05
def overflow():
    m = {r["metric"]: r["value"] for r in load(SYS, "money_post_pelarasan")}
    n_all, n_over = int(m["projects_in_TUNTUTAN_or_SIAP"]), int(m["projects_with_overflow_gt_0"])
    cols = 26
    pitch = HALF / cols
    rows_n = -(-n_all // cols)
    h = rows_n * pitch + 34
    s = Svg(HALF, h, "overflow", f"{n_over} of {n_all} claimed or finished projects carry an overflow")
    for i in range(n_all):
        r, c = divmod(i, cols)
        s.rect(c * pitch, r * pitch, pitch - 2.5, pitch - 2.5, AMBER if i < n_over else tint(SLATE, 0.55))
    s.rect(0, h - 22, 10, 10, AMBER)
    s.text(15, h - 13, f"{n_over} WITH OVERFLOW", 9.5, "mono", 600, INK)
    s.rect(140, h - 22, 10, 10, tint(SLATE, 0.55))
    s.text(155, h - 13, f"{n_all - n_over} WITHOUT", 9.5, "mono", 600, INK)
    DERIVED["overflow"] = {"n_all": n_all, "n_over": n_over, "pct": round(100 * n_over / n_all, 1),
                           "sum": float(m["sum_bq_pelarasan_extra_rm_uncapped_overflow"]),
                           "median": float(m["overflow_median_rm"])}
    s.save(out("overflow"))


def pelarasan_outcome():
    rows = load(BQ, "pelarasan_vs_contract")
    tot = sum(int(r["projects"]) for r in rows)
    s = Svg(HALF, 74, "pel_outcome", "Pelarasan total vs contract price")
    cols = [tint(TEAL, 0.4), SLATE, AMBER]
    labs = ["below contract", "equal", "above to capped"]
    x = 0
    for k, r in enumerate(rows):
        n = int(r["projects"])
        w = HALF * n / tot
        s.rect(x, 0, w - 1.5, 24, cols[k])
        anchor, tx = ("end", x + w - 4) if k == 2 else ("start", x + 4)
        s.text(tx, 16, n, 11, "mono", 700, PAPER if k else INK, anchor)
        ly = 40 if k != 1 else 56
        s.text(x if k < 2 else x + w, ly, labs[k], 9.5, "sans", 600, INK, "end" if k == 2 else "start")
        x += w
    s.text(0, 72, f"n = {tot} PROJECTS WITH A BQ PELARASAN", 9, "mono", 400, SLATE)
    s.save(out("pel_outcome"))


# ---------------------------------------------------------------- chapter 06
def bq_rows():
    link = load(BQ, "contract_item_link_share")
    n = {r["class"]: int(r["item_rows"]) for r in link}
    same = n["linked, rate = library today"]
    diff = n["linked, rate differs from library today"]
    orph = n["linked, library entry gone (orphan)"]
    total = same + diff + orph + n["custom / manual (no library link)"]
    pct = {r["class"]: r["pct_rows"] for r in link}
    w, h = FULL, 190
    s = Svg(w, h, "bq_rows", "What happened to the 8,672 copied BQ rows")
    s.rect(0, 22, w * same / total - 1.5, 34, DEEP)
    s.rect(w * same / total, 22, max(w * diff / total, 2.5), 34, AMBER)
    s.rect(w * (same + diff) / total + 1.5, 22, w * orph / total - 1.5, 34, SLATE)
    s.text(0, 14, f"{total:,} BQ ITEM ROWS INSIDE projects.bq_data · 100% CARRY A LIBRARY LINK", 9.5, "mono", 700, INK,
           ls=0.3)
    s.text(8, 45, f"{same:,} rows · {pct['linked, rate = library today']}% · rate still equals today's Pustaka",
           11, "sans", 600, PAPER)
    s.line(w * same / total + 1, 56, w * same / total + 1, 80, AMBER, 1)
    s.text(w * same / total - 4, 92, f"{diff} rows · {pct['linked, rate differs from library today']}% · rate differs "
           "(9 projects)", 10, "sans", 600, AMBER, "end")
    s.line(w - 2, 56, w - 2, 108, SLATE, 1)
    s.text(w, 120, f"{orph} rows · {pct['linked, library entry gone (orphan)']}% · library entry deleted "
           "(171 projects), still prints fine", 10, "sans", 600, SLATE, "end")
    # rate drift strip
    dist = load(BQ, "distinct_rates_per_library_point")
    pts = sum(int(r["library_points"]) for r in dist)
    y = 140
    s.text(0, y, f"{pts} LIBRARY POINTS USED IN PROJECTS: HOW MANY DIFFERENT RATES EACH ONE HAS", 9.5, "mono", 700,
           INK, ls=0.3)
    x = 0
    for k, r in enumerate(dist):
        v = int(r["library_points"])
        ww = w * v / pts
        s.rect(x, y + 8, max(ww - 1.5, 3), 16, [DEEP, AMBER, mix(AMBER, INK, 0.3)][k])
        lab = f"{v} · {r['distinct_rates_seen_across_projects']} rate" + ("" if k == 0 else "s")
        if k == 0:
            s.text(x + 6, y + 20, lab + " across every project and company", 10, "sans", 600, PAPER)
        x += ww
    two = next(int(r["library_points"]) for r in dist if r["distinct_rates_seen_across_projects"] == "2")
    three = next(int(r["library_points"]) for r in dist if r["distinct_rates_seen_across_projects"] == "3")
    s.text(w, y + 42, f"{two} points have 2 rates · {three} has 3 · the deviations are the same 20 rows", 9.5,
           "mono", 600, AMBER, "end")
    s.save(out("bq_rows"))
    DERIVED["bq_rows"] = {"total": total, "same": same, "diff": diff, "orphan": orph, "points": pts}


def exposure():
    rows = [r for r in load(BQ, "exposure_by_status") if r["year"] == "2026" and r["status"] != "SIAP"]
    w = FULL
    bar_h, gap, top = 18, 12, 30
    h = top + len(rows) * (bar_h + gap) + 44
    s = Svg(w, h, "exposure", "Open 2026 projects exposed to the next rate change")
    x0, x1, vmax = 150, w - 230, 1700000
    s.text(0, 12, "STATUS", 9, "mono", 700, SLATE, ls=0.4)
    s.text(x0, 12, "OPEN CONTRACT VALUE (RM)", 9, "mono", 700, SLATE, ls=0.4)
    s.text(w - 140, 12, "PROJECTS", 9, "mono", 700, SLATE, "end", ls=0.4)
    s.text(w, 12, "NO PELARASAN YET", 9, "mono", 700, SLATE, "end", ls=0.4)
    tot_v = tot_n = tot_ns = 0
    for i, r in enumerate(rows):
        y = top + i * (bar_h + gap)
        v = float(r["contract_value_rm"])
        flag = r["status"] == "FASA_DRAF"
        if flag:
            v -= OUTLIER_RM
        n, started = int(r["projects"]), int(r["pelarasan_started"])
        tot_v, tot_n, tot_ns = tot_v + v, tot_n + n, tot_ns + n - started
        s.text(0, y + 13, SHORT[r["status"]], 10.5, "sans", 600, INK)
        s.rect(x0, y, (x1 - x0) * v / vmax, bar_h, STATUS_COL[r["status"]])
        s.text(x0 + (x1 - x0) * v / vmax + 6, y + 13, rm(v) + (" *" if flag else ""), 10, "mono", 600, INK)
        s.text(w - 140, y + 13, n, 11, "mono", 700, INK, "end")
        s.text(w, y + 13, n - started, 11, "mono", 700, AMBER if n - started else SLATE, "end")
    y = top + len(rows) * (bar_h + gap) + 4
    s.line(0, y - 6, w, y - 6, INK, 1)
    s.text(0, y + 12, "Total open, 2026", 10.5, "sans", 700, INK)
    s.text(x0, y + 12, f"about {rm(tot_v)}", 11, "mono", 700, INK)
    s.text(w - 140, y + 12, tot_n, 11, "mono", 700, INK, "end")
    s.text(w, y + 12, tot_ns, 11, "mono", 700, AMBER, "end")
    s.text(0, y + 32, f"* excludes one draft row stored at {rm(OUTLIER_RM, 2)} (library RM 120.70)", 9.5, "mono",
           400, SLATE)
    DERIVED["exposure"] = {"projects": tot_n, "value_excl_outlier": round(tot_v, 2), "not_started": tot_ns}
    s.save(out("exposure"))


def main():
    os.makedirs(OUT, exist_ok=True)
    for fn in (cover_motif, code_files, code_area, funnel, opened_month, timeline, bp, kos_bands, pja, companies,
               votes, overflow, pelarasan_outcome, bq_rows, exposure):
        fn()
    import diagrams
    diagrams.main(OUT)
    with open(os.path.join(OUT, "derived.json"), "w") as f:
        json.dump(DERIVED, f, indent=1)
    print("charts:", len([n for n in os.listdir(OUT) if n.endswith(".svg")]), "svg ->", OUT)
    print(json.dumps(DERIVED))


if __name__ == "__main__":
    main()
