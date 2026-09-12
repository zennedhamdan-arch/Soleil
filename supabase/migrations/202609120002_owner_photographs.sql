begin;
-- Owner-supplied photographs copied from origin/main, commit 9ef58ad.
-- Public local paths are intentional: these assets ship with the Vercel app.
-- Admins can replace them later with higher-resolution Supabase Storage uploads.
insert into public.gallery(id,image_url,title,category,sort_order,active) values
('a18ed201-0000-4000-8000-000000000012','/images/soleil/venue-12.jpg','A walkway framed with white drapes and flowers','Weddings',0,true),
('a18ed201-0000-4000-8000-000000000007','/images/soleil/venue-7.jpg','The garden and marquee in daylight','Garden',1,true),
('a18ed201-0000-4000-8000-000000000004','/images/soleil/venue-4.jpg','Tables arranged beneath a softly lit canopy','Celebrations',2,true),
('a18ed201-0000-4000-8000-000000000008','/images/soleil/venue-8.jpg','A floral celebration backdrop with woven chairs','Weddings',3,true),
('a18ed201-0000-4000-8000-000000000006','/images/soleil/venue-6.jpg','White table settings with orange accents','Celebrations',4,true),
('a18ed201-0000-4000-8000-000000000005','/images/soleil/venue-5.jpg','The marquee illuminated in the evening','Garden',5,true),
('a18ed201-0000-4000-8000-000000000009','/images/soleil/venue-9.jpg','An evening view across the garden lawn','Garden',6,true),
('a18ed201-0000-4000-8000-000000000010','/images/soleil/venue-10.jpg','Tiled steps leading to the venue entrance','Other',7,true)
on conflict (id) do nothing;

-- Preserve any image already selected by staff.
update public.services set image_url = case
  when slug in ('wedding-engagement','religious-wedding') then '/images/soleil/venue-12.jpg'
  when slug in ('corporate-conference','baby-shower','retirement') then '/images/soleil/venue-4.jpg'
  when slug in ('birthday','theme-party') then '/images/soleil/venue-6.jpg'
  when slug in ('anniversary','religious-event') then '/images/soleil/venue-8.jpg'
  when slug in ('childrens-party','school-event') then '/images/soleil/venue-7.jpg'
  else image_url end
where image_url = '';
commit;
