# Kilang Mountain Expedition 2026

Expedition portal and ticketing platform for the Kilang Mountain Expedition,
Kaltungo, Gombe State, Nigeria (December 30–31, 2026).

Next.js 15 (App Router, React 19, TypeScript) · Tailwind CSS · Framer Motion ·
Prisma + PostgreSQL · Paystack · Resend · Termii · Leaflet.

## Run it on your computer

You need [Node.js 22](https://nodejs.org) and a PostgreSQL database — the
easiest is a free one from [neon.tech](https://neon.tech) (keep it separate
from the production database). In a terminal, inside this folder:

```bash
npm install
copy .env.example .env      # macOS/Linux: cp .env.example .env
#   → paste your database URL into DATABASE_URL and DATABASE_URL_UNPOOLED
npm run setup               # creates the tables and the three ticket tiers
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
configured (never the keys). CI uses it, and you can point an uptime monitor at it.

## Deploying to Vercel

Vercel builds straight from GitHub: every pull request gets a preview URL and
every push to `main` goes to production. Each build runs `npm run vercel-build`,
which applies database migrations, re-applies the ticket tiers from
`src/data/tiers.ts`, then builds the site.

One-time setup:

1. **Import the project.** vercel.com → **Add New… → Project** → pick this
   GitHub repository → **Deploy**. The first build fails until step 2 is done; that is expected.
2. **Add a database.** In the Vercel project → **Storage** → **Create
   Database** → **Neon (Postgres)** → connect it to the project. This sets
   `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. Turn on Neon's **preview
   branching** option so preview deployments get their own copy of the
   database instead of migrating production.
3. **Add the app's settings.** Project → **Settings → Environment Variables**,
   for Production (see `.env.example`):
   `NEXT_PUBLIC_APP_URL` (your https address), `PAYSTACK_SECRET_KEY`,
   `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`,
   `TERMII_API_KEY`, `TERMII_SENDER_ID`, `ADMIN_SECRET_KEY`.
   For Preview, use Paystack **test** keys and leave Resend/Termii empty so
   previews never email or text real people.
4. **Redeploy.** Deployments → latest → **⋯ → Redeploy**.
5. **Domain (optional).** Settings → Domains. Then update `NEXT_PUBLIC_APP_URL`
   and the Paystack webhook URL to match, and redeploy.

Keys are read when the site runs, so after changing one, redeploy — no code change needed.

## CI/CD

| What | When | Does |
| --- | --- | --- |
| `.github/workflows/ci.yml` | every pull request and push to `main` | lint · type-check · unit tests · `vercel-build` against a real Postgres · smoke test (home page, waiver, `/api/health`, webhook rejects unsigned calls, registration reaches the database) |
| Vercel | every pull request / push to `main` | preview deployment / production deployment |
| `.github/dependabot.yml` | weekly | dependency update pull requests |

To stop broken code reaching production, protect `main`: GitHub → Settings →
**Branches → Add branch ruleset** (or *Add rule*) for `main` → require a pull
request and require the **Lint, type-check, test, build** status check. Then
changes go in through pull requests, each with its own Vercel preview link.

The camera-based QR scanner only works over HTTPS (Vercel provides it).

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` · `npm run typecheck` | Code checks |
| `npm test` | Unit tests (Vitest) |
| `npm run check:integrations` | Live, read-only check of Paystack, Resend and Termii |
| `npm run setup` | Create the tables + seed tiers |
| `npm run db:migrate` | After editing `prisma/schema.prisma`: create a new migration |
| `npm run db:seed` | Re-apply tiers from `src/data/tiers.ts` |
| `npm run db:studio` | Browse the database |
