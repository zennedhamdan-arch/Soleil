export type Service = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  active: boolean;
};
export type GalleryImage = {
  id: string;
  image_url: string;
  title: string;
  category: string;
  sort_order: number;
  active: boolean;
};
export type Booking = {
  id: string;
  reference_number: string;
  customer_name: string;
  phone: string;
  email: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  admin_notes: string;
  created_at: string;
};
export type BlockedDate = { id: string; date: string; reason: string };
export type Settings = {
  id: number;
  business_name: string;
  phone: string;
  whatsapp: string;
  address: string;
  description: string;
  social_links: Record<string, string>;
};
