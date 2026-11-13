#!/usr/bin/env python3
"""Integrate the provided, unchanged portrait into the existing Sir Oyedot website.

Usage:
    python3 apply_profile_photo.py /path/to/sir-oyedot-ai-creator

Safe to rerun. Existing website files are backed up before modifications.
This script does not edit or transcode the portrait.
"""
from __future__ import annotations

from pathlib import Path
import shutil
import sys

PACKAGE = Path(__file__).resolve().parent
ROOT = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv) > 1 else Path.cwd().resolve()
SRC = PACKAGE / 'assets' / 'sir-oyedot-official-portrait.jpg'
DST = ROOT / 'assets' / SRC.name
BACKUPS = ROOT / '.profile-photo-update-backup'
URL = 'https://sir-oyedot-ai-creator-1se5.vercel.app/assets/' + SRC.name

for required in ('index.html', 'about.html', 'assets/styles.css'):
    if not (ROOT / required).is_file():
        raise SystemExit(f'Missing {required} in {ROOT}. Use your sir-oyedot-ai-creator repository root.')
if not SRC.is_file():
    raise SystemExit(f'Missing original image: {SRC}')


def write_if_changed(relative_path: str, content: str) -> None:
    target = ROOT / relative_path
    before = target.read_text(encoding='utf-8')
    if before == content:
        print(f'Already up to date: {relative_path}')
        return
    back = BACKUPS / relative_path
    back.parent.mkdir(parents=True, exist_ok=True)
    if not back.exists():
        shutil.copy2(target, back)
    target.write_text(content, encoding='utf-8')
    print(f'Updated: {relative_path}')


# Preserve the exact original image bytes, including colour and EXIF if any.
DST.parent.mkdir(parents=True, exist_ok=True)
if not DST.exists() or DST.read_bytes() != SRC.read_bytes():
    if DST.exists():
        backup = BACKUPS / 'assets' / DST.name
        backup.parent.mkdir(parents=True, exist_ok=True)
        if not backup.exists():
            shutil.copy2(DST, backup)
    shutil.copyfile(SRC, DST)
    print(f'Copied untouched photo: assets/{SRC.name}')
else:
    print('Original photo already in place')

home_path = ROOT / 'index.html'
home = home_path.read_text(encoding='utf-8')
photo_markup = '''<figure class="creator-portrait-frame" aria-label="Official creator portrait">
  <img src="assets/sir-oyedot-official-portrait.jpg"
       alt="Official professional portrait of Oyedotun Opeyemi Stephen, Sir Oyedot AI Creator"
       width="1024" height="1536" decoding="async" fetchpriority="high" />
  <figcaption><strong>Oyedotun Opeyemi Stephen</strong><span>Sir Oyedot AI Creator · Filmmaker &amp; Storyteller</span></figcaption>
</figure>
'''
if 'class="creator-portrait-frame"' not in home:
    begin = home.find('<div class="hero-poster"')
    if begin < 0:
        raise SystemExit('Could not find existing homepage hero poster. Stopped before changing the HTML; inspect your website layout.')
    end = home.find('</section>', begin)
    if end < 0:
        raise SystemExit('Could not find closing homepage hero section; inspect the HTML.')
    home = home[:begin] + photo_markup + home[end:]

photo_schema = '"image":"' + URL + '",'
if photo_schema not in home and '"name":"Oyedotun Opeyemi Stephen",' in home:
    home = home.replace('"name":"Oyedotun Opeyemi Stephen",', '"name":"Oyedotun Opeyemi Stephen",' + photo_schema, 1)

preload = '<link rel="preload" as="image" href="assets/sir-oyedot-official-portrait.jpg" fetchpriority="high" />'
if preload not in home:
    home = home.replace('</head>', preload + '</head>', 1)
write_if_changed('index.html', home)

about_path = ROOT / 'about.html'
about = about_path.read_text(encoding='utf-8')
about_photo_markup = '''<figure class="about-portrait-frame">
  <img src="assets/sir-oyedot-official-portrait.jpg"
       alt="Official professional portrait of Oyedotun Opeyemi Stephen, Sir Oyedot AI Creator"
       width="1024" height="1536" loading="lazy" decoding="async" />
  <figcaption>Oyedotun Opeyemi Stephen<br /><strong>Sir Oyedot AI Creator</strong></figcaption>
</figure>
'''
if 'class="about-portrait-frame"' not in about:
    needle = '<section class="section shell two-columns about-body"><div>'
    if needle not in about:
        raise SystemExit('Could not find the About page profile section. Stopped before modifying About HTML.')
    about = about.replace(needle, needle + about_photo_markup, 1)
if photo_schema not in about and '"name":"Oyedotun Opeyemi Stephen",' in about:
    about = about.replace('"name":"Oyedotun Opeyemi Stephen",', '"name":"Oyedotun Opeyemi Stephen",' + photo_schema, 1)
write_if_changed('about.html', about)

style_path = ROOT / 'assets' / 'styles.css'
style = style_path.read_text(encoding='utf-8')
css = r'''
/* Official creator portrait: original photo file, displayed without filters or cropping. */
.creator-portrait-frame{margin:0;min-width:0;width:100%;max-width:440px;justify-self:center;align-self:center;border-radius:11px;overflow:hidden;background:#111b26;box-shadow:19px 19px 0 #e9e3d8;}
.creator-portrait-frame img{width:100%;height:auto;display:block;aspect-ratio:2/3;object-fit:contain;object-position:center;background:#171a20;}
.creator-portrait-frame figcaption{padding:17px 22px 20px;background:#122131;color:#f6f3ec;display:flex;flex-direction:column;gap:3px;}
.creator-portrait-frame figcaption strong{font:800 14px Manrope,'DM Sans',sans-serif;letter-spacing:-.02em;}
.creator-portrait-frame figcaption span{font-size:11px;letter-spacing:.03em;color:#b8cec9;}
.about-portrait-frame{margin:0 0 28px;max-width:420px;overflow:hidden;border-radius:10px;background:#132433;box-shadow:14px 14px 0 #ece7dc;}
.about-portrait-frame img{display:block;width:100%;height:auto;aspect-ratio:2/3;object-fit:contain;object-position:center;background:#171a20;}
.about-portrait-frame figcaption{padding:15px 21px;background:#132433;color:#f9f7ef;font-size:13px;line-height:1.6;}
.about-portrait-frame figcaption strong{font-weight:800;color:#bde7d9;}
@media(max-width:1020px) and (min-width:721px){.creator-portrait-frame{max-width:390px;box-shadow:10px 10px 0 #e9e3d8;}}
@media(max-width:720px){.creator-portrait-frame{max-width:360px;margin:0 auto;box-shadow:10px 10px 0 #e9e3d8;}.creator-portrait-frame figcaption{padding:14px 18px;}.about-portrait-frame{max-width:350px;margin:0 auto 30px;box-shadow:9px 9px 0 #ece7dc;}}
'''
if '/* Official creator portrait:' not in style:
    style += '\n' + css
write_if_changed('assets/styles.css', style)

print('\nAll profile photo files integrated locally. Review the changes, then commit/push to GitHub.')
print('Original files backed up under', BACKUPS)
