import { IconSearchOff } from '../Icons.jsx';

// Distinct from PageEmpty: this fires when a search/filter narrowed a
// non-empty dataset down to nothing, so the message and recovery action
// (clear the filter) are different from "there's no data at all".
export default function NoResults({ query, onClear }) {
  return (
    <div className="page-state page-state-empty" role="status">
      <div className="page-state-icon tone-empty"><IconSearchOff size={30} /></div>
      <h2>No results found</h2>
      <p>{query ? <>Nothing matches &ldquo;{query}&rdquo;.</> : 'No results match the current filters.'}</p>
      <div className="page-state-actions">
        <button type="button" className="btn btn-outline" onClick={onClear} autoFocus>Clear search</button>
      </div>
    </div>
  );
}
