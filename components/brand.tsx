import Link from 'next/link';
import { Sun } from 'lucide-react';
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Soleil Garden home">
      <Sun size={39} strokeWidth={1} className="brand-icon" />
      <div>
        <div className="brand-name">SOLEIL</div>
        <div className="brand-sub">GARDEN</div>
      </div>
    </Link>
  );
}
