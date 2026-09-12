import type { MetadataRoute } from 'next';
import { getServices } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  const services = await getServices();
  return [
    '/',
    '/events',
    '/weddings',
    '/gallery',
    '/about',
    '/contact',
    '/reserve',
    ...services.map((s) => `/events/${s.slug}`),
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
