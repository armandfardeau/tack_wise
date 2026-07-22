import { useState } from 'react';
import { ChevronLeft, ChevronRight, Film, Layers, Map, Share2, SlidersHorizontal } from 'lucide-react';
import type { SelectedType } from '../hooks/useScenario';
import type { DisplayMode, ExportOptions, ExportQuality, Frame, Mark, Theme } from '../types';
import type { SituationTemplate } from '../data/situationTemplates';
import LayerList from './LayerList';
import Timeline from './Timeline';
import ExportActions from './ExportActions';
import FloatingAddMenu from './FloatingAddMenu';
import { CanvasSettingsInspector, PlaybackInspector, WindInspector } from './Inspector';

export type ControlPanelSection = 'scene' | 'sequence' | 'share';

interface SidebarProps {
  currentFrameIndex: number;
  frames: Frame[];
  scenarioTitle: string;
  onScenarioTitleChange: (title: string) => void;
  presenterMode?: boolean;
  isExporting: boolean;
  theme: Theme;
  exportQuality: ExportQuality;
  onExportQualityChange: (quality: ExportQuality) => void;
  onNewScenario: () => void;
  onExport: (options: ExportOptions) => void;
  onImportJson: (file: File) => void;
  onShareScenario: () => void;
  shareFeedback?: string | null;
  onContributeTemplate?: () => void;
  onUpdateTemplate?: () => void;
  canUpdateTemplate?: boolean;
  onLoadTemplate?: (template: SituationTemplate) => void;
  templates?: SituationTemplate[];
  unanimatableTransitionIndices?: number[];
  onFixTransition: (transitionIndex: number) => void;
  isOpen: boolean;
  onAddFrame: () => void;
  onDeleteFrame: (frameIndex: number) => void;
  onDuplicateFrame: (frameIndex: number) => void;
  onRenameFrame: (frameIndex: number, name: string) => void;
  onSelectFrame: (index: number) => void;
  onToggle: () => void;
  onClose: () => void;
  onOpenInspector: (id: string, type: Exclude<SelectedType, null>) => void;
  selectedId: string | null;
  selectedType: SelectedType;
  activeFrame: Frame;
  autoSailTrim: boolean;
  displayMode: DisplayMode;
  gridSnapEnabled: boolean;
  showGrid: boolean;
  showFrameTitle: boolean;
  showFrameNumber: boolean;
  onSetGridSnapEnabled: (enabled: boolean) => void;
  onSetAutoSailTrim: (enabled: boolean) => void;
  onSetDisplayMode: (mode: DisplayMode) => void;
  onSetShowFrameTitle: (show: boolean) => void;
  onSetShowFrameNumber: (show: boolean) => void;
  onSetShowGrid: (show: boolean) => void;
  isPlaying: boolean;
  onTogglePlaying: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onReplayFromStart: () => void;
  playSpeed: number;
  onSetPlaySpeed: (speed: number) => void;
  onAddBoat: () => void;
  onAddMark: (shape?: Mark['shape']) => void;
  onAddArrow: () => void;
  onAddComment: () => void;
  onAddRuleComment: () => void;
  onAddImage: (src: string, name?: string) => void;
  updateActiveFrame: (changes: Partial<Frame>) => void;
}

const sectionDefinitions: Array<{ id: ControlPanelSection; label: string; description: string; icon: typeof Map }> = [
  { id: 'scene', label: 'Scene', description: 'Canvas, wind, and layers', icon: Map },
  { id: 'sequence', label: 'Sequence', description: 'Frames and playback', icon: Film },
  { id: 'share', label: 'Share', description: 'Files, links, and templates', icon: Share2 },
];

export default function Sidebar({
  currentFrameIndex,
  frames,
  scenarioTitle,
  onScenarioTitleChange,
  presenterMode = false,
  isExporting,
  theme,
  exportQuality,
  onExportQualityChange,
  onNewScenario,
  onExport,
  onImportJson,
  onShareScenario,
  shareFeedback,
  onContributeTemplate,
  onUpdateTemplate,
  canUpdateTemplate = false,
  onLoadTemplate,
  templates = [],
  unanimatableTransitionIndices = [],
  onFixTransition,
  isOpen,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  onRenameFrame,
  onSelectFrame,
  onToggle,
  onClose,
  onOpenInspector,
  selectedId,
  selectedType,
  activeFrame,
  autoSailTrim,
  displayMode,
  gridSnapEnabled,
  showGrid,
  showFrameTitle,
  showFrameNumber,
  onSetGridSnapEnabled,
  onSetAutoSailTrim,
  onSetDisplayMode,
  onSetShowFrameTitle,
  onSetShowFrameNumber,
  onSetShowGrid,
  isPlaying,
  onTogglePlaying,
  onStepBackward,
  onStepForward,
  onReplayFromStart,
  playSpeed,
  onSetPlaySpeed,
  onAddBoat,
  onAddMark,
  onAddArrow,
  onAddComment,
  onAddRuleComment,
  onAddImage,
  updateActiveFrame,
}: SidebarProps) {
  const [section, setSection] = useState<ControlPanelSection>('scene');

  const handleSectionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = sectionDefinitions.findIndex((definition) => definition.id === section);
    const nextIndex = event.key === 'ArrowRight' || event.key === 'ArrowDown'
      ? (currentIndex + 1) % sectionDefinitions.length
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? (currentIndex - 1 + sectionDefinitions.length) % sectionDefinitions.length
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? sectionDefinitions.length - 1
            : -1;

    if (nextIndex < 0) return;
    event.preventDefault();
    setSection(sectionDefinitions[nextIndex].id);
  };

  return (
    <>
      <button
        type="button"
        className={`sidebar-drawer-handle${isOpen ? ' is-open' : ''}`}
        aria-controls="controls-sidebar"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close controls panel' : 'Open controls panel'}
        onClick={onToggle}
      >
        {isOpen ? <ChevronLeft aria-hidden="true" size={16} /> : <ChevronRight aria-hidden="true" size={16} />}
        <span>Controls</span>
      </button>
      <button type="button" className={`sidebar-backdrop${isOpen ? ' is-open' : ''}`} aria-label="Close controls panel" onClick={onClose} />
      <aside id="controls-sidebar" className={`step-panel control-panel${isOpen ? ' is-open' : ''}`}>
        <div className="control-panel-intro">
          <div>
            <span className="control-panel-eyebrow">Tactical workspace</span>
            <h2>Build a situation</h2>
          </div>
          <SlidersHorizontal aria-hidden="true" size={18} />
        </div>

        <div className="control-panel-tabs" role="tablist" aria-label="Workspace controls">
          {sectionDefinitions.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`control-tab-${id}`}
              aria-selected={section === id}
              aria-controls={`control-panel-${id}`}
              tabIndex={section === id ? 0 : -1}
              className={`control-panel-tab${section === id ? ' is-active' : ''}`}
              onClick={() => setSection(id)}
              onKeyDown={handleSectionKeyDown}
            >
              <Icon aria-hidden="true" size={16} />
              <span className="control-panel-tab-copy">
                <span>{label}</span>
                <small>{description}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="control-panel-content">
          {section === 'scene' && (
            <div id="control-panel-scene" role="tabpanel" aria-labelledby="control-tab-scene" className="control-panel-view">
              <section className="control-section scene-title-section">
                <label htmlFor="scenario-title">Scenario title</label>
                <input
                  id="scenario-title"
                  className="scenario-title-input"
                  type="text"
                  value={scenarioTitle}
                  placeholder="Untitled situation"
                  readOnly={presenterMode}
                  onChange={(event) => onScenarioTitleChange(event.target.value)}
                  onBlur={(event) => onScenarioTitleChange(event.target.value.trim() || 'Untitled situation')}
                />
              </section>

              <section className="control-section control-panel-card">
                <h3 className="section-title"><span>Wind</span><span className="control-section-value">{activeFrame.windSpeed} kts · {activeFrame.windAngle}°</span></h3>
                <WindInspector activeFrame={activeFrame} updateActiveFrame={updateActiveFrame} />
                <div className="form-row flex-row scene-trim-control">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={autoSailTrim} onChange={(event) => onSetAutoSailTrim(event.target.checked)} />
                    <span>Auto sail trim</span>
                  </label>
                </div>
              </section>

              <section className="control-section control-panel-card">
                <h3 className="section-title">Canvas settings</h3>
                <CanvasSettingsInspector
                  displayMode={displayMode}
                  gridSnapEnabled={gridSnapEnabled}
                  onSetGridSnapEnabled={onSetGridSnapEnabled}
                  onSetDisplayMode={onSetDisplayMode}
                  onSetShowFrameTitle={onSetShowFrameTitle}
                  onSetShowFrameNumber={onSetShowFrameNumber}
                  onSetShowGrid={onSetShowGrid}
                  showFrameTitle={showFrameTitle}
                  showFrameNumber={showFrameNumber}
                  showGrid={showGrid}
                />
              </section>

              {!presenterMode && (
                <section className="control-section control-panel-card">
                  <h3 className="section-title">Add to scene</h3>
                  <FloatingAddMenu
                    variant="panel"
                    onAddBoat={onAddBoat}
                    onAddMark={onAddMark}
                    onAddArrow={onAddArrow}
                    onAddComment={onAddComment}
                    onAddRuleComment={onAddRuleComment}
                    onAddImage={onAddImage}
                  />
                </section>
              )}

              <section className="control-section control-panel-card scene-layers-card">
                <div className="control-section-heading-row">
                  <h3 className="section-title"><Layers aria-hidden="true" size={16} /> Layers</h3>
                  <span className="control-section-value">Frame {currentFrameIndex + 1}</span>
                </div>
                <LayerList
                  activeFrame={activeFrame}
                  onOpenInspector={onOpenInspector}
                  selectedId={selectedId}
                  selectedType={selectedType}
                />
              </section>
            </div>
          )}

          {section === 'sequence' && (
            <div id="control-panel-sequence" role="tabpanel" aria-labelledby="control-tab-sequence" className="control-panel-view">
              <section className="control-section control-panel-card">
                <h3 className="section-title"><Film aria-hidden="true" size={16} /> Playback</h3>
                <PlaybackInspector
                  isPlaying={isPlaying}
                  onSetPlaySpeed={onSetPlaySpeed}
                  onTogglePlaying={onTogglePlaying}
                  playSpeed={playSpeed}
                />
                <div className="sequence-step-actions">
                  <button type="button" className="timeline-action-btn" onClick={onStepBackward} disabled={currentFrameIndex <= 0}>Backward</button>
                  <button type="button" className="timeline-action-btn" onClick={onStepForward} disabled={currentFrameIndex >= frames.length - 1}>Forward</button>
                  <button type="button" className="timeline-action-btn" onClick={onReplayFromStart}>Replay</button>
                </div>
              </section>

              <section className="control-section control-panel-card sequence-display-card">
                <h3 className="section-title">Sequence display</h3>
                <div className="editor-form">
                  <div className="form-row flex-row">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={showFrameTitle} onChange={(event) => onSetShowFrameTitle(event.target.checked)} />
                      <span>Show frame title</span>
                    </label>
                  </div>
                  <div className="form-row flex-row">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={showFrameNumber} onChange={(event) => onSetShowFrameNumber(event.target.checked)} />
                      <span>Show frame number</span>
                    </label>
                  </div>
                  <fieldset className="sequence-display-mode">
                    <legend>Ghost display</legend>
                    <label className="checkbox-label">
                      <input type="radio" name="control-panel-display-mode" checked={displayMode === 'single'} onChange={() => onSetDisplayMode('single')} />
                      <span>Previous frame only</span>
                    </label>
                    <label className="checkbox-label">
                      <input type="radio" name="control-panel-display-mode" checked={displayMode === 'cumulative'} onChange={() => onSetDisplayMode('cumulative')} />
                      <span>All previous frames</span>
                    </label>
                  </fieldset>
                </div>
              </section>

              <section className="control-section sidebar-frame-section control-panel-card">
                <div className="control-section-heading-row">
                  <h3 className="section-title">Frames</h3>
                  <span className="control-section-value">{frames.length}</span>
                </div>
                <Timeline
                  variant="sidebar"
                  currentFrameIndex={currentFrameIndex}
                  frames={frames}
                  unanimatableTransitionIndices={unanimatableTransitionIndices}
                  onFixTransition={onFixTransition}
                  onAddFrame={onAddFrame}
                  onDeleteFrame={onDeleteFrame}
                  onDuplicateFrame={onDuplicateFrame}
                  onRenameFrame={onRenameFrame}
                  onSelectFrame={onSelectFrame}
                />
              </section>
            </div>
          )}

          {section === 'share' && (
            <div id="control-panel-share" role="tabpanel" aria-labelledby="control-tab-share" className="control-panel-view">
              <section className="control-section share-hero-card">
                <h3>Share this situation</h3>
                <p>Create a portable link that includes the current sequence and presentation settings.</p>
                <button type="button" className="share-link-btn" onClick={onShareScenario} disabled={isExporting}>
                  <Share2 aria-hidden="true" size={16} />
                  <span>Copy share link</span>
                </button>
                {shareFeedback && <p className="share-feedback" role="status" aria-live="polite">{shareFeedback}</p>}
              </section>

              <section className="control-section control-panel-card">
                <h3 className="section-title">Files</h3>
                <ExportActions
                  variant="panel"
                  className="share-export-actions"
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
              </section>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
