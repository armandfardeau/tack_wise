import ExportActions from './ExportActions';

interface AppHeaderProps {
  canRedo?: boolean;
  canUndo?: boolean;
  hasAutosave?: boolean;
  isExporting: boolean;
  isSidebarOpen: boolean;
  presenterMode?: boolean;
  onRedo?: () => void;
  onExport: (type: 'gif' | 'mp4') => void;
  onExportImage?: (type: 'png' | 'jpeg') => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onRestoreAutosave?: () => void;
  onShareScenario?: () => void;
  onToggleSidebar: () => void;
  onTogglePresenter?: () => void;
  onUndo?: () => void;
}

export default function AppHeader({
  canRedo = false,
  canUndo = false,
  hasAutosave = false,
  isExporting,
  isSidebarOpen,
  presenterMode = false,
  onRedo,
  onExport,
  onExportImage,
  onExportJson,
  onImportJson,
  onRestoreAutosave,
  onShareScenario,
  onToggleSidebar,
  onTogglePresenter,
  onUndo,
}: AppHeaderProps) {
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
        onExportImage={onExportImage}
        onExportJson={onExportJson}
        onImportJson={onImportJson}
      />
      <div className="header-tools" aria-label="Scenario tools">
        <button type="button" className="header-tool-btn" onClick={() => onUndo?.()} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)" aria-label="Undo">↶</button>
        <button type="button" className="header-tool-btn" onClick={() => onRedo?.()} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)" aria-label="Redo">↷</button>
        {hasAutosave && <button type="button" className="header-tool-btn recovery-btn" onClick={() => onRestoreAutosave?.()}>Restore autosave</button>}
        <button type="button" className="header-tool-btn" onClick={() => onShareScenario?.()}>Copy share link</button>
        <button type="button" className="header-tool-btn" onClick={() => onTogglePresenter?.()}>{presenterMode ? 'Exit presenter' : 'Presenter mode'}</button>
      </div>
    </header>
  );
}
