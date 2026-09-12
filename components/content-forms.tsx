'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Upload, LoaderCircle, ImagePlus } from 'lucide-react';
import { Button } from './ui/button';
import { adminRequest } from './admin-actions';
import type { Service, GalleryImage, Settings } from '@/lib/types';
import { serviceSchema, gallerySchema, settingsSchema } from '@/lib/validation';
import { venuePhotos, isBundledVenuePhoto } from '@/lib/venue-photos';
export function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mb-5">
      <label className="field-label block mb-2" htmlFor="image-upload">
        Image
      </label>
      {value && (
        <div className="relative h-44 w-full mb-3 rounded overflow-hidden">
          <Image
            src={value}
            alt="Selected image preview"
            fill
            sizes="600px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}
      <label
        className={`btn btn-outline w-full ${busy ? 'opacity-50' : ''}`}
        htmlFor="image-upload"
      >
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}{' '}
        {busy ? 'Optimizing & uploading…' : 'Upload Image'}
      </label>
      <input
        className="sr-only"
        id="image-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 4194304) {
            toast.error('Choose an image smaller than 4 MB.');
            return;
          }
          setBusy(true);
          try {
            const body = new FormData();
            body.set('image', file);
            const response = await fetch('/api/admin', { method: 'POST', body });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            onChange(data.image_url);
            toast.success('Gallery image uploaded — save to publish');
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Image upload failed.');
          } finally {
            setBusy(false);
            e.target.value = '';
          }
        }}
      />
      <div className="form-field mt-4">
        <label htmlFor="existing-venue-photo">Or choose a supplied Soleil photograph</label>
        <select
          id="existing-venue-photo"
          value={isBundledVenuePhoto(value) ? value : ''}
          disabled={busy}
          onChange={(event) => {
            if (event.target.value) onChange(event.target.value);
          }}
        >
          <option value="">Choose from the repository photographs</option>
          {venuePhotos.map((photo) => (
            <option key={photo.id} value={photo.image_url}>
              {photo.title}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[10px] mt-2">
        JPEG, PNG or WebP, up to 4 MB. Automatically resized and converted to WebP. Upload only
        images you have permission to use.
      </p>
    </div>
  );
}
export function ServiceForm({ service }: { service?: Service }) {
  const router = useRouter();
  const [image, setImage] = useState(service?.image_url || ''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <form
      className="admin-panel admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const parsed = serviceSchema.safeParse({
          name: f.get('name'),
          slug: f.get('slug'),
          description: f.get('description'),
          image_url: image,
          active: f.get('active') === 'on',
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0].message);
          return;
        }
        setBusy(true);
        setError('');
        try {
          await adminRequest({ action: 'service.save', id: service?.id, data: parsed.data });
          toast.success('Service saved');
          router.push('/admin/services');
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not save service.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="mb-6">{service ? 'Edit service' : 'Add a service'}</h2>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="name">Service name</label>
          <input name="name" id="name" defaultValue={service?.name} required maxLength={100} />
        </div>
        <div className="form-field">
          <label htmlFor="slug">URL slug</label>
          <input
            name="slug"
            id="slug"
            defaultValue={service?.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="wedding-engagement"
            maxLength={100}
          />
        </div>
        <div className="form-field span-2">
          <label htmlFor="description">Description</label>
          <textarea
            name="description"
            id="description"
            defaultValue={service?.description}
            required
            minLength={5}
            maxLength={2000}
          />
        </div>
      </div>
      <ImageUpload value={image} onChange={setImage} />
      <label className="flex items-center gap-2 text-xs mb-5">
        <input type="checkbox" name="active" defaultChecked={service?.active ?? true} />
        Active — visible on the public website
      </label>
      {error && (
        <div className="notice error-notice mb-4" role="alert">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <Button disabled={busy} type="submit">
          {busy ? 'Saving…' : 'Save Service'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/services')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
export function GalleryForm({ image: existing }: { image?: GalleryImage }) {
  const router = useRouter();
  const [image, setImage] = useState(existing?.image_url || ''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <form
      className="admin-panel admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const parsed = gallerySchema.safeParse({
          title: f.get('title'),
          category: f.get('category'),
          sort_order: Number(f.get('sort_order')),
          active: f.get('active') === 'on',
          image_url: image,
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0].message);
          return;
        }
        setBusy(true);
        setError('');
        try {
          await adminRequest({ action: 'gallery.save', id: existing?.id, data: parsed.data });
          toast.success('Gallery image saved');
          router.push('/admin/gallery');
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not save image.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="mb-6 flex gap-2 items-center">
        <ImagePlus size={18} />
        {existing ? 'Edit gallery image' : 'Add to your gallery'}
      </h2>
      <ImageUpload value={image} onChange={setImage} />
      <div className="form-field">
        <label htmlFor="title">Title / accessible image description</label>
        <input
          id="title"
          name="title"
          defaultValue={existing?.title}
          required
          minLength={2}
          maxLength={160}
          placeholder="Describe what this photograph shows"
        />
      </div>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="category">Category</label>
          <select name="category" id="category" defaultValue={existing?.category || 'Garden'}>
            {['Weddings', 'Celebrations', 'Garden', 'Corporate', 'Other'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="sort_order">Display order (lowest first)</label>
          <input
            name="sort_order"
            id="sort_order"
            type="number"
            defaultValue={existing?.sort_order ?? 0}
            min={0}
            max={10000}
            required
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs mb-5">
        <input type="checkbox" name="active" defaultChecked={existing?.active ?? true} />
        Active — show in the public gallery
      </label>
      {error && (
        <div className="notice error-notice mb-4" role="alert">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy || !image}>
          {busy ? 'Saving…' : 'Save Gallery Image'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/gallery')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
export function SettingsForm({ settings: s }: { settings: Settings }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const router = useRouter();
  return (
    <form
      className="admin-panel admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setError('');
        const f = new FormData(e.currentTarget);
        const social_links: Record<string, string> = {};
        for (const name of ['Instagram', 'Facebook', 'TikTok', 'YouTube']) {
          const value = String(f.get(name) || '').trim();
          if (value) social_links[name] = value;
        }
        const parsed = settingsSchema.safeParse({
          business_name: f.get('business_name'),
          phone: f.get('phone'),
          whatsapp: f.get('whatsapp'),
          address: f.get('address'),
          description: f.get('description'),
          social_links,
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0].message);
          return;
        }
        setBusy(true);
        try {
          await adminRequest({ action: 'settings.save', data: parsed.data });
          toast.success('Settings saved');
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not save settings.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="mb-6">Business details</h2>
      {(['business_name', 'phone', 'whatsapp', 'address'] as const).map((name) => (
        <div className="form-field" key={name}>
          <label htmlFor={name} className="capitalize">
            {name.replaceAll('_', ' ')}
          </label>
          <input id={name} name={name} required defaultValue={s[name]} />
          {name === 'whatsapp' && (
            <p className="text-[10px]">
              International format without spaces, for example +250790009264.
            </p>
          )}
        </div>
      ))}
      <div className="form-field">
        <label htmlFor="description">Business description</label>
        <textarea
          id="description"
          name="description"
          defaultValue={s.description}
          maxLength={2000}
        />
      </div>
      <h2 className="mt-8 mb-3">Social links</h2>
      <p className="text-xs mb-6">
        Only links you provide will be displayed publicly. Use full HTTPS URLs.
      </p>
      <div className="form-grid">
        {['Instagram', 'Facebook', 'TikTok', 'YouTube'].map((name) => (
          <div className="form-field" key={name}>
            <label htmlFor={name}>{name}</label>
            <input
              id={name}
              name={name}
              type="url"
              defaultValue={s.social_links[name] || ''}
              placeholder="https://…"
            />
          </div>
        ))}
      </div>
      {error && (
        <div role="alert" className="notice error-notice mb-4">
          {error}
        </div>
      )}
      <Button disabled={busy} type="submit">
        {busy ? 'Saving…' : 'Save Settings'}
      </Button>
    </form>
  );
}
