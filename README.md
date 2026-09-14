# Soleil Garden

A Next.js 16 application for a Kigali garden event venue: public website, five-step event enquiries, database-backed availability, Supabase authentication, and a protected venue-management workspace.

**This repository contains the application, not a provisioned Supabase project.** No Supabase credentials were supplied. Eight real owner-supplied JPG originals were imported from `main`. The user subsequently selected their AI-enhanced versions from `design/ai-previews`; the site now uses optimized, explicitly labelled derivatives and retains the originals for comparison. Without Supabase, informational pages and the selected image collection remain usable, while enquiries/authentication fail closed. See [the current asset audit](docs/ASSET-QUALITY-AUDIT.md), and [official brand implementation](docs/BRAND-ASSETS.md). The provided logo is now installed across the shared branding and browser/app icons. There are no demo bookings, fabricated metrics, stock venue photographs, or pretend availability.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4; shadcn-style Button with Radix Slot/CVA and `components.json`
- React Hook Form, Zod, Sonner, Lucide
- Supabase PostgreSQL, Auth, Storage, SSR cookies
- Sharp + Next Image for optimized, responsive images
- Vitest, Testing Library, PostgreSQL via PGlite, Playwright
- Vercel-compatible Node runtime

## Run locally

Use Node.js 22 LTS and npm.

```sh
npm ci
cp .env.example .env.local
# Fill in your project configuration in .env.local (never commit it).
npm run dev
```

The application listens on `0.0.0.0:3000`. Preview hosts under `*.e2b.app` and local loopback are allowed for development. Browser mutations use relative API URLs. A separate anonymous Supabase Realtime connection listens only for safe availability revision changes.

## Connect Supabase

1. Create a Supabase project (use a separate staging project for testing).
2. Apply the SQL files in **`supabase/migrations/` in timestamp order** in Supabase SQL Editor. Run the initial migration once against a new project; existing installations should apply only the new photo migration. It creates tables, constraints, functions, RLS policies, Storage policies, the `venue` bucket, all eleven requested services, and the supplied public business details. The second migration seeds the eight owner-supplied originals and service image assignments; the latest data-only migration updates their URLs in place to the user-selected enhanced derivatives. Neither migration inserts bookings, availability, prices, amenities, capacity or testimonials.
3. Set the environment variables below.
4. Create a user in **Supabase → Authentication → Users**. Confirm the staff email through your administrative workflow. Do not add an admin registration form to the public site.
5. Copy that user's UUID and run:

```sql
insert into public.admin_profiles (user_id, name, role)
values ('REPLACE_WITH_AUTH_USER_UUID', 'REPLACE_WITH_STAFF_NAME', 'admin');
```

Use `manager` for a staff account that can manage bookings, blocks, services and images but cannot change site settings. Profiles/roles can only be provisioned with privileged database access; users cannot promote themselves. Disable public Auth signups in the Supabase dashboard if not needed elsewhere.

6. Open `/admin/login`, sign in, then review the selected images under Gallery. AI-enhanced derivatives are labelled on the site; replace them with high-resolution authentic originals when available. Use descriptive image titles. Set order `0` for your strongest hero image. The first active gallery image is used as the home hero. Add wedding-category photos for the wedding page, and select/upload images for each service.

### Environment variables

| Variable                        | Purpose                                                | Browser-safe? |
| ------------------------------- | ------------------------------------------------------ | ------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your HTTPS Supabase project URL                        | Yes           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project anon/publishable key; protected by RLS         | Yes           |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only enquiry RPC execution                      | **No**        |
| `RATE_LIMIT_SALT`               | Random secret used to hash enquiry source IPs          | **No**        |
| `NEXT_PUBLIC_SITE_URL`          | Canonical HTTPS website origin, without trailing slash | Yes           |

Generate a rate-limit salt with `openssl rand -hex 32`. Set secrets in Vercel or a local ignored environment file, never in source or chat. The server-only key is confined to `lib/supabase/server.ts`; admin operations use the signed-in user's session, not the service-role key.

For password recovery, use Supabase's administrative recovery tooling and a properly configured recovery URL/email provider. There is no public signup or custom password storage.

## Public pages

`/`, `/events`, `/events/[slug]`, `/weddings`, `/gallery`, `/about`, `/contact`, `/reserve`.

Public event pages read **active database services**. Gallery is paginated (12/page) and category-filtered. Home fetches just four gallery images and shows a three-photo gallery preview. Social links appear only when configured. Structured data contains only supplied public business facts.

Enquiries proceed through event → date → details → contact → review → acknowledgement. A submitted enquiry receives a reference, **not** booking confirmation. WhatsApp is a separate conversation, not a reservation.

## Admin workspace

`/admin`, `/admin/bookings`, `/admin/bookings/new`, `/admin/bookings/[id]`, `/admin/calendar`, `/admin/blocked-dates`, `/admin/gallery`, `/admin/services`, `/admin/settings`.

- Database-derived metrics; upcoming and recent event lists
- Search and paginated status-filtered bookings
- Booking details, edit, approval/rejection/cancellation, private notes
- Manually create pending or approved bookings
- Month/week calendar with click-through details and block controls
- Date blocking with reasons; explicit unblock confirmation
- Gallery upload, title/category/order, activation and deletion
- Services: create/edit, URL slug, description, image, activation
- Admin-only business settings and social links
- Session refresh, protected layouts/API, logout, error/empty/loading states

Status changes do **not** automatically send SMS/email/WhatsApp messages. The interface explicitly asks staff to contact customers directly. No notification provider was requested or configured.

## Availability and security model

See [architecture](docs/ARCHITECTURE.md) for database invariants and trust boundaries.

- Tomorrow is recalculated in `Africa/Kigali` in browser, server and PostgreSQL. Today/past dates cannot be submitted or approved.
- A date is unavailable only if approved or admin-blocked. Pending enquiries do not hold a date.
- Public availability RPC returns **dates only**, never customer details or block reasons.
- A shared PostgreSQL transaction advisory lock serializes calendar-changing writes. The partial unique index on approved dates is a second defence against duplicate confirmations.
- Every new enquiry and booking, moved booking, newly approved booking and new block is checked by a database trigger, including direct authenticated database writes.
- Random idempotency keys and a unique database constraint make enquiry retries return the same reference.
- A PostgreSQL sequence creates concurrency-safe `SG-YYYYMMDD-001` references; numbering is global, not reset daily, and may have gaps.
- Public users have no access to customer bookings, admin notes, profiles or date-block reasons.
- Same-origin checks protect mutations; server schemas validate input. Staff authorization is checked in layouts and API handlers, with RLS underneath.
- Server-managed auth cookies are HttpOnly, SameSite=Lax, and Secure in production.

## Images

Uploads are limited to **4 MB**, below Vercel's request-body ceiling including multipart overhead. JPEG/PNG/WebP files are decoded with Sharp, oriented, bounded to 2,000 pixels, stripped of metadata by re-encoding, and stored as WebP. Images over 40 million decoded pixels are rejected. SVG uploads are not allowed.

Deleting a gallery entry unpublishes it; the underlying Storage object is retained to avoid breaking service image references. After checking references in both `gallery` and `services`, an administrator can remove orphan objects in Supabase Storage. See the operations guide. Public Storage images are not a place for private customer files. Supplied repository photographs can also be selected in the editors. See [photograph provenance and setup](docs/PHOTOGRAPHS.md).

## Quality checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm audit
npx playwright install --with-deps chromium
npm run test:e2e
```

- Vitest runs date/schema tests, calendar interaction tests, full wizard submission/retry tests, HTTP-origin/body-limit tests, and the **actual SQL migration** in an isolated PGlite PostgreSQL engine.
- SQL tests exercise RLS using `anon`/`authenticated` roles, approvals, blocks, unblocks, cancellations, references, idempotency and rate limits. Supabase-owned auth/storage bootstrap schemas are test fixtures. PGlite is **test-only** and is not an application backend.
- Playwright covers public routes, mobile layout/navigation, WhatsApp/call links, protected admin redirects, origin protection and server validation. The desktop copy of the mobile-only menu test is intentionally skipped.
- A live Supabase project is still required for Auth/Storage end-to-end acceptance and genuine multi-connection race testing. **Local checks do not certify the configuration of an unconnected external project.** Use [the launch checklist](docs/LAUNCH-CHECKLIST.md) before accepting real enquiries.

Optional Playwright variables: `E2E_BASE_URL` targets an already running application; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` selects a system Chromium executable when browser downloads are restricted.

## Deploy to Vercel

1. Import this repository using the Next.js preset and Node 22.x.
2. Set all five environment variables for the intended environment. Use a different Supabase project for preview/staging.
3. Apply the migration **before** routing real traffic to the site.
4. Set Supabase Auth Site URL and allowed redirect URLs to your canonical domain. Configure Auth rate limits, password policy and email delivery in the Supabase dashboard.
5. Confirm `availability_revision` is in the `supabase_realtime` publication (the migration adds it on hosted Supabase). Do not publish customer booking tables to anonymous clients.
6. Deploy (`npm run build`). No custom Vercel routing configuration is required.
7. Confirm the canonical domain, production image URLs, login, a full test enquiry and the launch checklist. Remove your test records before opening to customers.
8. Enable backups, monitoring and an edge rate-limit/WAF rule for `/api/enquiries` and `/api/auth/login`.

`X-Frame-Options: DENY` is enabled on Vercel production deployments; embedded development previews intentionally permit framing. Other security headers apply in both environments. Do not publish a production build with an example canonical URL or missing Supabase settings.

## Project layout

```text
app/(public)/       Public server-rendered pages
app/admin/          Login + separately protected admin layout/pages
app/api/            Availability, enquiries, auth, authorized admin mutations
components/         Forms, calendars, public and admin UI
components/ui/      shadcn-compatible UI primitive(s)
lib/                Validation, Kigali date rules, data access, auth helpers
proxy.ts            Supabase session refresh + first admin route guard
supabase/migrations Database schema, functions, policies and business seed
public/             Owner-supplied JPG photographs and illustration fallback
 tests/             Unit, PostgreSQL and browser tests
 docs/              Architecture, operations and deployment acceptance
```

No live Supabase credentials, real admin accounts or customer booking records are included. The original JPGs are owner-supplied; the currently selected enhanced images are AI-generated derivatives, not new documentary photographs.
