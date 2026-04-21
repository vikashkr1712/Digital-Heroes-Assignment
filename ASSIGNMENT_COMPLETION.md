# Assignment Completion Notes

## Requirement Source Validation

The implementation was built from the extracted text in `PRD_Full_Stack_Training.pdf` and manually cross-checked against the provided screenshots.

## Delivery Checklist

- [x] Subscription-driven platform architecture
- [x] Monthly/yearly Stripe checkout + webhook activation + payment record model
- [x] Stableford score logic with strict constraints
- [x] Draw eligibility rule enforced (minimum 5 scores)
- [x] Draw simulation and publication workflows
- [x] Prize tier split and jackpot rollover behavior
- [x] Charity selection and independent donation flow
- [x] Charity search/filter and charity profile pages
- [x] Winner verification and payout lifecycle
- [x] User dashboard with all mandatory modules
- [x] Admin dashboard with full charity CRUD and score moderation
- [x] Full winners listing in admin (not just pending queue)
- [x] SMTP email notifications for notification events
- [x] Responsive modern UI (emotion-driven, non-traditional golf aesthetics)
- [x] Reporting and analytics endpoints
- [x] Seed data and test credentials
- [x] Unit tests for draw logic helpers

## Important Paths

- App entry: `src/app/page.tsx`
- User dashboard: `src/app/dashboard/page.tsx`
- Admin dashboard: `src/app/admin/page.tsx`
- Stripe webhook: `src/app/api/stripe/webhook/route.ts`
- Prisma schema: `prisma/schema.prisma`
- Seed script: `prisma/seed.ts`
- Draw logic service: `src/lib/services/draw-service.ts`
- API routes: `src/app/api/**`

## Manual QA Scenarios

1. Signup -> login -> click subscription checkout and complete Stripe flow.
2. Confirm webhook activates subscription and dashboard status updates.
3. Add 6 scores and verify oldest is removed (latest 5 retained).
4. Try duplicate score date and verify rejection.
5. Verify user with fewer than 5 scores is shown as not draw-eligible.
6. Run admin draw simulation then publish.
7. Verify winner appears in user dashboard when matched.
8. Submit proof as winner and approve/reject in admin panel.
9. Mark payout as completed and verify status change.
10. Save charity preferences and make an independent donation.
11. Manage charity via admin edit/feature/disable/delete actions.
12. Edit/delete scores from admin score moderation module.
13. Verify reports update: users, pools, charity totals, pending verifications.

## Submission Form Draft (Copy/Paste)

Live Website URL (Vercel)
PENDING_DEPLOYMENT_URL

User Dashboard URL (e.g. .vercel.app/dashboard)
PENDING_DEPLOYMENT_URL/dashboard

GitHub Source Code Repository URL (e.g. https://github.com/abc/Project-topic)
PENDING_GITHUB_REPOSITORY_URL

Admin Panel URL (e.g. https://project-name.vercel.app/admin)
PENDING_DEPLOYMENT_URL/admin

Admin Panel (Email)
admin@digitalheroes.dev

Admin Panel (Password)
Admin@12345

Please share links to your previous projects or portfolio work.
ADD_YOUR_PORTFOLIO_LINKS_HERE

Why do you think you are the right fit for this role?
I am a strong fit for this role because I can independently take a product requirement document from idea to working production-ready implementation. In this assignment, I delivered complete full-stack architecture, secure authentication, subscription and payment workflows, draw and reward logic, charity integration, winner verification, admin operations, responsive UI, and validation through lint, tests, and build checks. I also focused on clean modular code and clear documentation so the project is maintainable and easy to extend.

Is there anything extra you would like us to know about yourself?
I care about both speed and quality. I can move fast, but I also validate edge cases, keep code organized, and communicate progress clearly. I am comfortable owning features end to end, including backend, frontend, data modeling, testing, and deployment support.

Notes for final submit:
1. Replace PENDING_GITHUB_REPOSITORY_URL after code push.
2. Replace PENDING_DEPLOYMENT_URL after Vercel deployment.
3. Keep /dashboard and /admin route suffixes as shown above.
