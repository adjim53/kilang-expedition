# Kilang Mountain Expedition 2026

Expedition portal for the Kilang Mountain Expedition: free registration with QR
passes, registration slips, summit tracking and donations —
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
npm run setup               # creates the tables
npm run dev
```

Open http://localhost:3000.

Registration is free and needs no keys. With no Paystack keys in `.env`,
donations run in **demo mode**: the "Donate" button skips Paystack and records
the donation immediately. Emails and SMS are printed to the terminal instead of
being sent. Demo mode switches itself off in production.

Optional: `npm run db:seed:demo` adds three fake participants and two fake
donations so the back office has something to show. Do not run it on the live database.

## Before you go live — checklist

| What | Where |
| --- | --- |
| **Donation amounts** (quick-pick buttons, minimum, maximum) | `src/data/donations.ts` |
| **Partner logos** | `src/data/brand.ts`, images in `public/brand/` |
| **Exact venue map pins** (currently approximate) | `src/data/locations.ts` — set real lat/lng and `verified: true` |
| **Legend / folklore text** — have it reviewed by the community | `src/data/content.ts` |
| **Safety waiver** — a draft; have a lawyer review it | `src/app/waiver/page.tsx` |
| **Gallery** — real photos, YouTube IDs and post links | `src/data/content.ts`, images in `public/gallery/` |
| **Recommended lodgings** | `src/data/content.ts` (`TRAVEL_GUIDE`) |
| Paystack live keys (donations) | `.env` |
| Paystack webhook URL → `https://YOUR-DOMAIN/api/webhooks/paystack` | Paystack dashboard → Settings → API Keys & Webhooks |
| Resend API key + a verified sending domain (`EMAIL_FROM`) | `.env` |
| Termii API key + an approved sender ID | `.env` |
| **First admin account** — `npm run admin:create -- --email you@example.com --name "Your Name"` against the production database, then add everyone else at `/admin/users` | terminal |
| Your public URL (`NEXT_PUBLIC_APP_URL`) — used in QR codes and emails | `.env` |

## How it works

1. **Register (free, automatic)** — the climber fills in the form.
   `POST /api/register` validates it, stores the registration, assigns a pass ID
   (`KIL-2026-XXXX`) with its QR code, and sends the email (Resend) and SMS
   (Termii). There is no payment and no ticket category.
2. **Pass and slip** — the browser goes straight to `/pass/KIL-2026-XXXX?t=…`.
   **Print slip** opens `/pass/…/slip`, a one-page A4 registration slip with the
   same QR code. The `t` token is secret; without it both pages return 404.
3. **Checkpoints** — marshals sign in at `/admin/login`, open **Check-in**, pick
   their checkpoint and scan. There are four, in order (`src/lib/checkpoints.ts`):
   medical checkup → ascent start → summit → back at base.
   - Scanning a genuine QR at the ascent start, the summit or back at base
     **records it automatically** and reopens the camera for the next climber.
   - Medical clearance is never automatic: the scan shows the climber and the
     medical team confirms. A pass found by typed ID is not auto-recorded either.
   - No medical clearance, no climb; no ascent start, no summit record.
   - The scanner checks the pass's secret token, so a QR rebuilt from a pass ID
     alone shows as *not genuine*.
4. **Summit tracker** — `/admin/tracker` shows who has started, summited and
   returned, and who is still on the mountain. The climber's own pass shows the
   same progress.
5. **Donations** — the home page's donation form stores a `PENDING` donation and
   opens Paystack. Two paths lead to the same idempotent function
   (`src/lib/donations.ts`), so a gift is never counted or receipted twice:
   - `POST /api/webhooks/paystack` — checks the `x-paystack-signature` HMAC,
     then re-verifies the reference with Paystack's API.
   - `GET /api/payments/verify` — called by the browser straight after payment;
     also verified with Paystack server-side.
   The donor gets a thank-you receipt by email.

Registrations made before registration became free keep their payment record
(amount, ticket bought, Paystack transaction) on their back-office page.

## Back office

Sign in at `/admin/login` with your own email and password. There are three roles:

| Role | Can |
| --- | --- |
| Admin | everything below, plus manage users, cancel/reinstate registrations, see and export donations |
| Registration staff | view, search, edit and export registrations; print slips; resend passes; issue a new pass link; check climbers in |
| Marshal | scan passes, search climbers, record checkpoints, watch the summit tracker, resend a pass |

- **Registrations** (`/admin/registrations`) — totals, kit sizes, filters, CSV export, **Print slips** (every climber matching the filters, one A4 page each), and a page per registration with its full history.
- **Summit tracker** (`/admin/tracker`) — live counts and the list of climbers still on the mountain; refreshes itself every 15 seconds.
- **Donations** (`/admin/donations`) — totals by well-wishers and partners, CSV export, and "Re-check with Paystack" for a donation that shows as not completed.
- **Users** (`/admin/users`) — add people (they get a temporary password, shown once, which they must change), change roles, reset passwords, deactivate. Deactivating or resetting signs the person out everywhere.
- Every staff action is recorded in the audit log with who and when.
- Sign-in is rate-limited per account and per address; sessions last 14 hours and are stored server-side so they can be revoked.

## Project map

```
prisma/schema.prisma        Data model (Registration, Donation, back office)
prisma/seed.ts              Demo participants and donations (with --demo)
src/data/                   All editable content: event facts, donations, partners, map, legend, packing list
src/app/page.tsx            Landing page
src/app/pass/[passId]/      Digital pass and printable registration slip
src/app/waiver/             Safety waiver
src/app/admin/               Back office: registrations, slips, check-in & QR scanner, summit tracker, donations, users
src/app/api/                register · donations · payments · webhooks/paystack · admin · pass QR
src/components/sections/    Hero, legend, schedule, gallery, registration, donations, map, logistics
src/lib/                    Checkpoints, donations, Paystack, email, SMS, QR, admin auth
.github/workflows/          CI (pull requests) and deploy (main)
scripts/check-integrations.ts  Pre-launch integration check
scripts/create-admin.ts        Create or reset a back-office account from the terminal
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
which applies database migrations, then builds the site.

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
   `TERMII_API_KEY`, `TERMII_SENDER_ID`.
   For Preview, use Paystack **test** keys and leave Resend/Termii empty so
   previews never email or text real people.
4. **Redeploy.** Deployments → latest → **⋯ → Redeploy**.
5. **Domain (optional).** Settings → Domains. Then update `NEXT_PUBLIC_APP_URL`
   and the Paystack webhook URL to match, and redeploy.

Keys are read when the site runs, so after changing one, redeploy — no code change needed.

## CI/CD

| What | When | Does |
| --- | --- | --- |
| `.github/workflows/ci.yml` | every pull request and push to `main` | lint · type-check · unit tests · `vercel-build` against a real Postgres · smoke test (home page, waiver, `/api/health`, webhook rejects unsigned calls, free registration returns a pass) |
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
| `npm run setup` | Create the tables |
| `npm run db:migrate` | After editing `prisma/schema.prisma`: create a new migration |
| `npm run db:seed:demo` | Add fake participants and donations (never on the live database) |
| `npm run db:studio` | Browse the database |
