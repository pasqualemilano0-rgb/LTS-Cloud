from pathlib import Path
import os
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
PAGES = {"dashboard":"Panoramica","pipelines":"Pipeline","projects":"Progetti","runners":"Runner","security":"Sicurezza","settings":"Impostazioni","hosting":"Hosting","database":"Database","storage":"Storage","backup":"Backup","monitor":"Monitor"}
CLOUD = {"hosting","database","storage","backup","monitor"}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
    for size in ({"width":1280,"height":800},{"width":360,"height":800}):
        ctx = browser.new_context(viewport=size, offline=True)
        page = ctx.new_page()
        errors = []
        external = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("request", lambda r: external.append(r.url) if r.url.startswith(("http://","https://")) else None)
        page.goto((ROOT / "index.html").as_uri())
        expect(page.locator(".appbrand")).to_have_text("LTS CLOUD")
        for key, title in PAGES.items():
            page.locator(f'nav button[data-page="{key}"]').click()
            expect(page.locator("#heading")).to_have_text(title)
            expect(page.locator(f'nav button[data-page="{key}"]')).to_have_attribute("aria-current","page")
            if key in CLOUD:
                expect(page.locator("#content")).to_contain_text("Nessun accesso produttivo")
                expect(page.locator("#new")).to_be_hidden()
        page.locator('nav button[data-page="pipelines"]').click()
        expect(page.locator("tbody tr")).to_have_count(5)
        page.locator("#search").fill("Porti parsers")
        expect(page.locator("tbody tr")).to_have_count(1)
        page.locator("#search").fill("")
        page.locator("#filter").select_option("failure")
        expect(page.locator("tbody tr")).to_have_count(1)
        page.locator("#filter").select_option("all")
        page.locator("button[data-run='104']").first.click()
        expect(page.locator("#modal")).to_be_visible()
        expect(page.locator("#modalBody")).to_contain_text("[DEMO]")
        page.locator("#close").click()
        page.locator("#new").click()
        expect(page.locator("#runForm")).to_be_visible()
        page.locator("#runForm button[type=submit]").click()
        expect(page.locator("tbody tr")).to_have_count(6)
        page.locator("button[data-run='105']").first.click()
        page.locator("#cancelRun").click()
        expect(page.locator("tbody tr").first).to_contain_text("Annullata")
        page.locator('nav button[data-page="settings"]').click()
        page.locator("#reset").click()
        page.locator('nav button[data-page="pipelines"]').click()
        expect(page.locator("tbody tr")).to_have_count(5)
        assert not errors, errors
        assert not external, external
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Page horizontal overflow"
        print(f"PASS {size}: all 11 views, filters, details, queue, cancel, reset; no external requests")
        ctx.close()
    browser.close()
