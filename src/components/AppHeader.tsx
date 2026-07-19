import ExportActions from './ExportActions';

interface AppHeaderProps {
  isExporting: boolean;
  presenterMode?: boolean;
  onExport: (type: 'gif' | 'mp4') => void;
  onExportImage?: (type: 'png' | 'jpeg') => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onShareScenario?: () => void;
  onTogglePresenter?: () => void;
}

export default function AppHeader({
  isExporting,
  presenterMode = false,
  onExport,
  onExportImage,
  onExportJson,
  onImportJson,
  onShareScenario,
  onTogglePresenter,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-main">
        <div className="branding">
          <span className="eyebrow">Tactical Sailing Simulator</span>
          <h1>Tack Wise ⛵</h1>
        </div>
      </div>
      <ExportActions
        isExporting={isExporting}
        onExport={onExport}
        onExportImage={onExportImage}
        onExportJson={onExportJson}
        onImportJson={onImportJson}
      />
      <div className="header-tools" aria-label="Scenario tools">
        <button type="button" className="header-tool-btn" onClick={() => onShareScenario?.()}>Copy share link</button>
        <button type="button" className="header-tool-btn" onClick={() => onTogglePresenter?.()}>{presenterMode ? 'Exit presenter' : 'Presenter mode'}</button>
      </div>
    </header>
  );
}
