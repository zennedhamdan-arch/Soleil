import Image from 'next/image';
import Link from 'next/link';

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Soleil Garden home">
      {/* Small lossless PNG preserves gold edges and alpha; no lossy venue pipeline. */}
      <Image
        src="/brand/soleil-garden-logo.png"
        alt="Soleil Garden official gold monogram"
        width={52}
        height={52}
        className="brand-mark"
        unoptimized
        loading="eager"
      />
      <div>
        <div className="brand-name">SOLEIL</div>
        <div className="brand-sub">GARDEN</div>
      </div>
    </Link>
  );
}
