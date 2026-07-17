interface ExportOverlayProps {
  exportProgress: number;
  exportType: 'gif' | 'mp4' | null;
}

export default function ExportOverlay({ exportProgress, exportType }: ExportOverlayProps) {
  return (
    <div className="export-overlay" role="status" aria-live="polite">
      <div className="export-spinner-box">
        <div className="spinner" />
        <h3>Exporting Scenario as {exportType === 'gif' ? 'GIF' : 'WebM Video'}...</h3>
        <p>Rendering frames... {exportProgress}%</p>
      </div>
    </div>
  );
}
