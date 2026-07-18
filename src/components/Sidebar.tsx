import { useState } from 'react';
import type { Frame, RuleReference, ScenarioRepositoryItem, ScenarioSettings } from '../types';
import ExportActions from './ExportActions';

interface SidebarProps {
  activeFrame: Frame;
  gridSnapEnabled: boolean;
  isExporting: boolean;
  isOpen: boolean;
  onAddRule?: (rule: RuleReference) => void;
  libraryItems?: ScenarioRepositoryItem[];
  onSaveToLibrary?: (title: string) => void;
  onLoadFromLibrary?: (id: string) => void;
  onDeleteFromLibrary?: (id: string) => void;
  onExport: (type: 'gif' | 'mp4') => void;
  onExportImage?: (type: 'png' | 'jpeg') => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onSetGridSnapEnabled: (enabled: boolean) => void;
  onSetShowGrid: (show: boolean) => void;
  onSetSettings?: (changes: Partial<ScenarioSettings>) => void;
  settings?: ScenarioSettings;
  onClose: () => void;
  showGrid: boolean;
  updateActiveFrame: (changes: Partial<Frame>) => void;
}

export default function Sidebar({
  activeFrame,
  gridSnapEnabled,
  isExporting,
  isOpen,
  onAddRule,
  onExport,
  onExportImage,
  onExportJson,
  onImportJson,
  onSetGridSnapEnabled,
  onSetShowGrid,
  onSetSettings,
  libraryItems,
  onSaveToLibrary,
  onLoadFromLibrary,
  onDeleteFromLibrary,
  onClose,
  settings,
  showGrid,
  updateActiveFrame,
}: SidebarProps) {
  const [libraryTitle, setLibraryTitle] = useState('');

  return (
    <>
      <button type="button" className={`sidebar-backdrop${isOpen ? ' is-open' : ''}`} aria-label="Close controls menu" onClick={onClose} />
      <aside id="controls-sidebar" className={`step-panel${isOpen ? ' is-open' : ''}`}>
      <ExportActions
        className="export-actions mobile-export-actions"
        isExporting={isExporting}
        onExport={onExport}
        onExportImage={onExportImage}
        onExportJson={onExportJson}
        onImportJson={onImportJson}
      />
      <div className="control-section">
        <h3 className="section-title">🌬️ Wind Settings</h3>
        <div className="control-row">
          <label htmlFor="wind-direction">
            <span>Direction: {activeFrame.windAngle}°</span>
            <input id="wind-direction" type="range" min="0" max="359" value={activeFrame.windAngle} onChange={(event) => updateActiveFrame({ windAngle: Number(event.target.value) })} />
          </label>
        </div>
        <div className="control-row">
          <label htmlFor="wind-speed">
            <span>Velocity: {activeFrame.windSpeed} kts</span>
            <input id="wind-speed" type="range" min="5" max="30" value={activeFrame.windSpeed} onChange={(event) => updateActiveFrame({ windSpeed: Number(event.target.value) })} />
          </label>
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">🧲 Magnetic Grid</h3>
        <div className="form-row flex-row">
          <label className="checkbox-label">
            <input type="checkbox" checked={gridSnapEnabled} onChange={(event) => onSetGridSnapEnabled(event.target.checked)} />
            <span>Snap boats &amp; marks</span>
          </label>
        </div>
        <div className="form-row flex-row">
          <label className="checkbox-label">
            <input type="checkbox" checked={showGrid} onChange={(event) => onSetShowGrid(event.target.checked)} />
            <span>Show placement grid</span>
          </label>
        </div>
        <p className="grid-hint">40px spacing · drag near an intersection</p>
      </div>

      <div className="control-section">
        <h3 className="section-title">🎬 Presentation</h3>
        <div className="form-row">
          <label htmlFor="animation-mode">Animation mode</label>
          <select id="animation-mode" value={settings?.animationMode ?? 'step'} onChange={(event) => onSetSettings?.({ animationMode: event.target.value as ScenarioSettings['animationMode'] })}>
            <option value="step">Step by step</option>
            <option value="continuous">Continuous</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="display-mode">Frame display</label>
          <select id="display-mode" value={settings?.displayMode ?? 'single'} onChange={(event) => onSetSettings?.({ displayMode: event.target.value as ScenarioSettings['displayMode'] })}>
            <option value="single">Current situation</option>
            <option value="cumulative">Cumulative trail</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="rule-reference">Rules reference</label>
          <select id="rule-reference" defaultValue="" onChange={(event) => {
            const rule = event.target.value;
            if (!rule) return;
            onAddRule?.({ id: rule, label: `RRS ${rule}` });
            event.target.value = '';
          }}>
            <option value="">Add a rule…</option>
            <option value="10">Rule 10 — Opposite tacks</option>
            <option value="11">Rule 11 — Same tack, overlapped</option>
            <option value="12">Rule 12 — Same tack, not overlapped</option>
            <option value="13">Rule 13 — While tacking</option>
            <option value="18">Rule 18 — Mark-room</option>
            <option value="19">Rule 19 — Room to pass an obstruction</option>
          </select>
        </div>
        {!!activeFrame.rules?.length && (
          <div className="rule-list" aria-label="Rules attached to this situation">
            {activeFrame.rules.map((rule) => <span key={`${rule.id}-${rule.label}`} className="rule-chip">{rule.label}</span>)}
          </div>
        )}
      </div>

      <div className="control-section">
        <h3 className="section-title">📚 Scenario library</h3>
        <div className="form-row">
          <label htmlFor="library-title">Save locally</label>
          <input id="library-title" type="text" placeholder="Situation title" value={libraryTitle} onChange={(event) => setLibraryTitle(event.target.value)} />
        </div>
        <button type="button" className="add-btn" onClick={() => { onSaveToLibrary?.(libraryTitle || activeFrame.name); setLibraryTitle(''); }}>Save to library</button>
        {!!libraryItems?.length && <>
          <div className="form-row library-select-row">
            <label htmlFor="library-scenario">Open saved situation</label>
            <select id="library-scenario" defaultValue="" onChange={(event) => { if (event.target.value) onLoadFromLibrary?.(event.target.value); }}>
              <option value="">Choose a scenario…</option>
              {libraryItems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </div>
          <div className="library-items">
            {libraryItems.slice(0, 4).map((item) => <button key={item.id} type="button" className="library-delete" onClick={() => onDeleteFromLibrary?.(item.id)} title={`Delete ${item.title}`}>× {item.title}</button>)}
          </div>
        </>}
      </div>

      </aside>
    </>
  );
}
