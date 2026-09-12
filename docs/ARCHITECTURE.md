# Architecture and invariants

## Requests

**Read public pages** → Next Server Components → Supabase anon/session client → RLS-filtered active services/gallery + public business fields.

**Read calendar** → `GET /api/availability` → bounded date range validation → `availability(start_date,end_date)` security-definer RPC → list of unavailable dates + dynamic Kigali tomorrow. No customer records are returned. Responses are `no-store`. Open calendars subscribe anonymously to a public, RLS-protected `availability_revision` table that contains only an integer revision. Booking/block triggers increment it on commit, prompting an immediate calendar refetch. Calendars also refresh on focus and every minute as a reconnect fallback; every mutation revalidates against the database, so the polling interval cannot cause a double confirmation.

**Send enquiry** → same-origin + 20 KB streamed body limit → Zod server schema → IP hash → server-only service client → `submit_enquiry` RPC. RPC access is revoked from anon/authenticated. The function checks idempotency, shared calendar lock, rate window, active service, and performs a pending insert. The table trigger independently checks date/availability. Only a reference number is returned.

**Admin operation** → same-origin → verified `auth.getUser()` → matching `admin_profiles` → discriminated Zod operation schema → authenticated Supabase client → table RLS → calendar trigger where relevant. Settings additionally require `admin` in both the handler and policy. Every admin page rechecks the session; hiding a sidebar item is not authorization.

## Calendar consistency

The venue books an entire calendar date; there are no sessions, payments or capacity guarantees. Event dates are SQL `date`, not timestamp conversions from the customer's timezone. Event creation and approval must be strictly later than `(now() at time zone 'Africa/Kigali')::date`.

`guard_calendar` takes transaction advisory lock `73645192` on both booking and block writes. It executes for insert/update/delete, so moving a booking, approving an enquiry, blocking a date or removing a block cannot bypass the serialized write path. A single global lock is intentionally simple for a single venue; transactions are short. Revisit lock granularity before scaling to multiple venues or high write volumes.

A unique partial index enforces at most one approved booking per date. Pending enquiries can share a date. Approving the first makes the others unapprovable until the date is freed. Rejecting/cancelling an approved booking releases it; any separate block would remain in force. Blocks cannot be created on already approved dates. Blocking a date with pending enquiries leaves the enquiries intact for staff follow-up.

Historical record notes and rejection/cancellation remain editable. Moving a historical booking or approving one requires a future date; the full booking editor applies the same future-date schema. Use the separate notes/status actions to annotate or cancel history without changing the original date.

## Reference numbers and retries

`new_booking_reference()` uses a PostgreSQL sequence. The prefix uses the date the enquiry was created in Kigali, not its event date. Padding is minimum three digits and never truncates larger sequence values. Sequences may have gaps after rollbacks. The unique reference constraint remains authoritative.

The public form generates a cryptographically random UUID on the first submit and reuses it during retries. `idempotency_key` is unique. Replaying a known key returns the original reference only, not customer data. Retrying after a successfully processed but lost response does not create another booking. Reloading the page starts a fresh enquiry; no personal form data is written to localStorage.

## Roles

| Capability                           | Anonymous | Signed in, no profile | Manager | Admin                      |
| ------------------------------------ | --------- | --------------------- | ------- | -------------------------- |
| Active services/gallery              | Yes       | Yes                   | All     | All                        |
| Public business details              | Yes       | Yes                   | Yes     | Yes                        |
| Date-only availability               | Yes       | Yes                   | Yes     | Yes                        |
| Submit via validated server endpoint | Yes       | Yes                   | Yes     | Yes                        |
| Customer booking records             | No        | No                    | Yes     | Yes                        |
| Blocks/reasons                       | No        | No                    | Yes     | Yes                        |
| Edit services/gallery                | No        | No                    | Yes     | Yes                        |
| Edit site settings                   | No        | No                    | No      | Yes                        |
| Create/change staff roles            | No        | No                    | No      | No (DB administrator only) |

`site_settings` contains **public-facing business contact content only**. It is not an admin-secret store. Secrets belong in environment variables. Settings editing is not public.

## Abuse boundaries

The database limiter allows eight successful new enquiries per source hash per rolling fixed one-hour window. Hash input uses a server secret and the reverse proxy's client IP. Failed transactions roll back rate increments; do not mistake this application limiter for a DDoS firewall. Configure Vercel Firewall rate rules and optionally Supabase Auth CAPTCHA for a public launch. On non-Vercel infrastructure, ensure the ingress overwrites forwarded headers rather than trusting arbitrary client values.

Mutation origin checks use the incoming/forwarded host, not Next's internal loopback URL, to work behind trusted Vercel and preview proxies. No permissive CORS is emitted. Session cookies are server-only; the browser Supabase client is anonymous and used only for the availability revision subscription. If adding authenticated browser functionality, review cookie and session architecture rather than simply relaxing HttpOnly.

## Storage lifecycle

All uploads go through a staff-authorized Node route, decoded/optimized by Sharp, then into a public bucket using the staff session and Storage RLS. Next Image fetches only from the configured Supabase hostname. Gallery deletion is a logical content removal, not immediate physical object deletion, since services may reuse a URL. Storage cleanup is an explicit privileged maintenance task.

## Intentional limits

- No automatic customer email/SMS delivery. Staff follow up manually.
- No payment, pricing, package, capacity or amenity claims.
- Realtime publishes only availability revisions, not bookings. Polling recovers missed events; server/database rechecks are always authoritative.
- Admin calendar caps a month at 1,000 pending/approved records and shows a warning at the limit. Use paginated Bookings for additional records.
- Upcoming Blocks lists 366 entries; calendar navigates all dates.
- There is no user-facing staff provisioning/password reset UI; Supabase administration handles it.
- Genuine concurrency across multiple PostgreSQL connections and hosted Auth/Storage require staging validation beyond the embedded SQL test engine.
