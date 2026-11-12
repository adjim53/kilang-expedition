# Kilang Mountain Expedition 2026

Expedition portal and ticketing platform for the Kilang Mountain Expedition,
Kaltungo, Gombe State, Nigeria (December 30–31, 2026).

Next.js 15 (App Router, React 19, TypeScript) · Tailwind CSS · Framer Motion ·
Prisma + SQLite · Paystack · Resend · Termii · Leaflet.

## Run it on your computer

You need [Node.js 20 or newer](https://nodejs.org). In a terminal, inside this folder:

```bash
npm install
copy .env.example .env      # macOS/Linux: cp .env.example .env
npm run setup               # creates the database and the three ticket tiers
npm run dev
```

Open http://localhost:3000.

With no Paystack keys in `.env`, the site runs in **demo payment mode**: the
"Pay" button skips Paystack and confirms the registration immediately, so you
can try the whole flow. Emails and SMS are printed to the terminal instead of
being sent. Demo mode switches itself off in production.

Optional: `npm run db:seed:demo` adds three fake participants so the check-in
portal has something to show. Do not run it on the live database.

## Before you go live — checklist

| What | Where |
| --- | --- |
| **Ticket prices** (currently placeholders: ₦5,000 / ₦10,000 / ₦50,000) | `src/data/tiers.ts`, then `npm run db:seed` |
| **Exact venue map pins** (currently approximate) | `src/data/locations.ts` — set real lat/lng and `verified: true` |
| **Legend / folklore text** — have it reviewed by the community | `src/data/content.ts` |
| **Safety waiver** — a draft; have a lawyer review it | `src/app/waiver/page.tsx` |
| **Gallery** — real photos, YouTube IDs and post links | `src/data/content.ts`, images in `public/gallery/` |
| **Recommended lodgings** | `src/data/content.ts` (`TRAVEL_GUIDE`) |
| Paystack live keys | `.env` |
| Paystack webhook URL → `https://YOUR-DOMAIN/api/webhooks/paystack` | Paystack dashboard → Settings → API Keys & Webhooks |
| Resend API key + a verified sending domain (`EMAIL_FROM`) | `.env` |
| Termii API key + an approved sender ID | `.env` |
| A long, private admin PIN (`ADMIN_SECRET_KEY`; `change-me` is refused) | `.env` |
| Your public URL (`NEXT_PUBLIC_APP_URL`) — used in QR codes and emails | `.env` |

## How it works

1. **Register** — the climber picks a tier and fills in the form. `POST /api/register`
   validates it and stores a `PENDING` registration. The price is always taken
   from the server, never from the browser.
2. **Pay** — Paystack inline checkout opens with that registration's reference.
3. **Confirm** — two paths lead to the same idempotent function
   (`src/lib/confirm.ts`), so a climber is never confirmed or messaged twice:
   - `POST /api/webhooks/paystack` — checks the `x-paystack-signature` HMAC,
     then re-verifies the reference with Paystack's API.
   - `GET /api/payments/verify` — called by the browser straight after payment
     so the pass appears immediately; also verified with Paystack server-side.
4. **Dispatch** — a pass ID (`KIL-2026-XXXX`) is assigned, then the email
   (Resend: pass, QR code, schedule, packing list, waiver link) and SMS (Termii) go out.
5. **Pass** — `/pass/KIL-2026-XXXX?t=…` shows the printable pass. The `t` token
   is secret; without it the page returns 404.
6. **Check-in** — marshals open `/admin/checkin`, enter the PIN, then search or
   scan QR codes. Two stages: medical clearance (Dec 30) and ascent muster
   (Dec 31). A climber who is not medically cleared cannot be checked in to climb.

## Project map

```
prisma/schema.prisma        Data model (TicketTier, Registration)
prisma/seed.ts              Seed tiers (+ demo participants with --demo)
src/data/                   All editable content: event facts, tiers, map, legend, packing list
src/app/page.tsx            Landing page
src/app/pass/[passId]/      Digital pass
src/app/waiver/             Safety waiver
src/app/admin/checkin/      Marshal check-in portal
src/app/api/                register · payments · webhooks/paystack · admin · pass QR
src/components/sections/    Hero, legend, schedule, gallery, registration, map, logistics
src/lib/                    Paystack, email, SMS, QR, confirmation, admin auth
.github/workflows/          CI (pull requests) and deploy (main)
scripts/check-integrations.ts  Pre-launch integration check
tests/                      Unit tests
```

## Checking the integrations

```bash
npm run check:integrations
```

Makes read-only calls to Paystack, Resend and Termii (no email, SMS or charge)
and reports anything that blocks launch: test vs live keys, an unverified
Resend sending domain, an unapproved Termii sender ID, low SMS balance, a
non-https public URL. Add `-- --strict` to exit with an error on any failure.

`GET /api/health` reports database status and which integrations are
configured (never the keys). The Docker image and the deploy workflow use it.

## CI/CD

| Workflow | Runs on | Does |
| --- | --- | --- |
| `.github/workflows/ci.yml` | every pull request (and from `deploy.yml`) | lint · type-check · unit tests · build · smoke test of the built site (home page, waiver, `/api/health`, webhook rejects unsigned calls) · Docker image builds |
| `.github/workflows/deploy.yml` | every push to `main`, or manually | runs CI → publishes `ghcr.io/<owner>/<repo>:latest` and `:<sha>` → calls your host's deploy hook → waits for `/api/health` on the live site |
| `.github/dependabot.yml` | weekly | dependency update pull requests |

Set up once, in GitHub → repository → Settings:

1. **Environments → New environment → `production`.** Optionally add yourself
   as a required reviewer so every release waits for your approval.
2. **Secrets and variables → Actions:**
   - secret `DEPLOY_HOOK_URL` — your host's deploy-hook URL (Render: service →
     Settings → Deploy Hook; Railway / Coolify have the same). Optional: without
     it the image is still published and you redeploy by hand.
   - variable `PRODUCTION_URL` — e.g. `https://kilangexpedition.ng`, for the
     post-deploy health check.

App secrets (Paystack, Resend, Termii, admin PIN) are set **on the host**,
never in GitHub.

## Deploying

The app ships as a Docker image (`Dockerfile`). On start it applies the
database schema, re-applies the ticket tiers from `src/data/tiers.ts`, and
starts the site on `$PORT` (default 3000).

SQLite is a file, so the host needs a **persistent volume mounted at `/data`**
(the database is `/data/kilang.db`). Render (Docker service + disk), Railway
(service + volume), Fly.io (volume) and any VPS work. Without a volume every
redeploy wipes the registrations.

Environment variables to set on the host — see `.env.example`:
`NEXT_PUBLIC_APP_URL`, `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`,
`RESEND_API_KEY`, `EMAIL_FROM`, `TERMII_API_KEY`, `TERMII_SENDER_ID`,
`ADMIN_SECRET_KEY`. They are read at runtime, so changing a key needs a restart,
not a rebuild. Leave `DATABASE_URL` at its image default.

Run it anywhere with Docker:

```bash
docker build -t kilang .
docker run -p 3000:3000 -v kilang-data:/data --env-file .env.production kilang
```

On serverless hosts such as Vercel, use PostgreSQL instead — the three steps
are at the top of `src/lib/prisma.ts`.

The camera-based QR scanner only works over HTTPS (or on localhost).

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` · `npm run typecheck` | Code checks |
| `npm test` | Unit tests (Vitest) |
| `npm run check:integrations` | Live, read-only check of Paystack, Resend and Termii |
| `npm run setup` | Create database + seed tiers |
| `npm run db:seed` | Re-apply tiers from `src/data/tiers.ts` |
| `npm run db:studio` | Browse the database |
