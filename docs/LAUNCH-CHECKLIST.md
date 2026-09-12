# Launch checklist and operations

## Verified locally during implementation

- [x] Next.js production build
- [x] TypeScript strict typecheck and ESLint
- [x] Kigali today/yesterday/past/tomorrow/future, midnight, month/year and leap-day rules
- [x] Frontend calendar disabled/loading/failure behavior
- [x] Required-field validation, review, enquiry acknowledgement and retry key reuse
- [x] SQL migration executes in PostgreSQL (PGlite with Supabase bootstrap fixtures)
- [x] SQL approvals, competing pending enquiries, blocks, duplicate blocks, unblocks
- [x] SQL cancellation/rejection release dates
- [x] Idempotent reference generation, growth beyond one million sequence values
- [x] SQL RLS isolation for anonymous, non-staff, manager and admin roles
- [x] Origin rejection, trusted-proxy origin matching, body size restrictions
- [x] Desktop/mobile public route rendering, no horizontal overflow, mobile menu
- [x] Call and WhatsApp targets; protected admin route redirects
- [x] Dependency audit without known vulnerabilities at implementation time

**These do not replace live hosted-project acceptance.** There was no Supabase project configuration or real photography in the supplied checkout.

## Required before receiving real enquiries

- [ ] Configure a separate staging Supabase project and apply migration.
- [ ] Confirm RLS is enabled and RPC grants match the migration in the hosted project.
- [ ] Provision an admin and a manager account; disable unneeded public signups.
- [ ] Verify correct/incorrect login, persistence across reloads, refresh expiry and logout.
- [ ] Confirm a non-staff authenticated user cannot access any admin page or mutation.
- [ ] Submit a real end-to-end staging enquiry. Check pending row, reference and acknowledgement.
- [ ] Retry the same request key, including after a simulated lost response: exactly one row.
- [ ] Submit malformed fields and manually forged today/yesterday dates: rejected.
- [ ] Confirm Realtime is enabled for `availability_revision` only. Approve or block in another session and verify the open public calendar refreshes immediately. Also verify focus/poll fallback with Realtime disconnected.
- [ ] Submit two pending requests for the same date, then approve them simultaneously in two sessions: exactly one succeeds.
- [ ] Race an approval against a block in separate sessions: not both may succeed.
- [ ] Create an admin-approved booking on an occupied date: rejected.
- [ ] Reject/cancel, verify date becomes available unless a separate block applies.
- [ ] Block/unblock with a reason; verify public availability but no public reason disclosure.
- [ ] Dashboard counts and lists match SQL records, with zeroes (not fake data) when empty.
- [ ] Booking search, filters, pagination, details, edits and notes work.
- [ ] Month/week calendar and touch controls work on an actual phone.
- [ ] Upload an actual venue photo; validate orientation, compression and Next Image output.
- [ ] Reject oversize/invalid files and verify storage permissions prevent non-staff uploads.
- [ ] Gallery category/order/activation/deletion immediately affect public gallery on reload.
- [ ] Services create/edit/disable/image changes affect cards, event pages and enquiry choices.
- [ ] Settings changes affect public contact details and links; manager writes are denied.
- [ ] No service-role secret in rendered HTML, browser requests or client bundles.
- [ ] Test network failures and session expiry during mutations; no raw DB error leakage.
- [ ] Upload the real Soleil Garden photos; remove/replace illustration fallback naturally via gallery.
- [ ] Set canonical production URL, Auth URLs and all production environment values.
- [ ] Confirm only provided business facts are published; review content and image rights.
- [ ] Review business-specific privacy/retention obligations with an appropriate adviser.
- [ ] Configure backups, recovery procedures, monitoring, production WAF and Auth rate limits.
- [ ] Clear staging/test enquiries from production and complete a final venue-owner review.

## Maintenance

- Enable Supabase backups/PITR according to the project's plan and test restore to staging.
- Use Vercel and Supabase logs/alerts for failed API calls. Avoid logging submitted customer data.
- Regularly run `npm audit`, update dependencies and rerun tests/build.
- Rotate service-role credentials and the rate-limit salt if exposed. Redeploy after environment changes.
- Staff deprovisioning: remove `admin_profiles` access first, then disable/delete the Auth account and revoke sessions.
- Set a business-approved retention policy for enquiries and private notes; archive/delete only with authorization. Customer data is not stored in browser localStorage.
- Purge expired rate windows periodically using privileged SQL:

```sql
delete from public.request_limits where window_start < now() - interval '2 days';
```

- To remove an orphan Storage image, first ensure its full public URL is referenced by neither `services.image_url` nor `gallery.image_url`. Delete only confirmed orphans from the `venue` bucket. Draft uploads not subsequently saved can also be orphans. Never place customer documents in this public bucket.
- SQL migrations should be reviewed and tested against staging. Do not rerun the initial migration against an existing schema; add a new timestamped migration for changes.

## Troubleshooting

| Symptom                           | Check                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| Enquiries unavailable             | Project URL/key, migration, active services, server service-role key, rate-limit salt |
| Login unavailable                 | Public Supabase env, Auth account, matching `admin_profiles`, project Auth limits     |
| Signed in but no admin access     | Auth user UUID must match profile `user_id`; profile role must be valid               |
| Calendar cannot load              | RPC exists/grants, valid range, Supabase reachable; no fake availability fallback     |
| Date no longer available          | Another booking was approved or staff blocked the date; select another date           |
| Image upload fails                | File under 4 MB, supported format, <40M pixels, venue bucket/policies, staff session  |
| Image does not render             | URL uses configured Supabase host/public venue path; redeploy after URL changes       |
| Mutation rejected behind proxy    | Ingress must preserve/overwrite Host or X-Forwarded-Host correctly                    |
| Development menu fails to hydrate | Host must be in `allowedDevOrigins`; websocket/HMR must be permitted                  |
