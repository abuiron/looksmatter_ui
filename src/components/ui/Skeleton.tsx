export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-[3/4] rounded-2xl" />
      <div className="mt-3 space-y-2 px-0.5">
        <div className="skeleton h-2.5 w-16" />
        <div className="skeleton h-3.5 w-11/12" />
        <div className="skeleton h-3.5 w-1/2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={className} role="status" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
