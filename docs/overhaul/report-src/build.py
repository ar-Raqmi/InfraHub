"""Build the Discovery Report: charts -> report.html -> layout checks -> PDF.

Usage (from this folder):
  env -u PYTHONPATH ../pw/bin/python build.py            # full build: charts, html, checks, pdf
  env -u PYTHONPATH ../pw/bin/python build.py --no-pdf   # html + checks only (faster while iterating)

Chapter files: chapters/NN-slug.html, concatenated in filename order. Each file starts with
  <!-- chapter: NN | Running title -->
and contains only <section class="page ..."> blocks. build.py injects the footer (folio) into every page except
.cover, numbers the pages, inlines {{svg:name}} from charts/name.svg, and resolves {{page:NN}} (first page of
chapter NN), {{at:name}} (page of the section with data-anchor="name") and {{pages}} (total).
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = os.environ.get("REPORT_CHROME", "/home/rezephyr/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome")
REPORT_NAME = "InfraHub · Overhaul discovery"
PDF = os.path.join(HERE, os.environ.get("REPORT_PDF", "InfraHub-Overhaul-Discovery-Report.pdf"))
HTML = os.path.join(HERE, "report.html")
SECTION = re.compile(r'(<section\s+class="page[^"]*"[^>]*>)(.*?)(</section>)', re.S)
META = re.compile(r"<!--\s*chapter:\s*(\w+)\s*\|\s*(.*?)\s*-->")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def inline_svg(m):
    path = os.path.join(HERE, "charts", m.group(1) + ".svg")
    if not os.path.exists(path):
        raise SystemExit(f"missing chart: {path}")
    return read(path)


def assemble():
    files = sorted(glob.glob(os.path.join(HERE, "chapters", "*.html")))
    pages, starts, anchors = [], {}, {}
    for fp in files:
        src = read(fp)
        meta = META.search(src)
        key = meta.group(1) if meta else os.path.basename(fp)[:2]
        title = meta.group(2) if meta else os.path.basename(fp)[3:-5].replace("-", " ")
        secs = SECTION.findall(src)
        if not secs:
            raise SystemExit(f"no <section class=page> in {fp}")
        starts[key] = len(pages) + 1
        for open_tag, body, close in secs:
            pages.append((open_tag, body, close, key, title))
            anchor = re.search(r'data-anchor="([\w-]+)"', open_tag)
            if anchor:
                anchors[anchor.group(1)] = len(pages)
    total = len(pages)
    out = []
    for n, (open_tag, body, close, key, title) in enumerate(pages, 1):
        folio = "" if "cover" in open_tag else (
            f'<footer class="folio"><span>{REPORT_NAME}</span><span class="run">{key} · {title}</span>'
            f'<span class="pg">{n:02d} / {total:02d}</span></footer>')
        open_tag = open_tag.replace("<section", f'<section data-page="{n}" data-chapter="{key}"', 1)
        out.append(open_tag + body + folio + close)
    html = "\n".join(out)
    html = re.sub(r"\{\{svg:([\w-]+)\}\}", inline_svg, html)
    html = re.sub(r"\{\{page:(\w+)\}\}", lambda m: f"{starts.get(m.group(1), 0):02d}", html)
    html = re.sub(r"\{\{at:([\w-]+)\}\}", lambda m: f"{anchors.get(m.group(1), 0):02d}", html)
    html = html.replace("{{pages}}", str(total))
    doc = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
           '<title>InfraHub Overhaul: Discovery Report</title>'
           '<link rel="stylesheet" href="fonts.css"><link rel="stylesheet" href="report.css"></head>'
           f'<body>\n{html}\n</body></html>\n')
    with open(HTML, "w", encoding="utf-8") as f:
        f.write(doc)
    return total, starts


CHECK_JS = r"""
() => {
  const px = mm => mm * 96 / 25.4;
  const out = {pageOverflow: [], outOfPage: [], intoFooter: [], clipped: [], svgOverlap: [], svgOut: []};
  const label = el => (el.tagName.toLowerCase() + (el.className && el.className.baseVal === undefined && el.className ? '.' + String(el.className).split(' ').join('.') : '') + ' "' + (el.textContent || '').trim().slice(0, 40) + '"');
  document.querySelectorAll('section.page').forEach(p => {
    const n = p.dataset.page;
    if (p.scrollHeight > p.clientHeight + 1 || p.scrollWidth > p.clientWidth + 1)
      out.pageOverflow.push({page: n, sh: p.scrollHeight, ch: p.clientHeight});
    const pr = p.getBoundingClientRect();
    const folio = p.querySelector('.folio');
    const limit = folio ? folio.getBoundingClientRect().top - px(1) : pr.bottom;
    p.querySelectorAll('*').forEach(el => {
      if (el.closest('.folio') || el.closest('defs') || el.closest('marker') || el.closest('pattern')) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.left < pr.left - 1 || r.right > pr.right + 1 || r.top < pr.top - 1 || r.bottom > pr.bottom + 1)
        out.outOfPage.push({page: n, el: label(el), r: [r.left - pr.left, r.top - pr.top, r.right - pr.left, r.bottom - pr.top].map(Math.round)});
      else if (!p.classList.contains('bleed') && !p.classList.contains('cover') && r.bottom > limit + 0.5 && !el.closest('.bleed-ok'))
        out.intoFooter.push({page: n, el: label(el), over: Math.round(r.bottom - limit)});
      const cs = getComputedStyle(el);
      if (!(el instanceof SVGElement) && cs.overflow !== 'visible' && !el.classList.contains('page') &&
          (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1))
        out.clipped.push({page: n, el: label(el)});
    });
    p.querySelectorAll('svg.chart').forEach(svg => {
      const sr = svg.getBoundingClientRect();
      const ts = [...svg.querySelectorAll('text')].map(t => ({t: t.textContent, r: t.getBoundingClientRect()}));
      ts.forEach(a => {
        if (a.r.left < sr.left - 1 || a.r.right > sr.right + 1 || a.r.top < sr.top - 1 || a.r.bottom > sr.bottom + 1)
          out.svgOut.push({page: n, svg: svg.id, text: a.t.slice(0, 50)});
      });
      for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) {
        const a = ts[i].r, b = ts[j].r;
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 1.5 && oy > 2.5) out.svgOverlap.push({page: n, svg: svg.id, a: ts[i].t.slice(0, 40), b: ts[j].t.slice(0, 40)});
      }
    });
  });
  out.fonts = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight);
  return out;
}
"""


def render(make_pdf=True):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=["--allow-file-access-from-files"])
        try:
            page = browser.new_page()
            page.emulate_media(media="print")
            page.goto("file://" + HTML)
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(600)
            checks = page.evaluate(CHECK_JS)
            if make_pdf:
                page.pdf(path=PDF, prefer_css_page_size=True, print_background=True)
        finally:
            browser.close()
    return checks


def main():
    args = sys.argv[1:]
    if "--no-charts" not in args:
        sys.path.insert(0, HERE)
        import charts
        charts.main()
    total, starts = assemble()
    print(f"report.html: {total} pages; chapter starts {starts}")
    checks = render(make_pdf="--no-pdf" not in args)
    with open(os.path.join(HERE, "build-checks.json"), "w") as f:
        json.dump(checks, f, indent=1)
    for k in ("pageOverflow", "outOfPage", "intoFooter", "clipped", "svgOverlap", "svgOut"):
        items = checks[k]
        print(f"check {k}: {len(items)}")
        for it in items[:12]:
            print("   ", json.dumps(it, ensure_ascii=False))
    print("fonts loaded:", sorted(set(checks["fonts"])))
    if "--no-pdf" not in args:
        print("pdf:", PDF, os.path.getsize(PDF), "bytes")


if __name__ == "__main__":
    main()
