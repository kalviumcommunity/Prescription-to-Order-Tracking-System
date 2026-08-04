import Skeleton from './Skeleton.jsx';

// Reuses the real .stat-grid/.stat-card classes so the skeleton sits at the
// exact same size/spacing as the loaded layout (including per-role scaling) —
// nothing shifts when real data arrives.
export default function SkeletonStatGrid({ count = 3 }) {
  return (
    <div className="stat-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="stat-card skeleton-card" key={i}>
          <Skeleton width={40} height={40} radius={12} style={{ display: 'block', marginBottom: 14 }} />
          <Skeleton width="55%" height={12} style={{ marginBottom: 10 }} />
          <Skeleton width="35%" height={26} />
        </div>
      ))}
    </div>
  );
}
