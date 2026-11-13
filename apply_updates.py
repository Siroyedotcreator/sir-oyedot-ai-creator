#!/usr/bin/env python3
"""Integrate the Ilé Ifẹ̀ documentary page into the existing static site, idempotently.
Run from the root of a checkout of Siroyedotcreator/sir-oyedot-ai-creator.
Does not alter existing YouTube video links, configuration or CMS data.
"""
from pathlib import Path
from shutil import copy2
from html import escape
import re

root = Path.cwd()
source = Path(__file__).resolve().parent / 'documentaries.html'
if not (root / 'index.html').is_file() or not (root / 'projects.html').is_file():
    raise SystemExit('ERROR: Run this script from the website repository root containing index.html and projects.html.')
if not source.is_file():
    raise SystemExit('ERROR: documentaries.html must remain beside apply_updates.py.')

backup_dir = root / '.documentary-update-backup'
backup_dir.mkdir(exist_ok=True)

def rewrite(path: Path, new_text: str):
    old = path.read_text(encoding='utf-8') if path.exists() else None
    if old == new_text:
        print('Already up to date:', path.name)
        return
    if old is not None:
        backup = backup_dir / path.name
        if not backup.exists():
            copy2(path, backup)
    path.write_text(new_text, encoding='utf-8')
    print('Updated:', path.name)

rewrite(root / 'documentaries.html', source.read_text(encoding='utf-8'))

for name in ['index.html', 'about.html', 'projects.html', 'press.html', 'training.html', 'contact.html']:
    path = root / name
    if not path.exists():
        continue
    html = path.read_text(encoding='utf-8')
    # The original portfolio navigation uses Work; preserve current-page aria attributes.
    if '<nav' in html and 'href="documentaries.html"' not in html.split('</nav>', 1)[0]:
        html, n = re.subn(r'(<a\b(?=[^>]*href="projects\.html")[^>]*>Work</a>)', r'\1<a href="documentaries.html">Documentaries</a>', html, count=1)
        if not n:
            print('Review navigation manually:', name)
    # Only add footer link where there is a Projects item; no duplicate insertions.
    footer_match = re.search(r'<footer\b[\s\S]*?</footer>', html)
    if footer_match and 'href="documentaries.html"' not in footer_match.group(0):
        footer = footer_match.group(0).replace('<a href="projects.html">Projects</a>', '<a href="projects.html">Projects</a><a href="documentaries.html">Documentaries</a>', 1)
        html = html[:footer_match.start()] + footer + html[footer_match.end():]
    if name == 'index.html' and 'id="doc-home-feature"' not in html:
        teaser = '''<section class="section shell" id="doc-home-feature" aria-labelledby="doc-home-title"><div style="background:#e8e2d6;border-radius:12px;padding:clamp(28px,5vw,54px)"><p class="kicker">FEATURED DOCUMENTARY SERIES</p><h2 id="doc-home-title">Ilé Ifẹ̀: The Dawn of a Kingdom</h2><p style="max-width:620px;line-height:1.8">Season 1 is complete with 12 episodes. Season 2 has begun. Watch three selected chapters of this AI-assisted Yoruba cultural storytelling series.</p><a class="button button-primary" href="documentaries.html">Explore the documentary ↗</a></div></section>'''
        marker = '<section class="course-promo"'
        if marker in html:
            html = html.replace(marker, teaser + '\n' + marker, 1)
        else:
            html = html.replace('</main>', teaser + '</main>', 1)
    if name == 'projects.html':
        # Insert the new link inside the existing Ilé Ifẹ̀ project copy, not the artwork.
        start_idx = html.find('<article class="project-row" id="ile-ife">')
        end_idx = html.find('</article>', start_idx) if start_idx >= 0 else -1
        if start_idx >= 0 and end_idx > start_idx:
            article = html[start_idx:end_idx]
            if 'href="documentaries.html"' not in article:
                needle = 'Explore on YouTube ↗</a>'
                link = '<p><a class="text-link" href="documentaries.html">Explore the documentary seasons ↗</a></p>'
                if needle in article:
                    article = article.replace(needle, needle + link, 1)
                    html = html[:start_idx] + article + html[end_idx:]
                else:
                    print('Review projects.html: could not locate original Ilé Ifẹ̀ YouTube link')
        else:
            print('Review projects.html: could not locate Ilé Ifẹ̀ project')
    rewrite(path, html)

sitemap = root / 'sitemap.xml'
if sitemap.exists():
    xml = sitemap.read_text(encoding='utf-8')
    loc = 'https://sir-oyedot-ai-creator-1se5.vercel.app/documentaries.html'
    if loc not in xml:
        xml = xml.replace('</urlset>', '  <url>\n    <loc>' + escape(loc) + '</loc>\n  </url>\n</urlset>', 1)
    rewrite(sitemap, xml)

print('Review git diff, then commit and push when ready. Originals backed up under', backup_dir.name)
