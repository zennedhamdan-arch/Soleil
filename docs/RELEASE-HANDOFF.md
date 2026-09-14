# Soleil Garden — release handoff

## Finished in the application

- Public venue pages, five-step enquiries, Kigali-local availability rules and protected admin workspace are implemented.
- Selected enhanced venue images are optimized and labelled; authentic original source photographs are retained.
- The official supplied gold logo is installed in the shared public/admin branding, favicon and app icons.
- Desktop, tablet and mobile branding/image layouts have been visually reviewed.
- Local verification passed: **59 automated tests, 76 browser checks**, lint, typecheck, image audit and production build. Two non-mobile copies of the mobile-menu test are intentionally skipped.
- GitHub Actions completed successfully for the verified application commit `7a9489f`.
- Vercel reported a successful Preview deployment for that commit. Its hosted URL requires Vercel login, so it was not used as evidence of working hosted bookings.

## Release workflow

The session branch is `arena/01a09680-soleil`. Its history was reconciled with the current `main` so GitHub can compare/merge the release normally. That reconciliation did **not** modify the verified application tree, delete assets or rewrite `main`.

1. Review and merge the release pull request into `main` when ready to publish. Production currently follows `main`; pushing the session branch creates a Preview, not a production promotion.
2. Confirm the resulting Vercel production deployment succeeds.
3. Check the production environment values in **Vercel → Project → Settings → Environment Variables**. Do not share secret values in chat or commit them:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — server-only
   - `RATE_LIMIT_SALT` — server-only
   - `NEXT_PUBLIC_SITE_URL` — actual canonical HTTPS domain
4. Apply only unapplied SQL migrations, in filename order, through your Supabase deployment process. The logo release itself requires **no new database migration**.
5. Confirm a Supabase Auth account has an authorized `admin_profiles` entry. Perform a real enquiry, approval, date block/unblock and admin login/logout test on the connected environment. Complete `docs/LAUNCH-CHECKLIST.md` before accepting customer enquiries.

## What has not been verified

No Supabase configuration is present in this workspace. The Vercel project's environment values have not been inspected, and the hosted deployment requires authentication. This does **not** prove that Vercel lacks configuration; it means hosted Auth, Storage, migrations and live booking acceptance remain unverified here.

No credentials were fabricated, no booking data was mocked, and no production promotion was performed automatically. The local public preview remains safely unavailable for online enquiries when its database configuration is absent.
