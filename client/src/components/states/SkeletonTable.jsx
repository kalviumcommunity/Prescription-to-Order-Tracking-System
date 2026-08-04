import Skeleton from './Skeleton.jsx';

// Reuses .panel/.panel-head/.data-table so row height and padding match the
// loaded table exactly (including per-role scaling) — the table "fills in"
// without the page jumping.
export default function SkeletonTable({ rows = 5, columns = 5, showSearch = false }) {
  return (
    <div className="panel" aria-hidden="true">
      <div className="panel-head">
        <Skeleton width={160} height={18} />
        {showSearch && <Skeleton width={220} height={38} radius={10} />}
      </div>
      <table className="data-table">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c}>
                  <Skeleton width={c === 0 ? '60%' : '80%'} height={13} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
