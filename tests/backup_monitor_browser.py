from pathlib import Path
from playwright.sync_api import sync_playwright, expect
root = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch()
    for viewport in ({"width":1280,"height":800},{"width":360,"height":800}):
        ctx = browser.new_context(viewport=viewport, offline=True)
        page = ctx.new_page()
        errors, external = [], []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("request", lambda r: external.append(r.url) if r.url.startswith(("http://","https://")) else None)
        page.goto((root / "index.html").as_uri())
        page.locator('nav button[data-page="backup"]').click()
        expect(page.locator("#content")).to_contain_text("AES-256-GCM")
        expect(page.locator("#content")).to_contain_text("Non configurata")
        expect(page.locator("#new")).to_be_hidden()
        page.locator('nav button[data-page="monitor"]').click()
        expect(page.locator("#monitor-metrics .line")).to_have_count(4)
        expect(page.locator("#monitor-metrics")).to_contain_text("Non collegato")
        expect(page.locator("#new")).to_be_hidden()
        assert not errors, errors
        assert not external, external
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        ctx.close()
        print("PASS backup and monitor inventory", viewport)
    browser.close()
