# MyFinanceOS — Setup Notes

## Source
- Pulled from GitHub: https://github.com/AnuroopSrivastava/MyFinanceOS (branch: main). Already synced into /app; origin remote pre-configured.

## What it is
Premium local-first personal & business finance suite for India. Monorepo:
- `apps/web` — Next.js 16 (App Router, React 19, framer-motion, Radix UI, recharts). Main app + landing page.
- `packages/*` — `@financeos/ui`, `@financeos/shared`, `@financeos/database`, `@financeos/auth` (transpiled by Next).
- `backend/` — FastAPI boilerplate (status endpoints) + MongoDB. Not central to the Next app (app is local-first / Supabase).

## Environment setup done (2026-06)
- Installed workspace deps with `yarn install --ignore-engines` at /app (Node 20; some devDeps want Node 22).
- Removed `package-lock.json` & `bun.lock`; using `yarn.lock`.
- Supervisor `frontend` runs `yarn start` in `/app/frontend` → symlinked `/app/frontend -> /app/apps/web`.
- `apps/web/package.json` `start` script set to **production** `next start -p 3000 -H 0.0.0.0` (dev available as `start:dev`).
- Built production output (`yarn build`) — required because Next **dev** server's HMR/RSC streaming does not complete client hydration behind the Emergent preview proxy (framer-motion elements stayed at opacity:0). Production build renders correctly on the preview URL.
- Added Emergent preview hosts to `allowedDevOrigins` in `next.config.mjs`.

## IMPORTANT — rebuild required for code changes
Frontend runs a production build. After editing `apps/web` code:
`cd /app/apps/web && yarn build && sudo supervisorctl restart frontend`
(Hot reload is NOT active in this mode.)

## Status
- Landing page renders fully on preview URL (hero, phone mockup, finance cards, nav, CTAs). ✅
- Backend + MongoDB running. ✅

## Not configured (needed to access the dashboard beyond the landing page)
The "Get started" button gates entry behind Supabase + Google OAuth. Set these in `apps/web/.env.local` then rebuild:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` (contact form)

## Backlog / Next
- Provide Supabase + Google OAuth credentials to unlock the full dashboard (ledger, investments, tax, business, AI, vault, etc.).
- Optional: dev-mode hot reload workaround if active iteration is needed.
