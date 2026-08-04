import { IconRefresh } from '../Icons.jsx';

// Autofocuses so screen readers land on the recovery action immediately after
// an error is announced, and keyboard users don't have to tab past dead air.
export default function RetryButton({ onRetry, label = 'Retry' }) {
  return (
    <button type="button" className="btn btn-coral" onClick={onRetry} autoFocus>
      <IconRefresh size={17} />
      {label}
    </button>
  );
}
