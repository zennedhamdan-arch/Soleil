export default function Loading() {
  return (
    <div className="container py-16" aria-label="Loading" role="status">
      <div className="skeleton h-6 w-32 mb-6" />
      <div className="skeleton h-16 w-2/3 mb-8" />
      <div className="skeleton h-80 w-full" />
      <span className="sr-only">Loading, please wait.</span>
    </div>
  );
}
