import type { Boat } from '../../types';
import ColorPicker from '../ColorPicker';
import { InspectorTabs } from './InspectorTabs';
import type { InspectorView } from './types';

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
            <div className="editor-form">
              <div className="form-row">
                <label htmlFor="boat-heading">Heading ({boat.heading}°)</label>
                <input id="boat-heading" type="range" min="-360" max="360" value={boat.heading} onChange={(event) => updateBoat(boat.id, { heading: Number(event.target.value) })} />
                <div className="quick-angle-dial" aria-label="Quick heading angles">
                  {QUICK_HEADING_ANGLES.map((angle) => (
                    <button
                      key={angle}
                      type="button"
                      className={`quick-angle-button quick-angle-button-${angle < 0 ? `negative-${Math.abs(angle)}` : angle}`}
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
            <div className="editor-form">
              <div className="form-row">
                <label htmlFor="boat-name">Name</label>
                <input id="boat-name" type="text" value={boat.name} onChange={(event) => updateBoat(boat.id, { name: event.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="boat-type">Boat type</label>
                <select id="boat-type" value={boat.type ?? 'racing'} onChange={(event) => updateBoat(boat.id, { type: event.target.value as Boat['type'] })}>
                  <option value="racing">Racing sailboat</option>
                  <option value="judge">Judge boat</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="boat-color">Color</label>
                <ColorPicker id="boat-color" label="Color" value={boat.color} onChange={(color) => updateBoat(boat.id, { color })} />
              </div>
              {boat.type !== 'judge' && (
                <>
                  <div className="form-row flex-row">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={autoSailTrim} onChange={(event) => onSetAutoSailTrim(event.target.checked)} />
                      <span>Auto Sail Trim</span>
                    </label>
                  </div>
                  {!autoSailTrim && (
                    <div className="form-row">
                      <label htmlFor="boat-sail-angle">Sail Angle ({boat.sailAngle}°)</label>
                      <input id="boat-sail-angle" type="range" min="-110" max="110" value={boat.sailAngle} onChange={(event) => updateBoat(boat.id, { sailAngle: Number(event.target.value) })} />
                    </div>
                  )}
                </>
              )}
              {boat.type === 'judge' && <p className="grid-hint">Judge boats are powered craft and keep their course while the timeline plays.</p>}
            </div>
          ),
        },
        {
          id: 'display',
          label: 'Display',
          content: (
            <div className="editor-form">
              <div className="form-row flex-row">
                <label className="checkbox-label">
                  <input type="checkbox" checked={!!boat.showHeadingLine} onChange={(event) => updateBoat(boat.id, { showHeadingLine: event.target.checked })} />
                  <span>Show Dotted Path Line</span>
                </label>
              </div>
              <div className="form-row">
                <label htmlFor="boat-speech-bubble">Comic bubble</label>
                <textarea id="boat-speech-bubble" value={boat.speechBubble ?? ''} rows={2} placeholder="Share info from this boat" onChange={(event) => updateBoat(boat.id, { speechBubble: event.target.value })} />
                <div className="speech-bubble-presets" aria-label="Feeling presets">
                  {SPEECH_BUBBLE_PRESETS.map(({ emoji, label }) => (
                    <button key={emoji} type="button" className="speech-bubble-preset" aria-label={`Use ${label} feeling`} title={label} onClick={() => updateBoat(boat.id, { speechBubble: emoji })}>{emoji}</button>
                  ))}
                  {boat.speechBubble && <button type="button" className="speech-bubble-clear" onClick={() => updateBoat(boat.id, { speechBubble: '' })}>Clear</button>}
                </div>
                <div className="speech-bubble-presets speech-bubble-flag-presets" aria-label="Flag presets">
                  {FLAG_EMOJI_PRESETS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      type="button"
                      className="speech-bubble-preset"
                      aria-label={`Use ${label} feeling`}
                      title={label}
                      onClick={() => updateBoat(boat.id, { speechBubble: emoji })}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <p className="grid-hint">Type a message or pick a feeling. Leave it blank to hide the bubble.</p>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
