import { useEffect, useState } from 'react';
import type { SelectedType } from '../hooks/useScenario';
import type { Frame } from '../types';
import { ChevronLeft, ChevronRight, Film, Layers } from 'lucide-react';
import LayerList from './LayerList';
import Timeline from './Timeline';
import styles from './Sidebar.module.css';

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
        className={`${styles.sidebarDrawerHandle}${isOpen ? ` ${styles.isOpen}` : ''}`}
        aria-controls="controls-sidebar"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close frames drawer' : 'Open frames drawer'}
        onClick={onToggle}
      >
        {isOpen ? <ChevronLeft aria-hidden="true" size={16} /> : <ChevronRight aria-hidden="true" size={16} />}
        <span>Frames</span>
      </button>
      <button type="button" className={`${styles.sidebarBackdrop}${isOpen ? ` ${styles.isOpen}` : ''}`} aria-label="Close frames drawer" onClick={onClose} />
      <aside id="controls-sidebar" className={`${styles.stepPanel}${isOpen ? ` ${styles.isOpen}` : ''}`}>
        <div className={`${styles.scenarioTitleEditor} ${styles.sidebarScenarioTitleEditor}`}>
          <label htmlFor="scenario-title">Scenario title</label>
          <input
            id="scenario-title"
            className={styles.scenarioTitleInput}
            type="text"
            value={scenarioTitle}
            placeholder="Untitled situation"
            readOnly={presenterMode}
            onChange={(event) => onScenarioTitleChange(event.target.value)}
            onBlur={(event) => onScenarioTitleChange(event.target.value.trim() || 'Untitled situation')}
          />
        </div>
        {view === 'frames' ? (
          <div className={`${styles.controlSection} ${styles.sidebarFrameSection}`}>
            <h3 className={styles.sectionTitle}><Film aria-hidden="true" size={16} /> Frames</h3>
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
          <div className={styles.sidebarLayersSection}>
            <button type="button" className={styles.sidebarBackBtn} onClick={() => setView('frames')}>
              <ChevronLeft aria-hidden="true" size={16} />
              <span>Back to frames</span>
            </button>
            <div className={styles.sidebarLayersHeading}>
              <h3 className={styles.sectionTitle}><Layers aria-hidden="true" size={16} /> Layers</h3>
              <p className={styles.sidebarLayersFrameName}>{layersFrame?.name}</p>
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
