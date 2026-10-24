"""Build self-contained desktop and phone previews from the production sources."""
from pathlib import Path
import base64
import html
import re

root = Path(__file__).resolve().parent.parent
page = (root / 'index.html').read_text()
page = re.sub(r'<link rel="stylesheet" href="assets/style.css[^\"]*">',
              lambda _: '<style>' + (root / 'assets/style.css').read_text() + '</style>', page)
page = re.sub(r'  <script src="assets/(?:config|visitors)\.js[^\"]*" defer></script>\n', '', page)
page = re.sub(r'<script src="assets/main.js[^\"]*" defer></script>',
              lambda _: '<script>' + (root / 'assets/main.js').read_text() + '</script>', page)
# Inline navigation script must execute after the preview DOM exists.
script = re.search(r'<script>.*?</script>', page, re.S).group()
page = page.replace(script, '').replace('</body>', script + '\n</body>')
photo = base64.b64encode((root / 'profile.jpg').read_bytes()).decode()
page = page.replace('src="profile.jpg"', 'src="data:image/jpeg;base64,' + photo + '"')
page = page.replace('href="cv.pdf"', 'href="https://xuhuilu.github.io/cv.pdf"')
output = root / 'previews'
output.mkdir(exist_ok=True)
page = '\n'.join(line.rstrip() for line in page.splitlines()) + '\n'
(output / 'academic-homepage.html').write_text(page)
(output / 'mobile.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Xuhui Lu — Phone Preview</title>
<style>body{margin:0;background:#edf0f6;display:grid;place-items:center;min-height:100vh}iframe{width:390px;max-width:100vw;height:844px;max-height:100dvh;border:1px solid #cdd4e1;border-radius:8px;background:white}</style>
<iframe srcdoc="PREVIEW_DOCUMENT" title="390-pixel mobile preview of Xuhui Lu's homepage"></iframe></html>'''.replace("PREVIEW_DOCUMENT", html.escape(page, quote=True)))
print('Built previews/academic-homepage.html and previews/mobile.html')
