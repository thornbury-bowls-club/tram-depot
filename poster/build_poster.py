"""Build the guest sign-in QR poster (A4 PDF + PNG preview).

Usage:
    python3 poster/build_poster.py https://thornbury-guests.pages.dev

Needs Python 3 with Playwright and Google Chrome (or Playwright's Chromium).
If the guest page ever moves to a new address, run this again and reprint.
"""
import base64
import html
import pathlib
import sys

from qrcodegen import QrCode

HERE = pathlib.Path(__file__).resolve().parent
ASSETS = HERE.parent / "guest" / "assets"


def qr_svg(url: str) -> str:
    qr = QrCode.encode_text(url, QrCode.Ecc.QUARTILE)
    n, quiet = qr.get_size(), 4
    parts = [f"M{x + quiet},{y + quiet}h1v1h-1z"
             for y in range(n) for x in range(n) if qr.get_module(x, y)]
    size = n + quiet * 2
    return (f'<svg class="qr" viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg" '
            f'shape-rendering="crispEdges" role="img" aria-label="QR code for {html.escape(url)}">'
            f'<rect width="{size}" height="{size}" fill="#fff"/>'
            f'<path d="{"".join(parts)}" fill="#0f1f47"/></svg>')


def data_uri(path: pathlib.Path, mime: str) -> str:
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def poster_html(url: str) -> str:
    short = url.replace("https://", "").replace("http://", "").rstrip("/")
    f = lambda name: (ASSETS / "fonts" / name).as_uri()
    return f"""<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>Guest sign-in poster</title>
<style>
@font-face{{font-family:Barlow;font-weight:700;src:url({f('BarlowCondensed-Bold.woff')})}}
@font-face{{font-family:Atkinson;font-weight:400;src:url({f('AtkinsonHyperlegible-Regular.woff')})}}
@font-face{{font-family:Atkinson;font-weight:700;src:url({f('AtkinsonHyperlegible-Bold.woff')})}}
@page{{size:A4;margin:0}}
*{{box-sizing:border-box;margin:0}}
html,body{{width:210mm;height:297mm;overflow:hidden}}
body{{font-family:Atkinson,sans-serif;color:#16203a;background:#fff;display:flex;flex-direction:column;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.top{{background:#0f1f47;color:#fff;text-align:center;padding:10mm 10mm 8mm}}
.crest{{width:26mm;display:block;margin:0 auto 4mm}}
.welcome{{font-family:Barlow;font-size:15pt;letter-spacing:.22em;text-transform:uppercase;color:#ef7d1a}}
h1{{font-family:Barlow;font-size:50pt;line-height:1;letter-spacing:.03em;text-transform:uppercase;margin-top:2mm;white-space:nowrap}}
.stripe{{height:5mm;background:#ef7d1a}}
.mid{{flex:1;display:flex;flex-direction:column;align-items:center;padding:8mm 16mm 0;text-align:center}}
.say{{font-size:19pt;font-weight:700;line-height:1.25}}
.say span{{color:#a24d06}}
.qrbox{{margin-top:7mm;padding:5mm;border:1.2mm solid #0f1f47;border-radius:6mm;background:#fff;position:relative}}
.qrbox::before,.qrbox::after{{content:"";position:absolute;width:14mm;height:14mm;border:2mm solid #ef7d1a}}
.qrbox::before{{top:-3.4mm;left:-3.4mm;border-right:0;border-bottom:0;border-top-left-radius:7mm}}
.qrbox::after{{bottom:-3.4mm;right:-3.4mm;border-left:0;border-top:0;border-bottom-right-radius:7mm}}
.qr{{display:block;width:82mm;height:82mm}}
.url{{margin-top:4mm;font-size:13pt;color:#5a6379}}
.url b{{color:#16203a}}
.steps{{display:flex;gap:6mm;margin-top:8mm;width:100%}}
.step{{flex:1;display:flex;flex-direction:column;align-items:center;gap:2mm;font-size:12.5pt;line-height:1.3}}
.n{{width:11mm;height:11mm;border-radius:50%;background:#0f1f47;color:#fff;font-family:Barlow;font-size:19pt;display:flex;align-items:center;justify-content:center}}
.law{{margin-top:6mm;font-size:11pt;color:#5a6379;max-width:150mm;line-height:1.4}}
.law b{{color:#16203a}}
.bottom{{display:flex;justify-content:center;padding:0 14mm 12mm}}
.script{{width:62mm;display:block}}
</style></head><body>
<div class="top">
  <img class="crest" src="{data_uri(ASSETS / 'crest.webp', 'image/webp')}" alt="">
  <div class="welcome">Welcome to Thornbury Bowls Club</div>
  <h1>Guests, please sign in</h1>
</div>
<div class="stripe"></div>
<div class="mid">
  <p class="say">Scan with your phone camera <span>to sign the guest register</span></p>
  <div class="qrbox">{qr_svg(url)}</div>
  <p class="url">or visit <b>{html.escape(short)}</b></p>
  <div class="steps">
    <div class="step"><div class="n">1</div>Point your camera<br>at the code</div>
    <div class="step"><div class="n">2</div>Type your name<br>(email optional)</div>
    <div class="step"><div class="n">3</div>All done.<br>Enjoy your visit!</div>
  </div>
  <p class="law">Victorian liquor laws ask every guest to sign in <b>each visit</b>.<br>No phone? Just ask at the bar.</p>
</div>
<div class="bottom">
  <img class="script" src="{data_uri(ASSETS / 'script.webp', 'image/webp')}" alt="Thornbury Bowls Club">
</div>
</body></html>"""


def main() -> None:
    url = sys.argv[1] if len(sys.argv) > 1 else "https://thornbury-guests.pages.dev"
    out = HERE / "guest-signin-poster"
    page_html = HERE / "guest-signin-poster.html"
    page_html.write_text(poster_html(url), encoding="utf-8")

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(channel="chrome")
        except Exception:
            browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 794, "height": 1123}, device_scale_factor=2)
        page.goto(page_html.as_uri())
        page.evaluate("document.fonts.ready")
        page.pdf(path=str(out.with_suffix(".pdf")), format="A4", print_background=True,
                 margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
        page.screenshot(path=str(out.with_suffix(".png")), full_page=True)
        browser.close()
    print(f"QR points to {url}\nWrote {out.with_suffix('.pdf')} and {out.with_suffix('.png')}")


if __name__ == "__main__":
    main()
