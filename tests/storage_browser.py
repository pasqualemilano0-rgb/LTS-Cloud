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
        page.locator('nav button[data-page="storage"]').click()
        expect(page.locator("#storage-buckets .line")).to_have_count(2)
        expect(page.locator("#content")).to_contain_text("Non configurato")
        expect(page.locator("#content")).to_contain_text("1 MiB")
        expect(page.locator("#new")).to_be_hidden()
        expect(page.locator('input[type=file]')).to_have_count(0)
        assert not errors, errors
        assert not external, external
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        ctx.close()
        print("PASS storage inventory", viewport)
    browser.close()
