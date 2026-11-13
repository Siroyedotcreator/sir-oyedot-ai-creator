# Sir Oyedot documentary archive update

Prepared for repository: `Siroyedotcreator/sir-oyedot-ai-creator`

This package includes a **ready-to-publish** `documentaries.html` page designed to reuse the existing site's `assets/styles.css` and `assets/main.js`. It includes 3 verified published YouTube links and no false placeholder videos.

## Integration

1. Place `documentaries.html` in the repository root, alongside `index.html` and `projects.html`.
2. Run `python apply_updates.py` at the repository root to add a Documentaries navigation item to your existing pages, a homepage discovery panel, a direct series link on `projects.html`, and the documentary URL to your sitemap. This script skips sections already added and does not alter existing video URLs.
3. Review the changes, commit and push to `main` so the existing GitHub-linked deployment can run.

**Note:** No changes have been made to the live website. The connected GitHub tool returned HTTP 403 (insufficient integration write access). The YouTube list was retrieved from public channel videos via vidIQ and titles/episode metadata were verified. Your vidIQ login is connected, but the list of directly authorized YouTube channels is empty.

## Video choices

- S1 Episode 1: Before the Crown - https://www.youtube.com/watch?v=AGzadJPqByY
- S1 Episode 12: The Kingdom That Never Died - https://www.youtube.com/watch?v=_zhbzdYoTlI
- S2 Episode 1: Beyond the Palace: What One Bead Reveals - https://www.youtube.com/watch?v=xUAGtE1CGvQ
