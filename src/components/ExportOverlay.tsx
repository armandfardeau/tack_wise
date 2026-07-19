import type { VideoExportType } from '../types';

interface ExportOverlayProps {
  exportProgress: number;
  exportType: 'gif' | VideoExportType | null;
}

export default function ExportOverlay({ exportProgress, exportType }: ExportOverlayProps) {
  const exportLabel = exportType === 'gif' ? 'GIF' : exportType === 'webm' ? 'WEBM Video' : 'MP4 Video';

  return (
    <div className="export-overlay" role="status" aria-live="polite">
      <div className="export-spinner-box">
        <div className="spinner" />
        <h3>Exporting Scenario as {exportLabel}...</h3>
        <p>{exportType === 'gif' ? 'Rendering frames...' : 'Preparing video...'} {exportProgress}%</p>
      </div>
    </div>
  );
}
