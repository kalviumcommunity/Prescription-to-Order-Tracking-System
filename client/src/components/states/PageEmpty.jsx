// Generic, configurable empty state. Callers decide the icon, copy, and
// optional action (a <Link>/<button> node) — this component only lays it out,
// so "no data yet" and "you're all caught up" read differently without
// forking the component.
export default function PageEmpty({ icon: Icon, title, message, action }) {
  return (
    <div className="page-state page-state-empty" role="status">
      {Icon && <div className="page-state-icon tone-empty"><Icon size={30} /></div>}
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action && <div className="page-state-actions">{action}</div>}
    </div>
  );
}
