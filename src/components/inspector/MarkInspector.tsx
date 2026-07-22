import { RotateCcw } from 'lucide-react';
import { DEFAULT_MARK_ZONE_RADIUS, DEFAULT_OBSTRUCTION_PROXIMITY_RADIUS } from '../../constants';
import type { Mark } from '../../types';
import ColorPicker from '../ColorPicker';
import { InspectorTabs } from './InspectorTabs';
import { MarkConnectionsEditor } from './MarkConnectionsEditor';
import type { InspectorView } from './types';
import styles from './Inspector.module.css';

type MarkInspectorProps = Extract<InspectorView, { kind: 'mark' }>;

export function MarkInspector({ activeFrame, mark, updateMark, updateMarkRoomZone, onConnectMarks, onRemoveMarkConnection, onReplaceMarkConnection }: MarkInspectorProps) {
  const rotationDirection = mark.rotationDirection ?? 'counterclockwise';
  const updateRoomZone = (changes: Partial<Pick<Mark, 'showZone' | 'zoneRadius'>>) => {
    (updateMarkRoomZone ?? updateMark)(mark.id, changes);
  };

  return (
    <InspectorTabs
      label="Mark"
      tabs={[
        {
          id: 'settings',
          label: 'Settings',
          content: (
            <div className={styles.editorForm}>
              <div className={styles.formRow}>
                <label htmlFor="mark-name">Name</label>
                <input id="mark-name" type="text" value={mark.name} onChange={(event) => updateMark(mark.id, { name: event.target.value })} />
              </div>
              <div className={styles.formRow}>
                <label htmlFor="mark-color">Color</label>
                <ColorPicker id="mark-color" label="Color" value={mark.color} onChange={(color) => updateMark(mark.id, { color })} />
              </div>
              <div className={styles.formRow}>
                <label htmlFor="mark-shape">Shape</label>
                <select id="mark-shape" value={mark.shape} onChange={(event) => updateMark(mark.id, { shape: event.target.value as Mark['shape'] })}>
                  <option value="circle">Conical (Circle)</option>
                  <option value="triangle">Triangle (Conical/Buoy)</option>
                  <option value="square">Spar (Square)</option>
                  <option value="obstruction">Obstruction</option>
                  <option value="gate">Gate</option>
                  <option value="committeeBoat">Committee boat</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <label htmlFor="mark-size">Mark size ({mark.size ?? (mark.shape === 'obstruction' ? 60 : 28)}px)</label>
                <input id="mark-size" type="range" min="12" max="160" step="1" value={mark.size ?? (mark.shape === 'obstruction' ? 60 : 28)} onChange={(event) => updateMark(mark.id, { size: Number(event.target.value) })} />
              </div>
              {mark.shape === 'obstruction' && (
                <div className={styles.formRow}>
                  <label htmlFor="mark-proximity-radius">Proximity radius ({mark.proximityRadius ?? DEFAULT_OBSTRUCTION_PROXIMITY_RADIUS} boat lengths)</label>
                  <input id="mark-proximity-radius" type="range" min="1" max="8" step="0.5" value={mark.proximityRadius ?? DEFAULT_OBSTRUCTION_PROXIMITY_RADIUS} onChange={(event) => updateMark(mark.id, { proximityRadius: Number(event.target.value) })} />
                  <p className={styles.gridHint}>Default: three boat lengths.</p>
                </div>
              )}
              <div className={`${styles.formRow} ${styles.flexRow}`}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={!!mark.showZone} onChange={(event) => updateRoomZone({ showZone: event.target.checked })} />
                  <span>Show Mark-Room Zone</span>
                </label>
              </div>
              {!!mark.showZone && (
                <div className={styles.formRow}>
                  <label htmlFor="mark-zone-radius">Zone radius ({mark.zoneRadius ?? DEFAULT_MARK_ZONE_RADIUS} boat lengths)</label>
                  <input id="mark-zone-radius" type="range" min="1" max="8" step="0.5" value={mark.zoneRadius ?? DEFAULT_MARK_ZONE_RADIUS} onChange={(event) => updateRoomZone({ zoneRadius: Number(event.target.value) })} />
                  <p className={styles.gridHint}>Default: three boat lengths.</p>
                </div>
              )}
            </div>
          ),
        },
        {
          id: 'rotation',
          label: 'Rotation',
          content: (
            <div className={styles.editorForm}>
              <div className={styles.formRow}>
                <label htmlFor="mark-rotation">Mark rotation ({Math.round(mark.rotation ?? 0)}°)</label>
                <input id="mark-rotation" type="range" min="-180" max="180" value={mark.rotation ?? 0} onChange={(event) => updateMark(mark.id, { rotation: Number(event.target.value) })} />
              </div>
              <div className={`${styles.formRow} ${styles.flexRow}`}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={!!mark.showRotationArrow} onChange={(event) => updateMark(mark.id, { showRotationArrow: event.target.checked })} />
                  <span>Show Rotation Arrow</span>
                </label>
              </div>
              {!!mark.showRotationArrow && (
                <div className={styles.formRow}>
                  <label>Rounding Direction</label>
                  <button id="mark-rotation-direction" type="button" className={styles.directionButton} aria-label={`Reverse direction (${rotationDirection === 'clockwise' ? 'Clockwise' : 'Counterclockwise'})`} onClick={() => updateMark(mark.id, { rotationDirection: rotationDirection === 'clockwise' ? 'counterclockwise' : 'clockwise' })}>
                    <RotateCcw aria-hidden="true" size={16} /> Reverse Direction ({rotationDirection === 'clockwise' ? 'Clockwise' : 'Counterclockwise'})
                  </button>
                </div>
              )}
            </div>
          ),
        },
        {
          id: 'connection',
          label: 'Connection',
          content: <MarkConnectionsEditor activeFrame={activeFrame} mark={mark} onConnectMarks={onConnectMarks} onRemoveMarkConnection={onRemoveMarkConnection} onReplaceMarkConnection={onReplaceMarkConnection} />,
        },
      ]}
    />
  );
}
