import { cache } from 'react';
import { isConfigured, supabase } from './supabase/server';
import type { Service, GalleryImage, Settings } from './types';
export const defaultSettings: Settings = {
  id: 1,
  business_name: 'Soleil Garden',
  phone: '+250 790 009 264',
  whatsapp: '+250790009264',
  address: 'Gikondo / KK35 Avenue, Kigali, Rwanda',
  description:
    'A beautiful Kigali setting for weddings, celebrations, gatherings and unforgettable events.',
  social_links: {},
};
export const getSettings = cache(async (): Promise<Settings> => {
  if (!isConfigured()) return defaultSettings;
  const db = await supabase();
  const { data } = await db.from('site_settings').select('*').eq('id', 1).single();
  return data ?? defaultSettings;
});
export const getServices = cache(async (): Promise<Service[]> => {
  if (!isConfigured()) return [];
  const db = await supabase();
  const { data, error } = await db
    .from('services')
    .select('*')
    .eq('active', true)
    .order('created_at');
  if (error) throw new Error('Event types could not be loaded. Please try again.');
  return data ?? [];
});
export const getGallery = cache(async (limit = 12): Promise<GalleryImage[]> => {
  if (!isConfigured()) return [];
  const db = await supabase();
  const { data, error } = await db
    .from('gallery')
    .select('*')
    .eq('active', true)
    .order('sort_order')
    .limit(limit);
  if (error) throw new Error('The gallery could not be loaded. Please try again.');
  return data ?? [];
});
export function whatsapp(
  phone: string,
  message = 'Hello Soleil Garden, I would like to enquire about hosting an event.',
) {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}
