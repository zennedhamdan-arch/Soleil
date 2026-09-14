import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://soleilgarden.example'),
  title: {
    default: 'Soleil Garden | Wedding & Event Venue in Kigali',
    template: '%s | Soleil Garden Kigali',
  },
  description:
    'Celebrate weddings, engagements, birthdays and gatherings at Soleil Garden in Gikondo, Kigali, Rwanda. Enquire about your next event.',
  openGraph: {
    title: 'Soleil Garden — Celebrate Your Moments',
    description: 'A beautiful Kigali setting for weddings, celebrations and gatherings.',
    type: 'website',
    locale: 'en_RW',
    siteName: 'Soleil Garden',
  },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#294738' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
