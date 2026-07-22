import type { Boat } from '../../types';
import ColorPicker from '../ColorPicker';
import { InspectorTabs } from './InspectorTabs';
import type { InspectorView } from './types';
import styles from './Inspector.module.css';

const QUICK_HEADING_ANGLES = [0, 45, 90, 135, 180, -135, -90, -45] as const;
const SPEECH_BUBBLE_PRESETS = [
  { emoji: '😀', label: 'Happy' },
  { emoji: '😬', label: 'Nervous' },
  { emoji: '😎', label: 'Confident' },
  { emoji: '😮', label: 'Surprised' },
  { emoji: '😡', label: 'Frustrated' },
  { emoji: '👍', label: 'Agree' },
] as const;
const FLAG_EMOJI_PRESETS = [
  { emoji: '🟥', label: 'Red flag' },
  { emoji: '🟩', label: 'Green flag' },
  { emoji: '🟨', label: 'Yellow flag' },
  { emoji: '🏴', label: 'Black flag' },
  { emoji: '🏁', label: 'Start flag' },
] as const;

type BoatInspectorProps = Extract<InspectorView, { kind: 'boat' }>;

function formatAngle(angle: number) {
  return `${angle > 0 && angle !== 180 ? '+' : ''}${angle}°`;
}

export function BoatInspector({ autoSailTrim, boat, onSetAutoSailTrim, updateBoat }: BoatInspectorProps) {
  return (
    <InspectorTabs
      label="Boat"
      tabs={[
        {
          id: 'heading',
          label: 'Heading',
          content: (
            <div className={styles.editorForm}>
              <div className={styles.formRow}>
                <label htmlFor="boat-heading">Heading ({boat.heading}°)</label>
                <input id="boat-heading" type="range" min="-360" max="360" value={boat.heading} onChange={(event) => updateBoat(boat.id, { heading: Number(event.target.value) })} />
                <div className={styles.quickAngleDial} aria-label="Quick heading angles">
                  {QUICK_HEADING_ANGLES.map((angle) => (
                    <button
                      key={angle}
                      type="button"
                      className={styles.quickAngleButton}
                      aria-pressed={boat.heading === angle}
                      title={`Set heading to ${formatAngle(angle)}`}
                      style={{
                        left: `${50 + Math.sin((angle * Math.PI) / 180) * 35}%`,
                        top: `${50 - Math.cos((angle * Math.PI) / 180) * 35}%`,
                      }}
                      onClick={() => updateBoat(boat.id, { heading: angle })}
                    >
                      {formatAngle(angle)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'settings',
          label: 'Settings',
          content: (
            <div className={styles.editorForm}>
              <div className={styles.formRow}>
                <label htmlFor="boat-name">Name</label>
                <input id="boat-name" type="text" value={boat.name} onChange={(event) => updateBoat(boat.id, { name: event.target.value })} />
              </div>
              <div className={styles.formRow}>
                <label htmlFor="boat-type">Boat type</label>
                <select id="boat-type" value={boat.type ?? 'racing'} onChange={(event) => updateBoat(boat.id, { type: event.target.value as Boat['type'] })}>
                  <option value="racing">Racing sailboat</option>
                  <option value="judge">Judge boat</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <label htmlFor="boat-color">Color</label>
                <ColorPicker id="boat-color" label="Color" value={boat.color} onChange={(color) => updateBoat(boat.id, { color })} />
              </div>
              {boat.type !== 'judge' && (
                <>
                  <div className={`${styles.formRow} ${styles.flexRow}`}>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={autoSailTrim} onChange={(event) => onSetAutoSailTrim(event.target.checked)} />
                      <span>Auto Sail Trim</span>
                    </label>
                  </div>
                  {!autoSailTrim && (
                    <div className={styles.formRow}>
                      <label htmlFor="boat-sail-angle">Sail Angle ({boat.sailAngle}°)</label>
                      <input id="boat-sail-angle" type="range" min="-110" max="110" value={boat.sailAngle} onChange={(event) => updateBoat(boat.id, { sailAngle: Number(event.target.value) })} />
                    </div>
                  )}
                </>
              )}
              {boat.type === 'judge' && <p className={styles.gridHint}>Judge boats are powered craft and keep their course while the timeline plays.</p>}
            </div>
          ),
        },
        {
          id: 'display',
          label: 'Display',
          content: (
            <div className={styles.editorForm}>
              <div className={`${styles.formRow} ${styles.flexRow}`}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={!!boat.showHeadingLine} onChange={(event) => updateBoat(boat.id, { showHeadingLine: event.target.checked })} />
                  <span>Show Dotted Path Line</span>
                </label>
              </div>
              <div className={styles.formRow}>
                <label htmlFor="boat-speech-bubble">Comic bubble</label>
                <textarea id="boat-speech-bubble" value={boat.speechBubble ?? ''} rows={2} placeholder="Share info from this boat" onChange={(event) => updateBoat(boat.id, { speechBubble: event.target.value })} />
                <div className={styles.speechBubblePresets} aria-label="Feeling presets">
                  {SPEECH_BUBBLE_PRESETS.map(({ emoji, label }) => (
                    <button key={emoji} type="button" className={styles.speechBubblePreset} aria-label={`Use ${label} feeling`} title={label} onClick={() => updateBoat(boat.id, { speechBubble: emoji })}>{emoji}</button>
                  ))}
                </div>
                <div className={styles.speechBubblePresets} aria-label="Flag presets">
                  {FLAG_EMOJI_PRESETS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      type="button"
                      className={styles.speechBubblePreset}
                      aria-label={`Use ${label} feeling`}
                      title={label}
                      onClick={() => updateBoat(boat.id, { speechBubble: emoji })}
                    >
                      {emoji}
                    </button>
                  ))}
                  {boat.speechBubble && <button type="button" className={styles.speechBubbleClear} onClick={() => updateBoat(boat.id, { speechBubble: '' })}>Clear</button>}
                </div>
                <p className={styles.gridHint}>Type a message or pick a feeling.</p>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
