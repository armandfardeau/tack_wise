import ExportActions from './ExportActions';
import ViewActions from './ViewActions';
import type { SituationTemplate } from '../data/situationTemplates';
import { Copy, Sailboat } from 'lucide-react';
import type { Theme, VideoExportType } from '../types';

interface AppHeaderProps {
  isExporting: boolean;
  presenterMode?: boolean;
  onNewScenario?: () => void;
  onExport: (type: 'gif' | VideoExportType) => void;
  onExportImage?: (type: 'png' | 'jpeg') => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onShareScenario?: () => void;
  onContributeTemplate?: () => void;
  onUpdateTemplate?: () => void;
  canUpdateTemplate?: boolean;
  onToggleTheme?: () => void;
  onTogglePresenter?: () => void;
  onLoadTemplate?: (template: SituationTemplate) => void;
  templates?: SituationTemplate[];
  theme?: Theme;
}

export default function AppHeader({
  isExporting,
  presenterMode = false,
  onNewScenario,
  onExport,
  onExportImage,
  onExportJson,
  onImportJson,
  onShareScenario,
  onContributeTemplate,
  onUpdateTemplate,
  canUpdateTemplate,
  onToggleTheme,
  onTogglePresenter,
  onLoadTemplate,
  templates,
  theme = 'dark',
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-main">
        <div className="branding">
          <span className="eyebrow">Tactical Sailing Simulator</span>
          <h1>Tack Wise <Sailboat className="brand-icon" aria-hidden="true" size={24} /></h1>
        </div>
      </div>
      <div className="header-tools" aria-label="Scenario tools">
        <ExportActions
          className="export-actions header-export-actions"
          isExporting={isExporting}
          onNewScenario={onNewScenario}
          onExport={onExport}
          onExportImage={onExportImage}
          onExportJson={onExportJson}
          onImportJson={onImportJson}
          onLoadTemplate={onLoadTemplate}
          onContributeTemplate={onContributeTemplate}
          onUpdateTemplate={onUpdateTemplate}
          canUpdateTemplate={canUpdateTemplate}
          templates={templates}
        />
        <ViewActions
          className="view-actions header-view-actions"
          presenterMode={presenterMode}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onTogglePresenter={onTogglePresenter}
        />
        <button type="button" className="header-tool-btn" onClick={() => onShareScenario?.()}><Copy aria-hidden="true" size={15} /> Copy share link</button>
      </div>
    </header>
  );
}
