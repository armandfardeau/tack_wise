import { Pause, Play } from 'lucide-react';
import type { InspectorView } from './types';
import styles from './Inspector.module.css';

type PlaybackInspectorProps = Extract<InspectorView, { kind: 'playback' }>;

export function PlaybackInspector({ isPlaying, onSetPlaySpeed, onTogglePlaying, playSpeed }: PlaybackInspectorProps) {
  return (
    <div className={styles.editorForm}>
      <p className={styles.gridHint}>Playback advances one frame at a time.</p>
      <div className={styles.formRow}>
        <label htmlFor="playback-speed">Playback speed</label>
        <select id="playback-speed" value={playSpeed} onChange={(event) => onSetPlaySpeed(Number(event.target.value))}>
          <option value="5000">Slow (5s)</option>
          <option value="2000">Normal (2s)</option>
          <option value="1000">Fast (1s)</option>
          <option value="500">Very fast (0.5s)</option>
        </select>
      </div>
      <button type="button" className={styles.directionButton} aria-label={isPlaying ? 'Pause playback' : 'Play scenario'} title={isPlaying ? 'Pause playback' : 'Play scenario'} onClick={onTogglePlaying}>
        {isPlaying ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
      </button>
    </div>
  );
}
