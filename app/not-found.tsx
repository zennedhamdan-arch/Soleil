import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function NotFound() {
  return (
    <main id="main-content" className="container py-24 text-center">
      <div className="eyebrow justify-center">404 · A little off the garden path</div>
      <h1>This page couldn’t be found.</h1>
      <p className="my-6">Let’s get you back to somewhere beautiful.</p>
      <Button asChild>
        <Link href="/">Back to Soleil Garden</Link>
      </Button>
    </main>
  );
}
