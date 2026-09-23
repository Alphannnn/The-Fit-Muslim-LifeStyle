# The Fit Muslim — Lifestyle

> **Faith. Discipline. Strength.**

A premium Islamic + fitness lifestyle platform: an e-commerce store for Islamic
and fitness products, a journal of faith-driven content, and the signature
feature — personalised, **coach-approved diet & training plans** anchored to your
prayer times.

---

## ✨ What's here

**Storefront**
- Database-backed catalogue with collections, stock, variants of kind
  (physical / digital / subscription), and per-product halal transparency —
  certifying authority, certificate number, every ingredient, every allergen.
- Product pages with reviews, verified-purchase badges, and related products.
- The Journal: markdown posts with categories, reading time and related reading.
- SEO throughout: canonical URLs, OpenGraph/Twitter cards, `Product`,
  `BlogPosting`, `FAQPage`, `Organization` and `BreadcrumbList` JSON-LD,
  `sitemap.xml` and `robots.txt`.

**Commerce**
- Server-authoritative cart: the browser says *what* is in the basket, never what
  it costs. Every price, total and stock check is re-read from the database at
  checkout.
- Stripe Checkout for one-off and subscription orders, with a signature-verified
  webhook and idempotent settlement (stock decrement, receipt email, cart clear,
  digital unlock) that is safe against webhook retries and success-page races.
- Orders, receipts, tracking and instant digital downloads.

**Accounts**
- Email/password auth: scrypt hashing, database-backed sessions, httpOnly
  cookies, and an anonymous cart that follows you in when you sign in.
- Dashboard with your plan, progress, orders and downloads.
- Progress logging — weight, waist, workouts, salah on time, fasts — with a
  streak counter and a weight trend chart.

**Plans**
- Four-screen intake → an engine drafts a plan from Mifflin-St Jeor, your
  activity level and your goal → a coach reviews, edits and approves it → it is
  delivered and you are emailed. **Nothing reaches a customer unapproved.**
- Meals and sessions anchor to *your* Fajr and Maghrib, not to a clock.
- Ramadan mode: suhoor/iftar split, halved training volume at unchanged loads.
  Switches on automatically during Ramadan.
- Allergies and avoided foods are filtered out before a coach ever sees the draft.

**Prayer-aware personalisation**
- Prayer times computed locally from solar geometry — no API, no key, no rate
  limit, works offline. Five calculation conventions, Ḥanafī/standard ʿAsr,
  and a one-seventh fallback for high latitudes.
- Hijri dates via the platform's Umm al-Qura calendar, with a tabular fallback.
- A floating prayer companion on every page and a 30-day table at `/prayer-times`.

## 🔐 The Control Panel (`/admin`)

A separate, self-contained admin application — not a section of the storefront.

**Getting in.** There is no admin link anywhere on the public site and no admin
sign-up form. The panel lives at `/admin`, is `noindex` and `Disallow`ed in
robots.txt, and the only way to reach it is to type the URL.

**Staff accounts are invite-only.** An existing admin issues a one-time link
from Admin → Team; the recipient sets their own password and the account is
created on the spot. Links are single-use, expire in seven days, and re-inviting
an address revokes the previous link. On a fresh database, bootstrap the first
admin from the command line:

```bash
pnpm admin:invite you@example.com admin
```

**Sessions are isolated from the storefront.** The panel uses its own cookie
(`tfm_admin`, `Path=/admin`, `SameSite=strict`, 12-hour life) and its own session
scope in the database. Signing into the shop grants no admin access *even for an
admin account*, and an admin session is never transmitted to a storefront route.
A demotion revokes live admin sessions immediately rather than waiting for
expiry.

**Sign-in is throttled.** Five failed attempts against an email or an IP locks
that bucket for 15 minutes. A customer account attempting the admin door gets
the identical error a wrong password does — the panel never confirms which
addresses are staff.

**Everything is logged.** Every state-changing action, plus successful and
failed sign-ins, is written to an audit trail with actor, IP and a readable
summary, visible under Admin → Activity.

### Roles

| | Coach | Admin |
|---|---|---|
| Dashboard, orders, customers, subscriptions | ✅ | ✅ |
| Plan queue — review, edit, approve, deliver | ✅ | ✅ |
| Products, journal, reviews, newsletter | ✅ | ✅ |
| Team — invite staff, change roles, revoke sessions | — | ✅ |
| Activity — the audit trail | — | ✅ |

Restricted areas are both hidden from the sidebar and guarded server-side.

### What you can manage

- **Dashboard** — 30-day revenue and orders with period-on-period movement, a
  revenue chart, best sellers, stock watch, and a "needs attention" queue.
- **Orders** — search, filter and sort; per-order detail with line items,
  address, Stripe references, status and tracking.
- **Customers** — spend, order count and plans per person; a full profile with
  order history, plans, subscription, progress log and reviews.
- **Plan queue** — every draft, flagged when it carries a medical note; edit the
  macros and approve, which delivers the plan and emails the customer.
- **Products & Journal** — full CMS with instant revalidation of the affected
  storefront pages.
- **Reviews** — moderation queue for anything not from a verified buyer.
- **Subscriptions** — billing state, renewal dates and monthly recurring total.
- **Newsletter** — the list with a CSV export.
- **Team & Activity** — staff, invitations, live sessions and the audit trail.

## 🛠 Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router) + **TypeScript** |
| Styling | **Tailwind CSS v4** with custom design tokens |
| Motion | **Framer Motion** |
| Database | **SQLite** via libSQL + **Drizzle ORM** — a file locally, [Turso](https://turso.tech) in production |
| Payments | **Stripe** Checkout + webhooks |
| Email | **Resend** (falls back to a database email log) |
| Fonts | Fraunces · Source Serif 4 · Plus Jakarta Sans · Amiri |
| Admin auth | Scoped sessions, scrypt, invite-only, rate-limited, audited |

## 🚀 Getting Started

```bash
pnpm install
pnpm db:setup     # creates the database schema and seeds the catalogue
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The control panel is at **`/admin`** — it is not linked from the site.

Seeded staff accounts for local development (change the passwords, or set
`SEED_ADMIN_PASSWORD` / `SEED_COACH_PASSWORD` before seeding — and in production
create the first admin with `pnpm admin:invite` instead of seeding):

| Account | Email | Password |
|---|---|---|
| Admin | `admin@thefitmuslim.co` | `ChangeMe!2026` |
| Coach | `coach@thefitmuslim.co` | `ChangeMe!2026` |

### Sharing a live preview

Runs the production build on this machine and shares it through an
[ngrok](https://ngrok.com) tunnel — no hosting or database provisioning needed.

```bash
pnpm share        # build, serve on 127.0.0.1:3000, open the tunnel, print the link
pnpm share:stop   # stop the server and the tunnel
```

Re-running `pnpm share` after a code change rebuilds and restarts the server but
keeps the open tunnel, so the link stays the same. A new tunnel gets a new random
link unless `NGROK_DOMAIN` names a reserved domain. The database is seeded only
when it is empty, so set `SEED_ADMIN_PASSWORD` / `SEED_COACH_PASSWORD` first if
the preview starts from scratch. Logs live in `.data/share/`. On ngrok's free plan
each visitor clicks through a one-time "Visit Site" notice.

### Database commands

```bash
pnpm db:push     # sync schema.ts to the database
pnpm db:seed     # (re)seed catalogue, journal and staff accounts — idempotent
pnpm db:studio   # browse the data
pnpm db:reset    # wipe and rebuild from scratch — the local file only
```

All four read `.env.local`, so with `TURSO_DATABASE_URL` set they act on the
deployed database instead of the local file. `db:reset` deletes the local file
before pushing, so it is a development command; it is not how you reset Turso.

### Staff commands

```bash
pnpm admin:invite <email> [admin|coach]   # issue a staff invitation link
```

## 🔑 Environment

Everything runs with **no configuration at all** — without Stripe keys the
checkout settles through a clearly-labelled test page so the whole purchase flow
stays walkable, and without a mail key every send is written to the `email_log`
table and printed to the console.

To go live, set (see `.env.example`):

```bash
TURSO_DATABASE_URL=libsql://...               # required in production
TURSO_AUTH_TOKEN=...
NEXT_PUBLIC_SITE_URL=https://yourdomain.com   # canonicals, sitemap, Stripe redirects
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...               # webhook → /api/stripe/webhook
RESEND_API_KEY=re_...                         # real email
MAIL_FROM="The Fit Muslim <hello@yourdomain.com>"
TAX_RATE_BPS=0                                # flat tax in basis points; leave 0 for Stripe Tax
```

`pnpm db:push` and `pnpm db:seed` read `.env.local` too, so the same commands
that set up the local file database also set up the deployed one.

Point the Stripe webhook at `/api/stripe/webhook` and subscribe to
`checkout.session.completed`. The test settlement page disables itself the moment
`STRIPE_SECRET_KEY` exists.

## ▲ Deploying to Vercel

The database is the only thing a serverless host changes about this app. Every
request there gets a read-only, throwaway filesystem, so the local `.data/tfm.db`
file cannot come along — but the engine can: Turso is SQLite over HTTP, so the
schema, the queries and the seed are all unchanged. `lib/db/index.ts` picks the
file when `TURSO_DATABASE_URL` is unset and Turso when it is set, and refuses to
start on Vercel with a file database rather than deploying an empty catalogue.

**Set the database up before the first deploy** — the build prerenders the shop
and the product pages from it.

```bash
turso db create the-fit-muslim          # or app.turso.tech
turso db show the-fit-muslim --url      # → TURSO_DATABASE_URL
turso db tokens create the-fit-muslim   # → TURSO_AUTH_TOKEN

# point the local commands at it, once
echo 'TURSO_DATABASE_URL=libsql://…' >> .env.local
echo 'TURSO_AUTH_TOKEN=…'            >> .env.local
SEED_ADMIN_PASSWORD='…' SEED_COACH_PASSWORD='…' pnpm db:setup
```

Then in the Vercel project, under Settings → Environment Variables, add
`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` and `NEXT_PUBLIC_SITE_URL` for every
environment (the build reads them too), and deploy. Nothing else is needed: the
build command, install command and output directory are all Next.js defaults.

Media lives in `public/` and is served from Vercel's CDN, but *which* image or
video a product shows is a database row — a deployment whose database was never
seeded has no catalogue and therefore no imagery.

## 📁 Structure

```
app/
  (site)/         storefront: home, shop, product, journal, plan,
                  prayer-times, checkout, orders, account, auth
  admin/          role-gated staff area
  api/            checkout + Stripe webhook
lib/
  db/             Drizzle schema, client, seed
  auth/           scrypt hashing, sessions, sign-in actions
  cart/           server-authoritative cart + actions
  plan/           the plan engine and intake actions
  prayer/         solar prayer times, Hijri calendar, locations, preferences
  admin/          staff actions
  orders.ts       order lifecycle · money.ts · markdown.ts · mail.ts
components/       storefront, account and admin UI
```

---

© 2026 The Fit Muslim. All rights reserved.
