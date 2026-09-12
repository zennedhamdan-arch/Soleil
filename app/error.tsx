'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="container py-24 text-center">
      <h2>Something didn’t go as planned.</h2>
      <p className="my-6">We couldn’t load this page. Please try again in a moment.</p>
      <Button onClick={reset}>Try Again</Button>
    </main>
  );
}
