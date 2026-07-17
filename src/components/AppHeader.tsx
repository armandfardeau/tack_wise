import ExportActions from './ExportActions';

interface AppHeaderProps {
  isExporting: boolean;
  isSidebarOpen: boolean;
  onExport: (type: 'gif' | 'mp4') => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onToggleSidebar: () => void;
}

export default function AppHeader({ isExporting, isSidebarOpen, onExport, onExportJson, onImportJson, onToggleSidebar }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-main">
        <div className="branding">
          <span className="eyebrow">Tactical Sailing Simulator</span>
          <h1>Tack Wise ⛵</h1>
        </div>
        <button
          type="button"
          className="menu-toggle"
          aria-controls="controls-sidebar"
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? 'Close controls menu' : 'Open controls menu'}
          onClick={onToggleSidebar}
        >
          <span aria-hidden="true">☰</span>
        </button>
      </div>
      <ExportActions
        isExporting={isExporting}
        onExport={onExport}
        onExportJson={onExportJson}
        onImportJson={onImportJson}
      />
    </header>
  );
}
