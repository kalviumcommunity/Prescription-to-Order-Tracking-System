import Skeleton from './Skeleton.jsx';

// Reuses .form-card/.form-grid so a loading form occupies the same space as
// the real one once fields are ready — no layout jump when data arrives.
export default function SkeletonForm({ sections = 2, fieldsPerSection = 3 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: sections }).map((_, s) => (
        <div className="form-card" key={s}>
          <Skeleton width={180} height={18} style={{ marginBottom: 22 }} />
          <div className="form-grid">
            {Array.from({ length: fieldsPerSection }).map((_, f) => (
              <div key={f}>
                <Skeleton width={90} height={12} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={44} radius={12} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
