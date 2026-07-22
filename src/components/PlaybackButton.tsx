import { Pause, Play, RotateCcw, Settings, SkipBack, SkipForward } from 'lucide-react';
import styles from './Timeline.module.css';

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
        <SkipBack aria-hidden="true" size={16} />
      </button>
      <button
        type="button"
        className={['canvas-play-btn', styles.playPauseButton, isPlaying && styles.playing].filter(Boolean).join(' ')}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause' : 'Play'}
        onClick={onTogglePlaying}
      >
        <span className={styles.timelineControlIcon} aria-hidden="true">{isPlaying ? <Pause size={16} /> : <Play size={16} />}</span>
      </button>
      <button
        type="button"
        className="canvas-playback-action-btn"
        aria-label="Step forward"
        title="Step forward"
        onClick={onStepForward}
        disabled={currentFrameIndex >= frameCount - 1}
      >
        <SkipForward aria-hidden="true" size={16} />
      </button>
      <button
        type="button"
        className="canvas-playback-action-btn canvas-playback-replay-btn"
        aria-label="Replay from start"
        title="Replay from start"
        onClick={onReplayFromStart}
      >
        <RotateCcw aria-hidden="true" size={16} />
      </button>
      <button
        type="button"
        className="canvas-playback-options-btn"
        aria-label="Open playback options"
        title="Open playback options"
        onClick={onOpenInspector}
      >
        <Settings aria-hidden="true" size={16} />
      </button>
    </div>
  );
}
