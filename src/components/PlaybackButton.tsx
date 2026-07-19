interface PlaybackButtonProps {
  isPlaying: boolean;
  currentFrameIndex?: number;
  frameCount?: number;
  onTogglePlaying: () => void;
  onStepBackward?: () => void;
  onStepForward?: () => void;
  onReplayFromStart?: () => void;
  onOpenInspector: () => void;
}

export default function PlaybackButton({
  isPlaying,
  currentFrameIndex = 0,
  frameCount = 1,
  onTogglePlaying,
  onStepBackward = () => undefined,
  onStepForward = () => undefined,
  onReplayFromStart = () => undefined,
  onOpenInspector,
}: PlaybackButtonProps) {
  return (
    <div className="canvas-playback-controls">
      <button
        type="button"
        className="canvas-playback-action-btn"
        aria-label="Step backward"
        title="Step backward"
        onClick={onStepBackward}
        disabled={currentFrameIndex <= 0}
      >
        <span aria-hidden="true">⏮️</span>
      </button>
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
        className="canvas-playback-action-btn"
        aria-label="Step forward"
        title="Step forward"
        onClick={onStepForward}
        disabled={currentFrameIndex >= frameCount - 1}
      >
        <span aria-hidden="true">⏭️</span>
      </button>
      <button
        type="button"
        className="canvas-playback-action-btn canvas-playback-replay-btn"
        aria-label="Replay from start"
        title="Replay from start"
        onClick={onReplayFromStart}
      >
        <span aria-hidden="true">↺</span>
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
