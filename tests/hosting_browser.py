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
        page.locator('nav button[data-page="hosting"]').click()
        expect(page.locator("#hosting-results .line")).to_have_count(3)
        expect(page.locator("#new")).to_be_hidden()
        page.locator("#hosting-filter").select_option("lab")
        expect(page.locator("#hosting-results .line")).to_have_count(1)
        expect(page.locator("#hosting-results")).to_contain_text("Da avviare")
        page.locator('[data-hosting-detail="lab"]').click()
        expect(page.locator("#modal")).to_be_visible()
        expect(page.locator("#modalBody")).to_contain_text("Nessuna connessione alla produzione")
        page.locator("#close").click()
        page.locator("#hosting-filter").select_option("all")
        expect(page.locator("#hosting-results .line")).to_have_count(3)
        assert not errors, errors
        assert not external, external
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        ctx.close()
        print("PASS hosting inventory", viewport)
    browser.close()
