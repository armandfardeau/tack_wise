interface PlaybackButtonProps {
  isPlaying: boolean;
  onTogglePlaying: () => void;
  onOpenInspector: () => void;
}

export default function PlaybackButton({ isPlaying, onTogglePlaying, onOpenInspector }: PlaybackButtonProps) {
  return (
    <div className="canvas-playback-controls">
      <button
        type="button"
        className={`play-pause-btn canvas-play-btn ${isPlaying ? 'playing' : ''}`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause' : 'Play'}
        onClick={onTogglePlaying}
      >
        <span className="timeline-control-icon" aria-hidden="true">{isPlaying ? '⏸️' : '▶️'}</span>
        <span className="timeline-control-label">{isPlaying ? 'Pause' : 'Play'}</span>
      </button>
      <button
        type="button"
        className="canvas-playback-options-btn"
        aria-label="Open playback options"
        title="Open playback options"
        onClick={onOpenInspector}
      >
        ⚙️
      </button>
    </div>
  );
}
