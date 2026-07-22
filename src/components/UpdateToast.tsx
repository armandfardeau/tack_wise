import { RefreshCw, X } from 'lucide-react';

interface UpdateToastProps {
  onDismiss: () => void;
  onRefresh: () => void;
}

export default function UpdateToast({ onDismiss, onRefresh }: UpdateToastProps) {
  return (
    <div className="app-update-toast" role="status" aria-live="polite" aria-atomic="true">
      <div className="app-update-toast-message">
        <RefreshCw aria-hidden="true" size={18} />
        <span>A new version of Tack Wise is available.</span>
      </div>
      <div className="app-update-toast-actions">
        <button type="button" className="app-update-toast-refresh" onClick={onRefresh}>
          Refresh
        </button>
        <button
          type="button"
          className="app-update-toast-dismiss"
          aria-label="Dismiss update notification"
          onClick={onDismiss}
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  );
}
