import sys
from playwright.sync_api import sync_playwright
src, out = sys.argv[1], sys.argv[2]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/home/rezephyr/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome", args=["--allow-file-access-from-files"])
    pg = b.new_page()
    pg.goto("file://" + src); pg.wait_for_timeout(800)
    pg.evaluate("document.fonts.ready")
    pg.pdf(path=out, prefer_css_page_size=True, print_background=True)
    b.close()
