interface AppHeaderProps {
  isExporting: boolean;
  onExport: (type: 'gif' | 'mp4') => void;
}

export default function AppHeader({ isExporting, onExport }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="branding">
        <span className="eyebrow">Tactical Sailing Simulator</span>
        <h1>Tack Wise ⛵</h1>
      </div>
      <div className="export-actions">
        <button type="button" className="action-btn gif-btn" onClick={() => onExport('gif')} disabled={isExporting}>📥 Export GIF</button>
        <button type="button" className="action-btn mp4-btn" onClick={() => onExport('mp4')} disabled={isExporting}>📹 Export Video (WebM)</button>
      </div>
    </header>
  );
}
