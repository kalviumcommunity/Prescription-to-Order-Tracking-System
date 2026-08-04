// Small shared presentational helpers for list states.

export function Loading({ label = 'Loading…' }) {
  return <div className="state state-loading">{label}</div>;
}

export function ErrorState({ message }) {
  return <div className="state state-error">{message}</div>;
}

export function EmptyState({ message }) {
  return <div className="state state-empty">{message}</div>;
}

export function StatusPill({ status }) {
  return <span className={`pill pill-${status}`}>{status}</span>;
}
