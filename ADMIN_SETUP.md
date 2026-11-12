# Sir Oyedot AI Creator — Owner Dashboard

## Live entry
https://sir-oyedot-ai-creator-1se5.vercel.app/admin.html

## Backend setup
- **Vercel Blob**, public store `sir-oyedot-site-content`, connected to the site's production environment, provides durable JSON content storage.
- `BLOB_READ_WRITE_TOKEN` is automatically provisioned by Vercel, never committed to GitHub.
- `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are configured as sensitive production environment variables and never committed to GitHub.
- `api/admin.js` handles authenticated editing; `api/site.js` serves public website content.
- The dashboard supports video URLs, homepage announcement, About text, WhatsApp number, and changing its own owner password.
- The static site remains usable even when the backend is unavailable. `data/site.json` in GitHub is the initial fallback; owner edits are stored in Blob.

## Security
Owner sessions use signed, HttpOnly, Secure, SameSite cookies. POST requests are origin-validated. The owner password can be rotated inside the dashboard. The rotated password is stored as a keyed hash; the key remains in the environment. No plaintext password is stored in the repository or Blob.

The site is a single-owner personal portfolio. Consider rate limiting via Vercel Firewall and stronger identity-provider login if expanding to multiple admin accounts.

## Publish
Pushing to main triggers Vercel production deployment. The first deployment after adding environment variables must finish before the backend can log in. Changes made through the dashboard take effect without redeploying.
