import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Soleil Garden',
    short_name: 'Soleil Garden',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9f8f3',
    theme_color: '#294738',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
