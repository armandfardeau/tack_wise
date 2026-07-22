import { useEffect, useState } from 'react';
import type { SelectedType } from '../hooks/useScenario';
import type { Frame } from '../types';
import { ChevronLeft, ChevronRight, Film, Layers } from 'lucide-react';
import LayerList from './LayerList';
import Timeline from './Timeline';

type SidebarView = 'frames' | 'layers';

interface SidebarProps {
  currentFrameIndex: number;
  frames: Frame[];
  scenarioTitle: string;
  onScenarioTitleChange: (title: string) => void;
  presenterMode?: boolean;
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
}

export default function Sidebar({
  currentFrameIndex,
  frames,
  scenarioTitle,
  onScenarioTitleChange,
  presenterMode = false,
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
}: SidebarProps) {
  const [view, setView] = useState<SidebarView>('frames');
  const [layersFrameIndex, setLayersFrameIndex] = useState(currentFrameIndex);
  const layersFrame = frames[layersFrameIndex] ?? frames[currentFrameIndex] ?? frames[0];

  useEffect(() => {
    if (!frames[layersFrameIndex]) setLayersFrameIndex(currentFrameIndex);
  }, [currentFrameIndex, frames, layersFrameIndex]);

  useEffect(() => {
    if (isOpen) setView('frames');
  }, [isOpen]);

  const openLayers = (frameIndex: number) => {
    onSelectFrame(frameIndex);
    setLayersFrameIndex(frameIndex);
    setView('layers');
  };

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
        {isOpen ? <ChevronLeft aria-hidden="true" size={16} /> : <ChevronRight aria-hidden="true" size={16} />}
        <span>Frames</span>
      </button>
      <button type="button" className={`sidebar-backdrop${isOpen ? ' is-open' : ''}`} aria-label="Close frames drawer" onClick={onClose} />
      <aside id="controls-sidebar" className={`step-panel${isOpen ? ' is-open' : ''}`}>
        <div className="scenario-title-editor sidebar-scenario-title-editor">
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
        </div>
        {view === 'frames' ? (
          <div className="control-section sidebar-frame-section">
            <h3 className="section-title"><Film aria-hidden="true" size={16} /> Frames</h3>
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
              onOpenLayers={openLayers}
            />
          </div>
        ) : (
          <div className="sidebar-layers-section">
            <button type="button" className="sidebar-back-btn" onClick={() => setView('frames')}>
              <ChevronLeft aria-hidden="true" size={16} />
              <span>Back to frames</span>
            </button>
            <div className="sidebar-layers-heading">
              <h3 className="section-title"><Layers aria-hidden="true" size={16} /> Layers</h3>
              <p className="sidebar-layers-frame-name">{layersFrame?.name}</p>
            </div>
            {layersFrame && <LayerList
              activeFrame={layersFrame}
              onOpenInspector={onOpenInspector}
              selectedId={selectedId}
              selectedType={selectedType}
            />}
          </div>
        )}
      </aside>
    </>
  );
}
