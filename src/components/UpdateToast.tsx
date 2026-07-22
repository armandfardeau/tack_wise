import { RefreshCw, X } from 'lucide-react';
import styles from './UpdateToast.module.css';

interface UpdateToastProps {
  onDismiss: () => void;
  onRefresh: () => void;
}

export default function UpdateToast({ onDismiss, onRefresh }: UpdateToastProps) {
  return (
    <div className={styles.toast} role="status" aria-live="polite" aria-atomic="true">
      <div className={styles.message}>
        <RefreshCw aria-hidden="true" size={18} />
        <span>A new version of Tack Wise is available.</span>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.refresh} onClick={onRefresh}>
          Refresh
        </button>
        <button
          type="button"
          className={styles.dismiss}
          aria-label="Dismiss update notification"
          onClick={onDismiss}
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  );
}
