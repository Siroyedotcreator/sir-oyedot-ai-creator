# Sir Oyedot Website Admin

The dashboard is available at /admin.html after deployment.

## Required Vercel environment variables

Set these for the **sir-oyedot-ai-creator-1se5** Vercel project, in Production:

- `ADMIN_PASSWORD`: a unique, long, randomly generated password. Never commit this to GitHub.
- `ADMIN_SESSION_SECRET`: at least 32 bytes of unpredictable random text, distinct from the password.
- `GITHUB_CONTENT_TOKEN`: a fine-grained GitHub personal access token with **Contents: Read and write** permission limited to `Siroyedotcreator/sir-oyedot-ai-creator`.

Then redeploy the Vercel project. Admin login will not work until all three are set. This is deliberate; the backend fails closed.

The dashboard writes `data/site.json` to the GitHub main branch. Vercel redeploys it and `assets/main.js` reads the file publicly to show homepage updates and featured video links. Existing projects page and metadata are preserved.

Security: Admin sessions use HMAC-signed HttpOnly Secure SameSite cookies; write requests check the same-origin header; the GitHub token is only used in the server-side function. Add persistent login rate limiting and stronger identity-provider authentication before inviting additional admins or exposing the system to significant traffic.

No database has been connected, and no secret is stored in the repository.
