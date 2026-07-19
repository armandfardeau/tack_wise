import type { Frame } from '../types';
import ExportActions from './ExportActions';
import Timeline from './Timeline';

interface SidebarProps {
  currentFrameIndex: number;
  frames: Frame[];
  isExporting: boolean;
  isOpen: boolean;
  onAddFrame: () => void;
  onDeleteFrame: (frameIndex: number) => void;
  onDuplicateFrame: (frameIndex: number) => void;
  onExport: (type: 'gif' | 'mp4') => void;
  onExportImage?: (type: 'png' | 'jpeg') => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onRenameFrame: (frameIndex: number, name: string) => void;
  onSelectFrame: (index: number) => void;
  onToggle: () => void;
  onClose: () => void;
}

export default function Sidebar({
  currentFrameIndex,
  frames,
  isExporting,
  isOpen,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  onExport,
  onExportImage,
  onExportJson,
  onImportJson,
  onRenameFrame,
  onSelectFrame,
  onToggle,
  onClose,
}: SidebarProps) {
  return (
    <>
      <button
        type="button"
        className={`sidebar-drawer-handle${isOpen ? ' is-open' : ''}`}
        aria-controls="controls-sidebar"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close frames drawer' : 'Open frames drawer'}
        onClick={onToggle}
      >
        <span aria-hidden="true">{isOpen ? '‹' : '›'}</span>
        <span>Frames</span>
      </button>
      <button type="button" className={`sidebar-backdrop${isOpen ? ' is-open' : ''}`} aria-label="Close frames drawer" onClick={onClose} />
      <aside id="controls-sidebar" className={`step-panel${isOpen ? ' is-open' : ''}`}>
      <ExportActions
        className="export-actions mobile-export-actions"
        isExporting={isExporting}
        onExport={onExport}
        onExportImage={onExportImage}
        onExportJson={onExportJson}
        onImportJson={onImportJson}
      />
      <div className="control-section sidebar-frame-section">
        <h3 className="section-title">🎞️ Frames</h3>
        <Timeline
          variant="sidebar"
          currentFrameIndex={currentFrameIndex}
          frames={frames}
          onAddFrame={onAddFrame}
          onDeleteFrame={onDeleteFrame}
          onDuplicateFrame={onDuplicateFrame}
          onRenameFrame={onRenameFrame}
          onSelectFrame={onSelectFrame}
        />
      </div>
      </aside>
    </>
  );
}
