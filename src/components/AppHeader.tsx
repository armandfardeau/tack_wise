import ExportActions from './ExportActions';
import ViewActions from './ViewActions';
import SponsorshipActions, { type SponsorshipLinks } from './SponsorshipActions';
import type { SituationTemplate } from '../data/situationTemplates';
import { Copy, Sailboat } from 'lucide-react';
import type { ExportOptions, ExportQuality, Theme } from '../types';

interface AppHeaderProps {
  isExporting: boolean;
  presenterMode?: boolean;
  scenarioTitle?: string;
  onScenarioTitleChange?: (title: string) => void;
  onNewScenario?: () => void;
  onExport: (options: ExportOptions) => void;
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
  exportQuality?: ExportQuality;
  onExportQualityChange?: (quality: ExportQuality) => void;
  sponsorship?: SponsorshipLinks;
}

export default function AppHeader({
  isExporting,
  presenterMode = false,
  scenarioTitle,
  onScenarioTitleChange,
  onNewScenario,
  onExport,
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
  exportQuality,
  onExportQualityChange,
  sponsorship,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-main">
        <div className="branding">
          <span className="eyebrow">Tactical Sailing Simulator</span>
          <h1>Tack Wise <Sailboat className="brand-icon" aria-hidden="true" size={24} /></h1>
        </div>
        {onScenarioTitleChange && (
          <div className="scenario-title-editor">
            <label htmlFor="scenario-title">Scenario title</label>
            <input
              id="scenario-title"
              className="scenario-title-input"
              type="text"
              value={scenarioTitle ?? ''}
              placeholder="Untitled situation"
              readOnly={presenterMode}
              onChange={(event) => onScenarioTitleChange(event.target.value)}
              onBlur={(event) => onScenarioTitleChange(event.target.value.trim() || 'Untitled situation')}
            />
          </div>
        )}
      </div>
      <div className="header-tools" aria-label="Scenario tools">
        <ExportActions
          className="export-actions header-export-actions"
          isExporting={isExporting}
          onNewScenario={onNewScenario}
          onExport={onExport}
          onImportJson={onImportJson}
          onLoadTemplate={onLoadTemplate}
          onContributeTemplate={onContributeTemplate}
          onUpdateTemplate={onUpdateTemplate}
          canUpdateTemplate={canUpdateTemplate}
          templates={templates}
          exportQuality={exportQuality}
          onExportQualityChange={onExportQualityChange}
          theme={theme}
        />
        <ViewActions
          className="view-actions header-view-actions"
          presenterMode={presenterMode}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onTogglePresenter={onTogglePresenter}
        />
        <SponsorshipActions {...sponsorship} />
        <button type="button" className="header-tool-btn" onClick={() => onShareScenario?.()}><Copy aria-hidden="true" size={15} /> Copy share link</button>
      </div>
    </header>
  );
}
