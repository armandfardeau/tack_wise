import { Settings } from 'lucide-react';
import styles from './GridSettingsButton.module.css';

interface GridSettingsButtonProps {
  onOpenInspector: () => void;
}

export default function GridSettingsButton({ onOpenInspector }: GridSettingsButtonProps) {
  return (
    <button
      type="button"
      className={styles.settingsButton}
      aria-label="Open canvas settings"
      title="Open canvas settings"
      onClick={onOpenInspector}
    >
      <Settings aria-hidden="true" size={16} />
    </button>
  );
}
