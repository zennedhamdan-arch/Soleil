# Official Soleil Garden brand assets

## Source

The owner confirmed `public/images/soleil/soleil-garden.png` as the official logo. It was copied byte-for-byte from `origin/main` (commit `6fbfadb`). The transparent 1254 × 1254 PNG is preserved, not redrawn, recoloured, thresholded or AI-generated.

- Git blob: `f83d31d51d03ea6ccbd1496d681e187dce8e5eb8`
- SHA-256: `4674da0bb7693f74ad189021ba4a83bd8f083b94f1cd4376fa268a1fe335fc98`

The file composites cleanly on the website's ivory and green backgrounds. Coloured pixels visible in some raw transparency previews are not rendered as visible coloured speckles in the normal composited logo; the alpha channel is retained as supplied.

## Website implementation

`components/brand.tsx` now uses the official gold SG monogram, circular outline and leaf detail alongside the existing readable Soleil Garden wordmark. This shared component appears in:

- Desktop/tablet header and mobile navigation header
- Public footer
- Admin login
- Admin sidebar and its mobile drawer

The site serves `public/brand/soleil-garden-logo.png`, a **lossless 256 × 256 transparent derivative**, approximately 47 KB. Its decoded pixels are tested against a direct downsample of the official source. It is displayed at 52 px on desktop, 46 px in the mobile header and 44 px in the admin sidebar. Explicit width/height and `object-fit: contain` prevent distortion and layout shifts.

The small logo uses Next Image with `unoptimized` intentionally: the asset is already resized and losslessly compressed, so passing it through the venue-photo AVIF/WebP pipeline would introduce unnecessary lossy compression to fine gold edges and transparency. All placements reuse the same browser-cached URL. The full-resolution source is not downloaded by normal page branding.

The official logo is **not** AI-generated and does not go through the venue image disclosure component. The selected AI-enhanced venue photographs keep their existing provenance labels.

## Icons

- `app/favicon.ico`: lossless 16, 32, 48 and 64 px frames
- `app/apple-icon.png`: 180 px Apple touch icon
- `app/icon.png`: 512 px Next metadata icon
- `public/brand/icon-192.png`, `public/brand/icon-512.png`: web manifest icons
- `app/manifest.ts`: name, colours and app icon declarations

Icon variants are resized from the same official artwork, with safe padding over deep green. No invented simplified monogram or third-party icon is substituted. Next's file-based metadata publishes the favicon and Apple links; the root metadata references `/manifest.webmanifest`.

## Regeneration and checks

```sh
npm run brand:prepare
npm run images:audit
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The brand preparation script preserves the original file and deterministically recreates only its derivatives/icons. The image audit recognizes the explicit brand paths and required sizes separately from venue-photograph resolution thresholds.

Automated tests cover source-file identity, transparent lossless downsampling, shared component markup, icon sizes, ICO structure, public rendering, header/footer sizing, the mobile menu, admin login, narrow admin-drawer layout, and icon/manifest HTTP responses. Desktop, tablet and mobile branding were also visually reviewed on the production preview, including gold on ivory and deep green.

No booking/authentication/database code, migrations, business data, image selection or Supabase configuration is changed by this logo integration. Authenticated admin data still requires a configured project; the drawer sizing check uses an isolated DOM layout fixture, not an authentication bypass.
