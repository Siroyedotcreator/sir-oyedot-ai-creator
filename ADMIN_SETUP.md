# Sir Oyedot AI Creator – Backend and Admin Setup

The GitHub/Vercel site stays live as normal if the CMS has not been connected.
Admin dashboard URL: https://sir-oyedot-ai-creator-1se5.vercel.app/admin.html

## Connect a dedicated Supabase project (owner-controlled)

1. Create a separate Supabase project called **Sir Oyedot CMS** in YOUR Supabase organisation. Do not reuse a client's database. Note project creation may have an associated cost.
2. Open the Supabase project's **SQL Editor** and run `supabase/schema.sql` exactly once. This creates a CMS database with per-table Row Level Security, then imports six video links and three current projects.
3. In Supabase **Authentication → Users**, create/invite your administrator with your private email and a strong password. Use a verified account. (The website has no public signup.)
4. Copy that user's **User UID** from Authentication → Users. In the SQL Editor run:
   `insert into public.admin_users(user_id) values ('YOUR_AUTH_USER_UUID') on conflict do nothing;`
   Do not use an email address as the database admin ID.
5. From Supabase **Settings → API Keys**, copy the **publishable** key (starts with `sb_publishable_`) and project URL (format `https://PROJECTREF.supabase.co`).
6. In the website's GitHub repo, edit `assets/cms-config.js` and set `url` and `publishableKey`. This config is intentionally public. **Never put a Supabase secret key or service_role token into it.**
7. Vercel automatically deploys the GitHub change. Visit `/admin.html` and log in with the Supabase Auth email and password.

## What the dashboard can manage

- Published/unpublished AI video links and their order
- Creative project cards, descriptions, links, appearance and order
- Site announcement, contact WhatsApp number and email field
- Overview of stored content

Saving updates the database immediately. Public website pages fetch published rows on load, falling back to the original static page when the backend is unavailable. SEO and the original sitemap are preserved.

## Security

- Admin users are whitelisted by immutable Supabase Auth user UUID.
- All exposed CMS tables have RLS. Anonymous users only read published content and site settings.
- Admin sign-in is protected by Supabase Auth. There is no registration screen.
- No server-side secret is stored in GitHub or browser code.
- Admin sessions are stored in sessionStorage, cleared when the tab closes or you sign out.
- For access management, remove an admin's UUID from `admin_users` and revoke their Auth sessions.

## Notes

The admin page is included in the live site but the backend is **not active** until the database has been created and configured. Do not regard the setup screen as a production-ready login before completing the steps above.
