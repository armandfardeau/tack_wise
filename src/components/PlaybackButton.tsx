import { Pause, Play, RotateCcw, Settings, SkipBack, SkipForward } from 'lucide-react';
import styles from './PlaybackButton.module.css';

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
    <div className={styles.playbackControls}>
      <button
        type="button"
        className={styles.playbackActionButton}
        aria-label="Step backward"
        title="Step backward"
        onClick={onStepBackward}
        disabled={currentFrameIndex <= 0}
      >
        <SkipBack aria-hidden="true" size={16} />
      </button>
      <button
        type="button"
        className={`${styles.playButton} play-pause-btn ${isPlaying ? 'playing' : ''}`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause' : 'Play'}
        onClick={onTogglePlaying}
      >
        <span className="timeline-control-icon" aria-hidden="true">{isPlaying ? <Pause size={16} /> : <Play size={16} />}</span>
      </button>
      <button
        type="button"
        className={styles.playbackActionButton}
        aria-label="Step forward"
        title="Step forward"
        onClick={onStepForward}
        disabled={currentFrameIndex >= frameCount - 1}
      >
        <SkipForward aria-hidden="true" size={16} />
      </button>
      <button
        type="button"
        className={styles.playbackActionButton}
        aria-label="Replay from start"
        title="Replay from start"
        onClick={onReplayFromStart}
      >
        <RotateCcw aria-hidden="true" size={16} />
      </button>
      <button
        type="button"
        className={styles.playbackOptionsButton}
        aria-label="Open playback options"
        title="Open playback options"
        onClick={onOpenInspector}
      >
        <Settings aria-hidden="true" size={16} />
      </button>
    </div>
  );
}
