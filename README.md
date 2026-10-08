# Terrence Jae's 1st Birthday - RSVP Website

Static site (`index.html`) plus Vercel serverless API (`/api`) with Upstash Redis storage.

## Deploy on Vercel
1. Import this repo in Vercel (no build settings needed).
2. Storage tab > add **Upstash Redis** (Marketplace) and connect it to the project.
3. Settings > Environment Variables: `ADMIN_USER`, `ADMIN_PASSWORD`, `ADMIN_SECRET` (long random string).
4. Redeploy.

## Notes
- Public sees guest names/status only; admin login (🔑 on the guest list) shows full details.
- Fill `FUND_INFO` (GCash/bank) in the script of `index.html`.
- Locally (static server) RSVPs fall back to localStorage and admin login is disabled.

Ninong Beans Creation 2026 - Full Stack Web Developer
