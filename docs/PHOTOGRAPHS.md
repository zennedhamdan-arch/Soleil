# Owner-supplied originals and current image derivatives

**Current update:** The owner selected `design/ai-previews` for replacement imagery. The site now displays labelled, optimized AI-enhanced derivatives, while retaining all original JPGs below for provenance. See [the asset-quality audit](ASSET-QUALITY-AUDIT.md) and apply `202609130001_selected_image_replacements.sql` after the prior migrations. The official logo is now installed from `public/images/soleil/soleil-garden.png`; see [brand assets](BRAND-ASSETS.md).

The inventory below documents the original source import, not the dimensions of the current displayed derivatives.

Eight JPGs were fetched from `origin/main`, commit `9ef58ad`, and copied **byte-for-byte** into `public/images/soleil`. The original files on `main` were not moved, renamed, changed or deleted. All implementation work remains on `arena/01a09680-soleil`.

| Original on main   | Application asset | Dimensions | Visible subject                    |
| ------------------ | ----------------- | ---------- | ---------------------------------- |
| `unnamed (12).jpg` | `venue-12.jpg`    | 163 × 272  | Draped wedding walkway             |
| `unnamed (7).jpg`  | `venue-7.jpg`     | 163 × 116  | Garden and marquee by day          |
| `unnamed (4).jpg`  | `venue-4.jpg`     | 163 × 116  | Tables beneath the canopy          |
| `unnamed (8).jpg`  | `venue-8.jpg`     | 163 × 116  | Floral backdrop and woven chairs   |
| `unnamed (6).jpg`  | `venue-6.jpg`     | 163 × 163  | Table settings with orange accents |
| `unnamed (5).jpg`  | `venue-5.jpg`     | 163 × 116  | Marquee illuminated at night       |
| `unnamed (9).jpg`  | `venue-9.jpg`     | 163 × 116  | Lawn and marquee in the evening    |
| `unnamed (10).jpg` | `venue-10.jpg`    | 163 × 116  | Tiled entrance steps               |

These are thumbnail-size originals. The original JPG files themselves remain unchanged; the currently displayed derivatives are AI-reconstructed and clearly labelled. Higher-resolution originals (ideally at least 1,600 pixels wide, and a tall version of the wedding walkway) should replace them for best large-screen quality. Next Image still handles responsive delivery; CSS applies a restrained saturation treatment without modifying the source files.

## Where they appear

- Home: wedding walkway as the primary portrait, garden inset, wedding highlight and a three-photo gallery preview.
- Weddings and About: relevant active gallery images.
- Gallery: eight real photographs, category filters, descriptive captions and an accessible keyboard-enabled viewer.
- Admin sign-in: the supplied wedding walkway.
- Admin gallery/service editors: a selector for the supplied photos, in addition to the existing Storage upload flow.

## Database-backed management

Apply `supabase/migrations/202609120002_owner_photographs.sql` after the initial migration. It inserts the real photos into `gallery` and supplies images for seeded services that don't already have an image. It does not create bookings or availability, overwrite staff-selected images, or reactivate existing gallery entries when rerun.

With Supabase configured, the public site reads active gallery rows as before. Known legacy image URLs are resolved to labelled derivatives through the shared image component. Deactivating/deleting/reordering a gallery entry takes effect on the public site; bundled photos are **not** substituted over an empty result from a configured database. Without Supabase, only the supplied static photo collection is displayed; bookings and availability still fail closed.

`lib/venue-photos.ts` is the typed, shared photo manifest. The image validators allow exactly those local asset paths, or the configured Supabase public venue bucket. Arbitrary local paths, traversal paths and external image hosts remain rejected.

For a new deployment, apply all migrations in timestamp order. For an existing deployment, apply only migrations that have not yet been applied. No new secret or environment variable is needed.
