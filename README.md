# Digital Heroes Full-Stack Assignment

This repository is a complete implementation of the provided PRD for the trainee selection assignment.

The platform includes:

- Authentication (JWT cookie session)
- Real Stripe checkout + webhook-driven subscription activation (monthly/yearly)
- Stableford score management with strict 5-score rolling logic
- Monthly draw engine (random + algorithmic modes)
- Prize pool splitting with jackpot rollover
- Charity selection and independent donations
- Winner proof verification and payout lifecycle
- SMTP-backed email notifications for system/draw/winner alerts
- User dashboard and admin dashboard
- Reporting and analytics snapshots

## 1) Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma ORM
- SQLite for local development
- Stripe Checkout + Webhooks
- Nodemailer (SMTP notifications)
- JWT auth (`jose`) + password hashing (`bcryptjs`)

## 2) Local Setup (Step-by-Step)

1. Install dependencies

```bash
npm install
```

2. Generate Prisma client

```bash
npm run prisma:generate
```

3. Run first migration

```bash
npx prisma migrate dev --name init
```

4. Seed sample users/data

```bash
npm run db:seed
```

5. Start development server

```bash
npm run dev
```

6. Open app

```text
http://localhost:3000
```

## 3) Seed Credentials

- Admin: `admin@digitalheroes.dev` / `Admin@12345`
- Subscriber: `user@digitalheroes.dev` / `Player@12345`

## 4) Core Routes

### Public Pages

- `/` homepage
- `/charities` charity directory
- `/charities/[slug]` charity profile page
- `/login`
- `/signup`
- `/subscription/success`
- `/subscription/cancel`

### Protected Pages

- `/dashboard` user panel
- `/admin` admin panel

### API Endpoints

- Auth: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/me`
- User data: `/api/dashboard`
- Subscriptions: `/api/subscription`
- Scores: `/api/scores`
- Charities: `/api/charities`, `/api/charities/preferences`
- Donations: `/api/donations`
- Winners: `/api/winners/proof`
- Draw history: `/api/draws`
- Stripe webhook: `/api/stripe/webhook`
- Admin: `/api/admin/overview`, `/api/admin/draws`, `/api/admin/winners`, `/api/admin/users`, `/api/admin/subscriptions`, `/api/admin/charities`, `/api/admin/scores`, `/api/admin/reports`

## 5) PRD Coverage Matrix

1. User Roles
- Public visitor, subscriber, and administrator roles are implemented.

2. Subscription and Payment
- Monthly/yearly plans, Stripe checkout, webhook activation, lifecycle status, and payment records are implemented.
- Access checks enforce subscriber-only score and draw participation actions.

3. Score Management
- Valid range 1-45 enforced.
- One score per date enforced.
- Latest 5 scores retained automatically.
- Scores shown in reverse chronological order.

4. Draw and Reward System
- 5-number draws.
- Random and algorithmic generation options.
- Simulation mode and publish mode implemented.
- Monthly-key-based draw cadence and publish protection.
- Draw participation now strictly enforces minimum 5 stored scores per active subscriber.

5. Prize Pool Logic
- Pool contribution from active subscriptions implemented.
- Tier shares: 40% (5-match), 35% (4-match), 25% (3-match).
- Equal split among winners in each tier.
- 5-match rollover applied when no 5-match winner exists.

6. Charity System
- Charity selection and contribution percentage at signup/preferences.
- Minimum 10% contribution enforced.
- Independent donation flow implemented.
- Search/filter charity directory with dedicated profile pages.
- Featured flags plus full admin create/edit/delete/toggle controls.

7. Winner Verification
- Winner proof submission endpoint.
- Admin approve/reject/mark-paid workflow.
- Pending to paid payout tracking.

8. User Dashboard
- Subscription status, score management, charity preferences, participation summary, and winnings overview are all present.

9. Admin Dashboard
- User and subscription management controls.
- Draw simulation/publish controls.
- Charity create/edit/delete and featured/active toggles.
- Score moderation (edit/delete) controls.
- Winner review and payout controls.
- Full winner history listing beyond review queue.
- Aggregated reports and analytics.

10. Technical Requirements
- Responsive mobile-first UI.
- JWT session auth.
- API-level validation and edge-case handling.
- Notification records for system events.
- SMTP email dispatch for all notification events (when SMTP vars are configured).

## 6) Test and Validation

Run lint:

```bash
npm run lint
```

Run unit tests:

```bash
npm run test
```

## 7) Deploying to Vercel + Supabase (Production Path)

This project runs on SQLite locally. For Supabase production:

1. Create new Supabase project.
2. Change `datasource db` provider in `prisma/schema.prisma` from `sqlite` to `postgresql`.
3. Set `DATABASE_URL` to your Supabase Postgres connection string.
4. Run migrations against Supabase:

```bash
npx prisma migrate deploy
```

5. Set Vercel environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `APP_BASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY_ID` (optional if you use inline recurring prices)
- `STRIPE_PRICE_YEARLY_ID` (optional if you use inline recurring prices)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

6. Deploy project to a new Vercel account as required by PRD constraints.

## 8) Notes

- Stripe checkout is implemented in `/api/subscription` and subscription activation is finalized in `/api/stripe/webhook`.
- Payment-to-subscription activation is idempotent by payment reference to avoid duplicate webhook side effects.
- Email sends are enabled only when SMTP variables are configured; in-app notifications are always stored.
# Digital-Heroes-Assignment
