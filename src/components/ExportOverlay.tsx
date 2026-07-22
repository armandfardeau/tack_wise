import type { ExportPhase, VideoExportType } from '../types';
import styles from './ExportOverlay.module.css';

interface ExportOverlayProps {
  exportProgress: number;
  exportPhase: ExportPhase;
  exportType: 'gif' | VideoExportType | null;
}

export default function ExportOverlay({ exportProgress, exportPhase, exportType }: ExportOverlayProps) {
  const exportLabel = exportType === 'gif' ? 'GIF' : exportType === 'webm' ? 'WEBM Video' : 'MP4 Video';
  const exportMessage = exportPhase === 'preparing'
    ? 'Loading advanced export tools… This may take a moment the first time while the encoder downloads and initializes.'
    : exportPhase === 'capturing'
      ? exportType === 'gif' ? 'Rendering frames...' : 'Capturing frames...'
      : exportType === 'gif' ? 'Building GIF...' : 'Encoding video...';

  return (
    <div className={styles.exportOverlay} role="status" aria-live="polite">
      <div className={styles.exportSpinnerBox}>
        <div className={styles.spinner} />
        <h3>Exporting Scenario as {exportLabel}...</h3>
        <p>{exportMessage}{exportPhase === 'preparing' ? '' : ` ${exportProgress}%`}</p>
      </div>
    </div>
  );
}
