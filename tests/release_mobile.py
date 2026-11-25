from pathlib import Path
from playwright.sync_api import sync_playwright, expect
root = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in (320,360,390,760):
        ctx = browser.new_context(viewport={"width":width,"height":800},offline=True)
        page = ctx.new_page()
        errors, requests = [], []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("request", lambda r: requests.append(r.url) if r.url.startswith(("http://","https://")) else None)
        page.goto((root / "index.html").as_uri())
        nav = page.locator("nav button[data-page]")
        expect(nav).to_have_count(12)
        for i in range(nav.count()):
            button=nav.nth(i)
            assert button.bounding_box()["height"] >= 44
            button.click()
            expect(button).to_have_attribute("aria-current","page")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), (width,i)
        expect(page.locator("footer")).to_contain_text("1.0.0-rc.3")
        assert not errors, errors
        assert not requests, requests
        ctx.close()
        print("PASS mobile touch navigation",width)
    browser.close()
