import Image, { type ImageProps } from 'next/image';
import { isEnhancedVenuePhoto, resolveVenueImage } from '@/lib/venue-photos';

/** All venue imagery uses this boundary, including legacy Supabase image URLs. */
export function VenueImage({ src, alt, ...props }: Omit<ImageProps, 'src'> & { src: string }) {
  const enhanced = isEnhancedVenuePhoto(src);
  return (
    <>
      <Image
        {...props}
        src={resolveVenueImage(src)}
        alt={enhanced ? `${alt} — AI-enhanced; details may differ from the actual venue` : alt}
      />
      {enhanced && (
        <span
          className="venue-image-disclosure"
          title="AI-enhanced from a low-resolution venue photograph. Recreated details may differ from the actual venue."
        >
          AI-enhanced image
        </span>
      )}
    </>
  );
}
