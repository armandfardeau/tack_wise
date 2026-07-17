import type { Frame, Boat, Mark } from '../types';
import type { SelectedType } from '../hooks/useScenario';
import ExportActions from './ExportActions';
import Inspector from './Inspector';

interface SidebarProps {
  activeFrame: Frame;
  autoSailTrim: boolean;
  gridSnapEnabled: boolean;
  isExporting: boolean;
  isOpen: boolean;
  onAddBoat: () => void;
  onAddMark: () => void;
  onDeleteSelected: () => void;
  onExport: (type: 'gif' | 'mp4') => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onSetAutoSailTrim: (enabled: boolean) => void;
  onSetGridSnapEnabled: (enabled: boolean) => void;
  onSetShowGrid: (show: boolean) => void;
  onClose: () => void;
  selectedBoat: Boat | undefined;
  selectedMark: Mark | undefined;
  selectedType: SelectedType;
  showGrid: boolean;
  updateActiveFrame: (changes: Partial<Frame>) => void;
  updateBoat: (boatId: string, changes: Partial<Boat>) => void;
  updateMark: (markId: string, changes: Partial<Mark>) => void;
}

export default function Sidebar({
  activeFrame,
  autoSailTrim,
  gridSnapEnabled,
  isExporting,
  isOpen,
  onAddBoat,
  onAddMark,
  onDeleteSelected,
  onExport,
  onExportJson,
  onImportJson,
  onSetAutoSailTrim,
  onSetGridSnapEnabled,
  onSetShowGrid,
  onClose,
  selectedBoat,
  selectedMark,
  selectedType,
  showGrid,
  updateActiveFrame,
  updateBoat,
  updateMark,
}: SidebarProps) {
  return (
    <>
      <button type="button" className={`sidebar-backdrop${isOpen ? ' is-open' : ''}`} aria-label="Close controls menu" onClick={onClose} />
      <aside id="controls-sidebar" className={`step-panel${isOpen ? ' is-open' : ''}`}>
      <ExportActions
        className="export-actions mobile-export-actions"
        isExporting={isExporting}
        onExport={onExport}
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

      <div className="control-section inline-buttons">
        <button type="button" className="add-btn add-boat" onClick={onAddBoat}>⛵ Add Boat</button>
        <button type="button" className="add-btn add-mark" onClick={onAddMark}>📍 Add Mark</button>
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

      <Inspector
        activeFrame={activeFrame}
        autoSailTrim={autoSailTrim}
        onDelete={onDeleteSelected}
        onSetAutoSailTrim={onSetAutoSailTrim}
        selectedBoat={selectedBoat}
        selectedMark={selectedMark}
        selectedType={selectedType}
        updateBoat={updateBoat}
        updateMark={updateMark}
      />
      </aside>
    </>
  );
}
