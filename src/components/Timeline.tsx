import type { Frame } from '../types';

interface TimelineProps {
  currentFrameIndex: number;
  frames: Frame[];
  isPlaying: boolean;
  onAddFrame: () => void;
  onDeleteFrame: () => void;
  onDuplicateFrame: () => void;
  onSelectFrame: (index: number) => void;
  onTogglePlaying: () => void;
  playSpeed: number;
  onSetPlaySpeed: (speed: number) => void;
}

export default function Timeline({
  currentFrameIndex,
  frames,
  isPlaying,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  onSelectFrame,
  onTogglePlaying,
  playSpeed,
  onSetPlaySpeed,
}: TimelineProps) {
  return (
    <footer className="timeline-bar">
      <div className="playback-controls">
        <button type="button" className={`play-pause-btn ${isPlaying ? 'playing' : ''}`} onClick={onTogglePlaying}>
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <select className="speed-selector" value={playSpeed} onChange={(event) => onSetPlaySpeed(Number(event.target.value))} aria-label="Playback speed">
          <option value="2000">Slow (2s)</option>
          <option value="1000">Normal (1s)</option>
          <option value="500">Fast (0.5s)</option>
        </select>
        <button type="button" className="timeline-action-btn" onClick={onAddFrame}>➕ Add Frame</button>
        <button type="button" className="timeline-action-btn" onClick={onDuplicateFrame}>📋 Duplicate</button>
        <button type="button" className="timeline-action-btn delete-frame-btn" onClick={onDeleteFrame} disabled={frames.length <= 1}>🗑️ Delete</button>
      </div>
      <div className="frames-scrubber" aria-label="Scenario frames">
        {frames.map((frame, index) => (
          <button
            type="button"
            key={frame.id}
            className={`frame-thumbnail ${index === currentFrameIndex ? 'active' : ''}`}
            onClick={() => onSelectFrame(index)}
            aria-current={index === currentFrameIndex ? 'step' : undefined}
          >
            <span className="thumbnail-num">{index + 1}</span>
            <span className="thumbnail-title">{frame.name}</span>
          </button>
        ))}
      </div>
    </footer>
  );
}
