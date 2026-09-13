# Asset quality and branding audit — 13 September 2026

## Scope and truthful source classification

This is an update to the existing application, not a rebuild. The user directed the replacement work to `design/ai-previews`. Those eight files are the previously generated AI-enhanced reconstructions of the supplied 163-pixel-wide photographs; they are **not new, unaltered high-resolution venue photography**. No new venue images were generated for this update.

The selected images now have optimized WebP derivatives in `public/images/soleil/enhanced/`. Every rendering of a known derivative carries an **AI-enhanced image** label and descriptive alt text. The gallery viewer explains the limitation and links to the original source. Genuine custom Supabase uploads are not incorrectly labelled AI-generated.

## Asset inventory

| Old active asset | Replacement                                 | Dimensions  | WebP size, approx. |
| ---------------- | ------------------------------------------- | ----------- | ------------------ |
| `venue-7.jpg`    | `enhanced/garden-marquee.webp`              | 1214 × 864  | 238 KB             |
| `venue-12.jpg`   | `enhanced/wedding-walkway.webp`             | 848 × 1264  | 206 KB             |
| `venue-4.jpg`    | `enhanced/canopy-reception.webp`            | 1214 × 864  | 170 KB             |
| `venue-8.jpg`    | `enhanced/floral-celebration-backdrop.webp` | 1214 × 864  | 205 KB             |
| `venue-6.jpg`    | `enhanced/table-settings.webp`              | 1024 × 1024 | 90 KB              |
| `venue-5.jpg`    | `enhanced/marquee-at-night.webp`            | 1214 × 864  | 178 KB             |
| `venue-9.jpg`    | `enhanced/evening-garden.webp`              | 1214 × 864  | 118 KB             |
| `venue-10.jpg`   | `enhanced/venue-entrance.webp`              | 1214 × 864  | 249 KB             |

All paths above are relative to `public/images/soleil/`. Derivatives retain their source dimensions and aspect ratios; there is no enlargement, AI generation or additional invented detail in this processing step. The original 2–3 MB PNGs are not downloaded by website visitors. Next Image negotiates AVIF/WebP and responsive sizes.

## Rendering and cropping changes

- `components/venue-image.tsx` is the common venue-image rendering boundary, including public pages and admin previews.
- It maps old bundled database URLs to the selected derivatives without touching unrelated Storage URLs.
- The default hero is the wide garden/marquee view, rather than forcing a low-resolution portrait into a wide frame. Staff-chosen ordering remains supported.
- Images use `contain` in fixed-ratio frames. Letterboxing intentionally preserves the whole scene, rather than cutting off arches, seating, tent peaks or people.
- Gallery cards use a consistent frame; the full image is available in a keyboard-accessible viewer.
- Wedding panels, About, service details and admin previews preserve aspect ratio. Breakpoint-specific frame sizing avoids mobile overflow.
- Only the principal above-the-fold venue image is preloaded on Home; gallery content is lazy loaded.
- The existing cream/green palette receives a restrained gold accent. Navigation labels and footer quick links now follow the requested structure.

## Old assets and database safety

Original JPGs remain unchanged for provenance and compatibility. They are not used as displayed images in active components. Their paths remain only in the compatibility/provenance mapping, historical migrations, tests and explicit source-comparison links. Deleting them would break those references and remove the authentic originals.

Apply `supabase/migrations/202609130001_selected_image_replacements.sql` after the existing migrations. It updates matching URLs **in place** in `gallery` and `services`; it does not insert duplicates, delete records or Storage objects, change IDs, or alter relationships. Active flags, categories, titles and custom uploads are preserved. Only the two untouched seeded hero positions are swapped to prefer the wide image. Running it again is a no-op.

The runtime compatibility mapper also upgrades known legacy URLs before this migration is deployed. It does not substitute bundled content for an empty active gallery from a configured database.

## Backend preservation

There are no changes to booking routes, approval logic, availability RPCs, date guards, reference generation, idempotency, RLS policies, authentication/session handling, staff authorization, or the five-step enquiry flow. The only validation change concerns approved image paths and normalizes legacy image values when staff save a form.

A PostgreSQL test compares booking rows and date blocks before/after the new migration, verifies IDs and record counts are unchanged, checks preservation of staff choices/custom uploads, and reruns the migration to verify idempotency.

## Preview inspection and checks

A production preview was checked at **1440 px desktop, 820 px tablet and 390 px mobile**. Screenshots were captured after streamed content and visible images loaded, then inspected for layout/cropping issues. The automated checks verify image loading, optimized URLs, provenance, aspect-ratio-preserving styles, no active thumbnail display URLs, navigation, no horizontal overflow, and image optimizer responses.

| Page(s)                                                                                                                        | Verification / limitation                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                                                                            | Wide enhanced hero, wedding panel and gallery preview inspected at all three sizes                                                                                               |
| `/weddings`, `/gallery`, `/about`                                                                                              | Loaded images, whole-scene framing, labels and gallery viewer inspected                                                                                                          |
| `/events`                                                                                                                      | Rendered current unconfigured-database state; no fabricated service records added                                                                                                |
| `/contact`, `/reserve`                                                                                                         | Layout and existing safe unavailable state inspected; contact links retained                                                                                                     |
| `/admin/login`                                                                                                                 | Desktop/tablet image, mobile layout and existing unconfigured sign-in state inspected                                                                                            |
| `/events/[slug]`                                                                                                               | Image code audited and typechecked; requires active service data for a live page                                                                                                 |
| `/admin`, `/admin/bookings`, `/admin/calendar`, `/admin/blocked-dates`, `/admin/gallery`, `/admin/services`, `/admin/settings` | Protected redirects tested; authenticated contents require a configured Supabase project and staff session. Admin gallery/service image rendering uses the same tested boundary. |

No Supabase environment is connected in this workspace. Hosted Auth/Storage and authenticated admin workflows therefore cannot be certified from this preview. Do not interpret redirect tests or local PostgreSQL tests as completed live-project acceptance.

## Unfinished: official logo and authentic high-resolution originals

The logo was visible in the user's message, but the indicated attachment file was not accessible in the workspace. A search of the latest repository and `design/ai-previews` found no cleaned logo PNG/SVG. The existing shared wordmark/icon has been retained rather than inventing or misrepresenting an official replacement. Official header/footer/admin-logo and favicon installation **remain pending**.

Add the cleaned transparent PNG or SVG to the repository (for example, `public/brand/soleil-garden.png`) so it can be installed and visually verified. The selected AI derivatives improve sharpness but do not satisfy an assertion that all images are unaltered genuine high-resolution venue photographs. Supply original high-resolution photographs if that remains the required final standard.

## Repeatable checks

```sh
npm run images:prepare  # Re-create the eight WebP derivatives from the selected PNGs
npm run images:audit    # Inventory dimensions/sizes and enforce the rendering boundary
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e        # Desktop, tablet and mobile
```
