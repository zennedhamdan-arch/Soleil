begin;
-- Data-only update. The owner selected design/ai-previews as the replacement
-- source. The application labels these derivatives as AI-enhanced, not originals.
-- No schema changes, inserts, deletes, relationship changes or Storage deletes.
create temporary table soleil_image_replacements (old_url text primary key, new_url text not null) on commit drop;
insert into soleil_image_replacements(old_url,new_url) values
('/images/soleil/venue-7.jpg','/images/soleil/enhanced/garden-marquee.webp'),
('/images/soleil/venue-12.jpg','/images/soleil/enhanced/wedding-walkway.webp'),
('/images/soleil/venue-4.jpg','/images/soleil/enhanced/canopy-reception.webp'),
('/images/soleil/venue-8.jpg','/images/soleil/enhanced/floral-celebration-backdrop.webp'),
('/images/soleil/venue-6.jpg','/images/soleil/enhanced/table-settings.webp'),
('/images/soleil/venue-5.jpg','/images/soleil/enhanced/marquee-at-night.webp'),
('/images/soleil/venue-9.jpg','/images/soleil/enhanced/evening-garden.webp'),
('/images/soleil/venue-10.jpg','/images/soleil/enhanced/venue-entrance.webp');

-- Only known, old bundled paths are replaced. Custom Storage uploads, titles,
-- active flags, categories and sort order chosen by staff are left untouched.
update public.gallery g set image_url = r.new_url
from soleil_image_replacements r where g.image_url = r.old_url;
update public.services s set image_url = r.new_url
from soleil_image_replacements r where s.image_url = r.old_url;

-- Switch just the two untouched default hero positions to prefer the wide garden
-- view. If staff reordered either image, leave their ordering completely intact.
with untouched_defaults as (
 select count(*) = 2 as swap from public.gallery where
 (id='a18ed201-0000-4000-8000-000000000012' and sort_order=0)
 or (id='a18ed201-0000-4000-8000-000000000007' and sort_order=1)
)
update public.gallery set sort_order=case
 when id='a18ed201-0000-4000-8000-000000000007' then 0 else 1 end
where (select swap from untouched_defaults)
 and id in ('a18ed201-0000-4000-8000-000000000007','a18ed201-0000-4000-8000-000000000012');
commit;
