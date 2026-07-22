import type { InspectorView } from './types';
import styles from './Inspector.module.css';

type WindInspectorProps = Extract<InspectorView, { kind: 'wind' }>;

export function WindInspector({ activeFrame, updateActiveFrame }: WindInspectorProps) {
  return (
    <div className={styles.editorForm}>
      <div className={styles.formRow}>
        <label htmlFor="wind-direction">Direction ({activeFrame.windAngle}°)</label>
        <input id="wind-direction" type="range" min="0" max="359" value={activeFrame.windAngle} onChange={(event) => updateActiveFrame({ windAngle: Number(event.target.value) })} />
      </div>
      <div className={styles.formRow}>
        <label htmlFor="wind-speed">Velocity ({activeFrame.windSpeed} kts)</label>
        <input id="wind-speed" type="range" min="5" max="30" value={activeFrame.windSpeed} onChange={(event) => updateActiveFrame({ windSpeed: Number(event.target.value) })} />
      </div>
    </div>
  );
}
