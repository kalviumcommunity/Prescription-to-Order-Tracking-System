// Base shimmer block. Every skeleton composite (SkeletonStatGrid, SkeletonTable, …)
// is built from this. Sized via props so it can stand in for text, icons, or badges.
export default function Skeleton({ width = '100%', height = 14, radius = 6, style, className = '' }) {
  return (
    <span
      className={`skeleton-block ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}
