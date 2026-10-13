# Terrence Jae's 1st Birthday Celebration and Christening - RSVP Website

Static safari-themed invitation site (`index.html`) for Terrence Jae's 1st Birthday Celebration and Christening, plus Vercel serverless API (`/api`) with Upstash Redis storage.

## Deploy on Vercel
1. Import this repo in Vercel (no build settings needed).
2. Storage tab > add **Upstash Redis** (Marketplace) and connect it to the project.
3. Settings > Environment Variables: `ADMIN_USER`, `ADMIN_PASSWORD`, `ADMIN_SECRET` (long random string).
4. Redeploy.

## Notes
- Public sees guest names/status only; admin login (🔑 on the guest list) shows full details.
- Gift wording is intentionally open-ended; no specific registry or fund details are configured.
- Locally (static server) RSVPs fall back to localStorage and admin login is disabled.

Ninong Beans Creation 2026 - Full Stack Web Developer
