import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { classifyError, ERROR_TYPES } from '../../utils/errorClassifier.js';
import { IconWifiOff, IconLock, IconShieldOff, IconAlertTriangle, IconAlertCircle } from '../Icons.jsx';
import RetryButton from './RetryButton.jsx';

const ICON_BY_TYPE = {
  [ERROR_TYPES.NETWORK]: IconWifiOff,
  [ERROR_TYPES.AUTH]: IconLock,
  [ERROR_TYPES.PERMISSION]: IconShieldOff,
  [ERROR_TYPES.NOT_FOUND]: IconAlertCircle,
  [ERROR_TYPES.SERVER]: IconAlertTriangle,
  [ERROR_TYPES.VALIDATION]: IconAlertCircle,
  [ERROR_TYPES.UNEXPECTED]: IconAlertCircle,
};

// Renders inside the page content area only — the sidebar/topbar chrome around
// it is untouched, so a failed fetch never looks like the whole app crashed.
export default function PageError({ error, onRetry }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const info = classifyError(error);
  const Icon = ICON_BY_TYPE[info.type] || IconAlertCircle;

  function goToLogin() {
    logout();
    navigate('/login');
  }

  return (
    <div className="page-state page-state-error" role="alert" aria-live="assertive">
      <div className="page-state-icon tone-error"><Icon size={30} /></div>
      <h2>{info.title}</h2>
      <p>{info.message}</p>
      <div className="page-state-actions">
        {info.type === ERROR_TYPES.AUTH && (
          <button type="button" className="btn btn-coral" onClick={goToLogin} autoFocus>Log in again</button>
        )}
        {info.type !== ERROR_TYPES.AUTH && info.canRetry && onRetry && (
          <RetryButton onRetry={onRetry} />
        )}
      </div>
    </div>
  );
}
