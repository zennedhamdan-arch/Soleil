export default function Loading() {
  return (
    <div role="status" aria-label="Loading workspace">
      <div className="skeleton h-10 w-64 mb-8" />
      <div className="metric-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-32" />
        ))}
      </div>
      <div className="skeleton h-80" />
      <span className="sr-only">Loading workspace</span>
    </div>
  );
}
