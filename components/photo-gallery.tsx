'use client';
import { useRef, useState } from 'react';
import { VenueImage } from '@/components/venue-image';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryImage } from '@/lib/types';
import { originalVenueImage } from '@/lib/venue-photos';
import { Button } from './ui/button';

export function PhotoGallery({ images }: { images: GalleryImage[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(0);
  const photo = images[selected];
  function move(direction: number) {
    setSelected((index) => (index + direction + images.length) % images.length);
  }
  if (!photo) return null;
  return (
    <>
      <div className="gallery-grid photographic-gallery">
        {images.map((image, index) => (
          <figure className="photo-card" key={image.id}>
            <button
              type="button"
              className="gallery-image-button"
              aria-label={`View photograph: ${image.title}`}
              onClick={() => {
                setSelected(index);
                dialog.current?.showModal();
              }}
            >
              <VenueImage
                src={image.image_url}
                alt={image.title}
                fill
                sizes="(max-width:580px) 90vw, (max-width:800px) 45vw, 30vw"
                style={{ objectFit: 'contain' }}
              />
              <span className="photo-category">{image.category}</span>
              <span className="photo-expand">
                <ArrowUpRight size={17} />
              </span>
            </button>
            <figcaption>
              <span className="photo-index">{String(index + 1).padStart(2, '0')}</span>
              <span>{image.title}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="photo-dialog"
        aria-labelledby="photo-dialog-title"
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            move(1);
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            move(-1);
          }
        }}
      >
        <div className="photo-dialog-header">
          <span>
            SOLEIL GARDEN <span className="opacity-50 ml-3">/ THE GALLERY</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close photograph"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </Button>
        </div>
        <div className="photo-dialog-image">
          <VenueImage
            src={photo.image_url}
            alt={photo.title}
            fill
            sizes="(max-width:580px) 90vw, 560px"
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div className="photo-dialog-footer">
          <div>
            <p>
              {photo.category} · {selected + 1} / {images.length}
            </p>
            <h2 id="photo-dialog-title">{photo.title}</h2>
            {originalVenueImage(photo.image_url) && (
              <div className="photo-provenance">
                <span>AI-enhanced from the supplied photograph; recreated details may differ.</span>
                <a
                  href={originalVenueImage(photo.image_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View original source ↗
                </a>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous photograph"
              disabled={images.length < 2}
              onClick={() => move(-1)}
            >
              <ChevronLeft size={18} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next photograph"
              disabled={images.length < 2}
              onClick={() => move(1)}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
