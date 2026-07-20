import { useId, useRef, useState, type ReactNode } from 'react';
import { getRuleReferences, type CommentNote, type DiagramImage, type DisplayMode, type Frame, type FrameComment, type Boat, type Mark, type MarkConnection, type RuleComment, type RuleOffenseTarget, type RuleReference, type TacticalArrow } from '../types';
import type { SelectedType } from '../hooks/useScenario';
import { ensureCurvedArrowControlPoint, toTacticalArrowPoints } from '../utils/arrows';
import { DEFAULT_MARK_ZONE_RADIUS, DEFAULT_OBSTRUCTION_PROXIMITY_RADIUS } from '../constants';
import { getMarkConnectionAnchors } from '../utils/markConnections';
import { Copy, Pencil, Pause, Play, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';

const QUICK_HEADING_ANGLES = [0, 45, 90, 135, 180, -135, -90, -45] as const;
const SPEECH_BUBBLE_PRESETS = [
  { emoji: '😀', label: 'Happy' },
  { emoji: '😬', label: 'Nervous' },
  { emoji: '😎', label: 'Confident' },
  { emoji: '😮', label: 'Surprised' },
  { emoji: '😡', label: 'Frustrated' },
  { emoji: '👍', label: 'Agree' },
] as const;
const COMMON_RULE_REFERENCES: RuleReference[] = [
  { id: 'rrs-10', label: 'RRS 10' },
  { id: 'rrs-11', label: 'RRS 11' },
  { id: 'rrs-12', label: 'RRS 12' },
  { id: 'rrs-13', label: 'RRS 13' },
  { id: 'rrs-14', label: 'RRS 14' },
  { id: 'rrs-15', label: 'RRS 15' },
  { id: 'rrs-16', label: 'RRS 16' },
  { id: 'rrs-17', label: 'RRS 17' },
  { id: 'rrs-18', label: 'RRS 18' },
];

function formatAngle(angle: number) {
  return `${angle > 0 && angle !== 180 ? '+' : ''}${angle}°`;
}

function getConnectionName(frame: Frame, connection: MarkConnection) {
  const getMarkName = (markId: string) => frame.marks.find((mark) => mark.id === markId)?.name || 'Unnamed mark';
  return `Connection: ${getMarkName(connection.start.markId)} → ${getMarkName(connection.end.markId)}`;
}

interface InspectorProps {
  activeFrame: Frame;
  autoSailTrim: boolean;
  displayMode?: DisplayMode;
  gridSnapEnabled: boolean;
  isPlaying?: boolean;
  onDelete: () => void;
  onDuplicate?: () => void;
  onClose?: () => void;
  onSetGridSnapEnabled: (enabled: boolean) => void;
  onSetAutoSailTrim: (enabled: boolean) => void;
  onSetDisplayMode?: (mode: DisplayMode) => void;
  onSetShowFrameTitle?: (show: boolean) => void;
  onSetShowFrameNumber?: (show: boolean) => void;
  onSetShowGrid: (show: boolean) => void;
  onTogglePlaying?: () => void;
  onSetPlaySpeed?: (speed: number) => void;
  playSpeed?: number;
  selectedBoat: Boat | undefined;
  selectedMark: Mark | undefined;
  selectedConnection?: MarkConnection;
  selectedArrow?: TacticalArrow;
  selectedComment?: FrameComment;
  selectedImage?: DiagramImage;
  selectedType: SelectedType;
  showGrid: boolean;
  showFrameTitle?: boolean;
  showFrameNumber?: boolean;
  updateBoat: (boatId: string, changes: Partial<Boat>) => void;
  updateActiveFrame: (changes: Partial<Frame>) => void;
  updateMark: (markId: string, changes: Partial<Mark>) => void;
  onConnectMarks?: (sourceMarkId: string, targetMarkId: string, anchors?: { start?: { x: number; y: number }; end?: { x: number; y: number } }) => void;
  onRemoveMarkConnection?: (connectionId: string) => void;
  onReplaceMarkConnection?: (connectionId: string, nextTargetMarkId: string) => void;
  updateConnection?: (connectionId: string, changes: Partial<MarkConnection>) => void;
  updateArrow?: (arrowId: string, changes: Partial<TacticalArrow>) => void;
  updateComment?: (commentId: string, changes: Partial<CommentNote>) => void;
  updateRuleComment?: (commentId: string, changes: Partial<RuleComment>) => void;
  updateImage?: (imageId: string, changes: Partial<DiagramImage>) => void;
}

export default function Inspector({
  activeFrame,
  autoSailTrim,
  displayMode = 'single',
  gridSnapEnabled,
  isPlaying = false,
  onDelete,
  onDuplicate = () => undefined,
  onClose = () => undefined,
  onSetGridSnapEnabled,
  onSetAutoSailTrim,
  onSetDisplayMode = () => undefined,
  onSetShowFrameTitle = () => undefined,
  onSetShowFrameNumber = () => undefined,
  onSetShowGrid,
  onTogglePlaying = () => undefined,
  onSetPlaySpeed = () => undefined,
  playSpeed = 2000,
  selectedBoat,
  selectedMark,
  selectedConnection,
  selectedArrow,
  selectedComment,
  selectedImage,
  selectedType,
  showGrid,
  showFrameTitle = true,
  showFrameNumber = true,
  updateBoat,
  updateActiveFrame,
  updateMark,
  onConnectMarks,
  onRemoveMarkConnection,
  onReplaceMarkConnection,
  updateConnection,
  updateArrow,
  updateComment,
  updateRuleComment,
  updateImage,
}: InspectorProps) {
  const deletableObject =
    selectedType === 'boat' && selectedBoat ? 'Boat' :
      selectedType === 'mark' && selectedMark ? 'Mark' :
        selectedType === 'connection' && selectedConnection ? 'Connection' :
          selectedType === 'arrow' && selectedArrow ? 'Arrow' :
          selectedType === 'comment' && selectedComment ? 'Comment' :
            selectedType === 'image' && selectedImage ? 'Image' :
              null;

  const objectName = selectedType === 'boat' && selectedBoat ? `Boat: ${selectedBoat.name || 'Unnamed boat'}` :
    selectedType === 'mark' && selectedMark ? `Mark: ${selectedMark.name || 'Unnamed mark'}` :
      selectedType === 'connection' && selectedConnection ? getConnectionName(activeFrame, selectedConnection) :
        selectedType === 'arrow' && selectedArrow ? `Arrow: ${selectedArrow.name || 'Unnamed arrow'}` :
          selectedType === 'comment' && selectedComment ? `${selectedComment.type === 'rule' ? 'Rule' : 'Comment'}: ${selectedComment.name || (selectedComment.type === 'rule' ? 'Unnamed rule' : 'Unnamed comment')}` :
            selectedType === 'image' && selectedImage ? `Image: ${selectedImage.name || 'Unnamed image'}` :
              selectedType === 'wind' ? 'Wind settings' :
                selectedType === 'grid' ? 'Canvas settings' :
                  selectedType === 'playback' ? 'Playback settings' :
                    null;

  return (
    <div className="control-section inspector">
      <h3 className="section-title inspector-drag-handle" title="Drag to move inspector" aria-label={objectName ? `Inspector for ${objectName}` : 'Inspector'}>
        <span className="inspector-title-content"><Search aria-hidden="true" size={16} /><span>Inspector</span>{objectName && <span className="inspector-object-name" title={objectName}>{objectName}</span>}</span>
        <span className="inspector-actions">
          {deletableObject && (
            <>
              <button
                type="button"
                className="inspector-duplicate-btn"
                aria-label={`Duplicate ${deletableObject}`}
                title={`Duplicate ${deletableObject}`}
                onClick={onDuplicate}
              >
                <Copy aria-hidden="true" size={16} />
              </button>
              <button
                type="button"
                className="inspector-delete-btn"
                aria-label={`Delete ${deletableObject}`}
                title={`Delete ${deletableObject}`}
                onClick={onDelete}
              >
                <Trash2 aria-hidden="true" size={16} />
              </button>
            </>
          )}
          <button
            type="button"
            className="inspector-close-btn"
            aria-label="Close inspector"
            title="Close inspector (Esc)"
            onClick={onClose}
          >
            <X aria-hidden="true" size={16} />
          </button>
        </span>
      </h3>

      {selectedType === 'wind' ? (
        <WindInspector activeFrame={activeFrame} updateActiveFrame={updateActiveFrame} />
      ) : selectedType === 'grid' ? (
        <CanvasSettingsInspector
          displayMode={displayMode}
          gridSnapEnabled={gridSnapEnabled}
          onSetGridSnapEnabled={onSetGridSnapEnabled}
          onSetDisplayMode={onSetDisplayMode}
          onSetShowFrameTitle={onSetShowFrameTitle}
          onSetShowFrameNumber={onSetShowFrameNumber}
          onSetShowGrid={onSetShowGrid}
          showFrameTitle={showFrameTitle}
          showFrameNumber={showFrameNumber}
          showGrid={showGrid}
        />
      ) : selectedType === 'playback' ? (
        <PlaybackInspector
          isPlaying={isPlaying}
          onSetPlaySpeed={onSetPlaySpeed}
          onTogglePlaying={onTogglePlaying}
          playSpeed={playSpeed}
        />
      ) : selectedType === 'boat' && selectedBoat ? (
        <BoatInspector
          autoSailTrim={autoSailTrim}
          boat={selectedBoat}
          onSetAutoSailTrim={onSetAutoSailTrim}
          updateBoat={updateBoat}
        />
      ) : selectedType === 'mark' && selectedMark ? (
        <MarkInspector
          activeFrame={activeFrame}
          mark={selectedMark}
          updateMark={updateMark}
          onConnectMarks={onConnectMarks}
          onRemoveMarkConnection={onRemoveMarkConnection}
          onReplaceMarkConnection={onReplaceMarkConnection}
        />
      ) : selectedType === 'connection' && selectedConnection && updateConnection ? (
        <ConnectionInspector activeFrame={activeFrame} connection={selectedConnection} updateConnection={updateConnection} />
      ) : selectedType === 'arrow' && selectedArrow && updateArrow ? (
        <ArrowInspector arrow={selectedArrow} updateArrow={updateArrow} />
      ) : selectedType === 'comment' && selectedComment?.type === 'rule' && updateRuleComment ? (
        <RuleCommentInspector
          activeFrame={activeFrame}
          comment={selectedComment}
          updateRuleComment={updateRuleComment}
        />
      ) : selectedType === 'comment' && selectedComment && selectedComment.type !== 'rule' && updateComment ? (
        <CommentInspector comment={selectedComment} updateComment={updateComment} />
      ) : selectedType === 'image' && selectedImage && updateImage ? (
        <ImageInspector image={selectedImage} updateImage={updateImage} />
      ) : (
        <p className="no-selection">Click an object or the wind indicator on the canvas to inspect and edit its properties.</p>
      )}
    </div>
  );
}

interface InspectorTabDefinition {
  id: string;
  label: string;
  content: ReactNode;
}

function InspectorTabs({ label, tabs }: { label: string; tabs: readonly InspectorTabDefinition[] }) {
  const tabId = useId();
  const tabButtonRefs = useRef<Partial<Record<string, HTMLButtonElement>>>({});
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');
  const activeTabDefinition = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  if (!activeTabDefinition) return null;

  return (
    <div className="inspector-tabbed-section">
      <div className="inspector-tabs" role="tablist" aria-label={`${label} sections`}>
        {tabs.map((tab, index) => {
          const tabPanelId = `${tabId}-${tab.id}-panel`;
          const buttonId = `${tabId}-${tab.id}-tab`;

          return (
            <button
              key={tab.id}
              ref={(button) => {
                if (button) tabButtonRefs.current[tab.id] = button;
              }}
              type="button"
              id={buttonId}
              className="inspector-tab"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={tabPanelId}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => {
                const nextIndex = event.key === 'ArrowRight' || event.key === 'ArrowDown'
                  ? (index + 1) % tabs.length
                  : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                    ? (index - 1 + tabs.length) % tabs.length
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? tabs.length - 1
                        : -1;

                if (nextIndex < 0) return;

                event.preventDefault();
                const nextTab = tabs[nextIndex];
                setActiveTab(nextTab.id);
                tabButtonRefs.current[nextTab.id]?.focus();
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        id={`${tabId}-${activeTabDefinition.id}-panel`}
        className="inspector-tab-panel"
        role="tabpanel"
        aria-labelledby={`${tabId}-${activeTabDefinition.id}-tab`}
        tabIndex={0}
      >
        {activeTabDefinition.content}
      </div>
    </div>
  );
}

function BoatInspector({
  autoSailTrim,
  boat,
  onSetAutoSailTrim,
  updateBoat,
}: {
  autoSailTrim: boolean;
  boat: Boat;
  onSetAutoSailTrim: (enabled: boolean) => void;
  updateBoat: (boatId: string, changes: Partial<Boat>) => void;
}) {
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
                <label htmlFor="boat-color">Color</label>
                <input id="boat-color" type="color" value={boat.color} onChange={(event) => updateBoat(boat.id, { color: event.target.value })} />
              </div>
              <div className="form-row flex-row">
                <label className="checkbox-label">
                  <input type="checkbox" checked={autoSailTrim} onChange={(event) => onSetAutoSailTrim(event.target.checked)} />
                  <span>Auto Sail Trim</span>
                </label>
              </div>
              {!autoSailTrim && (
                <div className="form-row">
                  <label htmlFor="boat-sail-angle">Sail Angle ({boat.sailAngle}°)</label>
                  <input id="boat-sail-angle" type="range" min="-90" max="90" value={boat.sailAngle} onChange={(event) => updateBoat(boat.id, { sailAngle: Number(event.target.value) })} />
                </div>
              )}
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
                <textarea
                  id="boat-speech-bubble"
                  value={boat.speechBubble ?? ''}
                  rows={2}
                  placeholder="Share info from this boat"
                  onChange={(event) => updateBoat(boat.id, { speechBubble: event.target.value })}
                />
                <div className="speech-bubble-presets" aria-label="Feeling presets">
                  {SPEECH_BUBBLE_PRESETS.map(({ emoji, label }) => (
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
                  {boat.speechBubble && (
                    <button
                      type="button"
                      className="speech-bubble-clear"
                      onClick={() => updateBoat(boat.id, { speechBubble: '' })}
                    >
                      Clear
                    </button>
                  )}
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

function WindInspector({ activeFrame, updateActiveFrame }: { activeFrame: Frame; updateActiveFrame: (changes: Partial<Frame>) => void }) {
  return (
    <div className="editor-form">
      <div className="form-row">
        <label htmlFor="wind-direction">Direction ({activeFrame.windAngle}°)</label>
        <input id="wind-direction" type="range" min="0" max="359" value={activeFrame.windAngle} onChange={(event) => updateActiveFrame({ windAngle: Number(event.target.value) })} />
      </div>
      <div className="form-row">
        <label htmlFor="wind-speed">Velocity ({activeFrame.windSpeed} kts)</label>
        <input id="wind-speed" type="range" min="5" max="30" value={activeFrame.windSpeed} onChange={(event) => updateActiveFrame({ windSpeed: Number(event.target.value) })} />
      </div>
    </div>
  );
}

function CanvasSettingsInspector({
  displayMode,
  gridSnapEnabled,
  onSetDisplayMode,
  onSetShowFrameTitle,
  onSetShowFrameNumber,
  onSetGridSnapEnabled,
  onSetShowGrid,
  showFrameTitle,
  showFrameNumber,
  showGrid,
}: {
  displayMode: DisplayMode;
  gridSnapEnabled: boolean;
  onSetDisplayMode: (mode: DisplayMode) => void;
  onSetShowFrameTitle: (show: boolean) => void;
  onSetShowFrameNumber: (show: boolean) => void;
  onSetGridSnapEnabled: (enabled: boolean) => void;
  onSetShowGrid: (show: boolean) => void;
  showFrameTitle: boolean;
  showFrameNumber: boolean;
  showGrid: boolean;
}) {
  return (
    <InspectorTabs
      label="Canvas settings"
      tabs={[
        {
          id: 'grid',
          label: 'Magnetic Grid',
          content: (
            <div className="editor-form">
              <div className="form-row flex-row">
                <label className="checkbox-label">
                  <input type="checkbox" checked={gridSnapEnabled} onChange={(event) => onSetGridSnapEnabled(event.target.checked)} />
                  <span>Snap boats &amp; marks</span>
                </label>
              </div>
              <div className="form-row flex-row">
                <label className="checkbox-label">
                  <input type="checkbox" checked={showGrid} onChange={(event) => onSetShowGrid(event.target.checked)} />
                  <span>Show placement grid</span>
                </label>
              </div>
              <p className="grid-hint">20px spacing · drag near an intersection</p>
            </div>
          ),
        },
        {
          id: 'header',
          label: 'Frame Header',
          content: (
            <div className="editor-form">
              <div className="form-row flex-row">
                <label className="checkbox-label">
                  <input type="checkbox" checked={showFrameTitle} onChange={(event) => onSetShowFrameTitle(event.target.checked)} />
                  <span>Show frame title</span>
                </label>
              </div>
              <div className="form-row flex-row">
                <label className="checkbox-label">
                  <input type="checkbox" checked={showFrameNumber} onChange={(event) => onSetShowFrameNumber(event.target.checked)} />
                  <span>Show frame number</span>
                </label>
              </div>
            </div>
          ),
        },
        {
          id: 'ghosts',
          label: 'Ghost Display',
          content: (
            <div className="editor-form">
              <p className="grid-hint">Show earlier frames as translucent ghosts on the canvas.</p>
              <div className="form-row flex-row">
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="ghost-display-mode"
                    value="single"
                    checked={displayMode === 'single'}
                    onChange={() => onSetDisplayMode('single')}
                  />
                  <span>Previous frame only</span>
                </label>
              </div>
              <div className="form-row flex-row">
                <label className="checkbox-label">
                  <input
                    type="radio"
                    name="ghost-display-mode"
                    value="cumulative"
                    checked={displayMode === 'cumulative'}
                    onChange={() => onSetDisplayMode('cumulative')}
                  />
                  <span>All previous frames</span>
                </label>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}

function PlaybackInspector({
  isPlaying,
  onSetPlaySpeed,
  onTogglePlaying,
  playSpeed,
}: {
  isPlaying: boolean;
  onSetPlaySpeed: (speed: number) => void;
  onTogglePlaying: () => void;
  playSpeed: number;
}) {
  return (
    <div className="editor-form">
      <p className="grid-hint">Playback advances one frame at a time.</p>
      <div className="form-row">
        <label htmlFor="playback-speed">Playback speed</label>
        <select id="playback-speed" value={playSpeed} onChange={(event) => onSetPlaySpeed(Number(event.target.value))}>
          <option value="5000">Slow (5s)</option>
          <option value="2000">Normal (2s)</option>
          <option value="1000">Fast (1s)</option>
          <option value="500">Very fast (0.5s)</option>
        </select>
      </div>
      <button
        type="button"
        className="direction-btn"
        aria-label={isPlaying ? 'Pause playback' : 'Play scenario'}
        title={isPlaying ? 'Pause playback' : 'Play scenario'}
        onClick={onTogglePlaying}
      >
        {isPlaying ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
      </button>
    </div>
  );
}

interface MarkInspectorProps {
  activeFrame: Frame;
  mark: Mark;
  updateMark: (markId: string, changes: Partial<Mark>) => void;
  onConnectMarks?: (sourceMarkId: string, targetMarkId: string, anchors?: { start?: { x: number; y: number }; end?: { x: number; y: number } }) => void;
  onRemoveMarkConnection?: (connectionId: string) => void;
  onReplaceMarkConnection?: (connectionId: string, nextTargetMarkId: string) => void;
}

function MarkInspector({ activeFrame, mark, updateMark, onConnectMarks, onRemoveMarkConnection, onReplaceMarkConnection }: MarkInspectorProps) {
  const otherMarks = activeFrame.marks.filter((candidate) => candidate.id !== mark.id);
  const rotationDirection = mark.rotationDirection ?? 'counterclockwise';
  const connections = (activeFrame.connections ?? []).filter((connection) => connection.start.markId === mark.id);
  const connectedTargetIds = connections.map((connection) => connection.end.markId);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const availableTargets = otherMarks.filter((candidate) => !connectedTargetIds.includes(candidate.id));

  const addConnection = (targetMarkId: string) => {
    onConnectMarks?.(mark.id, targetMarkId);
    setIsAddingConnection(false);
  };

  const removeConnection = (connectionId: string) => {
    onRemoveMarkConnection?.(connectionId);
    if (editingConnectionId === connectionId) setEditingConnectionId(null);
  };

  const replaceConnection = (connectionId: string, nextTargetMarkId: string) => {
    onReplaceMarkConnection?.(connectionId, nextTargetMarkId);
    setEditingConnectionId(null);
  };

  return (
    <InspectorTabs
      label="Mark"
      tabs={[
        {
          id: 'settings',
          label: 'Settings',
          content: (
            <div className="editor-form">
              <div className="form-row">
                <label htmlFor="mark-name">Name</label>
                <input id="mark-name" type="text" value={mark.name} onChange={(event) => updateMark(mark.id, { name: event.target.value })} />
              </div>
              <div className="form-row">
                <label htmlFor="mark-color">Color</label>
                <input id="mark-color" type="color" value={mark.color} onChange={(event) => updateMark(mark.id, { color: event.target.value })} />
              </div>
              <div className="form-row">
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
              <div className="form-row">
                <label htmlFor="mark-size">Mark size ({mark.size ?? (mark.shape === 'obstruction' ? 60 : 28)}px)</label>
                <input
                  id="mark-size"
                  type="range"
                  min="12"
                  max="160"
                  step="1"
                  value={mark.size ?? (mark.shape === 'obstruction' ? 60 : 28)}
                  onChange={(event) => updateMark(mark.id, { size: Number(event.target.value) })}
                />
              </div>
              {mark.shape === 'obstruction' && (
                <div className="form-row">
                  <label htmlFor="mark-proximity-radius">Proximity radius ({mark.proximityRadius ?? DEFAULT_OBSTRUCTION_PROXIMITY_RADIUS} boat lengths)</label>
                  <input
                    id="mark-proximity-radius"
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    value={mark.proximityRadius ?? DEFAULT_OBSTRUCTION_PROXIMITY_RADIUS}
                    onChange={(event) => updateMark(mark.id, { proximityRadius: Number(event.target.value) })}
                  />
                  <p className="grid-hint">Default: three boat lengths.</p>
                </div>
              )}
              <div className="form-row flex-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!mark.showZone}
                    onChange={(event) => updateMark(mark.id, { showZone: event.target.checked })}
                  />
                  <span>Show Mark-Room Zone</span>
                </label>
              </div>
              {!!mark.showZone && (
                <div className="form-row">
                  <label htmlFor="mark-zone-radius">Zone radius ({mark.zoneRadius ?? DEFAULT_MARK_ZONE_RADIUS} boat lengths)</label>
                  <input
                    id="mark-zone-radius"
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    value={mark.zoneRadius ?? DEFAULT_MARK_ZONE_RADIUS}
                    onChange={(event) => updateMark(mark.id, { zoneRadius: Number(event.target.value) })}
                  />
                  <p className="grid-hint">Default: three boat lengths.</p>
                </div>
              )}
            </div>
          ),
        },
        {
          id: 'rotation',
          label: 'Rotation',
          content: (
            <div className="editor-form">
              <div className="form-row">
                <label htmlFor="mark-rotation">Mark rotation ({Math.round(mark.rotation ?? 0)}°)</label>
                <input
                  id="mark-rotation"
                  type="range"
                  min="-180"
                  max="180"
                  value={mark.rotation ?? 0}
                  onChange={(event) => updateMark(mark.id, { rotation: Number(event.target.value) })}
                />
              </div>
              <div className="form-row flex-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!mark.showRotationArrow}
                    onChange={(event) => updateMark(mark.id, { showRotationArrow: event.target.checked })}
                  />
                  <span>Show Rotation Arrow</span>
                </label>
              </div>
              {!!mark.showRotationArrow && (
                <div className="form-row">
                  <label>Rounding Direction</label>
                  <button
                    id="mark-rotation-direction"
                    type="button"
                    className="direction-btn"
                    aria-label={`Reverse direction (${rotationDirection === 'clockwise' ? 'Clockwise' : 'Counterclockwise'})`}
                    onClick={() => updateMark(mark.id, {
                      rotationDirection: rotationDirection === 'clockwise' ? 'counterclockwise' : 'clockwise',
                    })}
                  >
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
          content: (
            <div className="editor-form">
              <div className="connection-list-heading">
                <span className="connection-section-label">Connect to</span>
                <button
                  type="button"
                  className="connection-add-btn"
                  aria-label="Add connection"
                  disabled={availableTargets.length === 0}
                  onClick={() => setIsAddingConnection(true)}
                >
                  <Plus aria-hidden="true" size={14} /> Add
                </button>
              </div>
              {connections.length === 0 && !isAddingConnection && (
                <p className="connection-empty">No connected marks.</p>
              )}
              <div className="connection-list" aria-label="Mark connections">
                {connections.map((connection) => {
                  const targetMark = otherMarks.find((candidate) => candidate.id === connection.end.markId);
                  const targetName = targetMark?.name ?? 'Missing mark';
                  const isEditing = editingConnectionId === connection.id;
                  const editOptions = otherMarks.filter((candidate) => candidate.id === connection.end.markId || !connectedTargetIds.includes(candidate.id));

                  return (
                    <div className="connection-row" key={connection.id}>
                      {isEditing ? (
                        <select
                          aria-label={`Edit connection to ${targetName}`}
                          value={connection.end.markId}
                          onChange={(event) => replaceConnection(connection.id, event.target.value)}
                        >
                          {editOptions.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                        </select>
                      ) : (
                        <span className="connection-target-name">{targetName}</span>
                      )}
                      <button
                        type="button"
                        className="connection-row-btn"
                        aria-label={`Edit connection to ${targetName}`}
                        title="Edit connection"
                        onClick={() => setEditingConnectionId(isEditing ? null : connection.id)}
                      >
                        <Pencil aria-hidden="true" size={14} />
                      </button>
                      <button
                        type="button"
                        className="connection-row-btn connection-row-delete-btn"
                        aria-label={`Delete connection to ${targetName}`}
                        title="Delete connection"
                        onClick={() => removeConnection(connection.id)}
                      >
                        <Trash2 aria-hidden="true" size={14} />
                      </button>
                    </div>
                  );
                })}
                {isAddingConnection && (
                  <div className="connection-row connection-add-row">
                    <select
                      aria-label="New connection target"
                      defaultValue=""
                      onChange={(event) => {
                        if (event.target.value) addConnection(event.target.value);
                      }}
                    >
                      <option value="">Select a mark…</option>
                      {availableTargets.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                    </select>
                    <button
                      type="button"
                      className="connection-row-btn"
                      aria-label="Cancel adding connection"
                      title="Cancel"
                      onClick={() => setIsAddingConnection(false)}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}

function ConnectionInspector({
  activeFrame,
  connection,
  updateConnection,
}: {
  activeFrame: Frame;
  connection: MarkConnection;
  updateConnection: (connectionId: string, changes: Partial<MarkConnection>) => void;
}) {
  const sourceMark = activeFrame.marks.find((mark) => mark.id === connection.start.markId);
  const targetMark = activeFrame.marks.find((mark) => mark.id === connection.end.markId);
  const targetOptions = activeFrame.marks.filter((mark) => mark.id !== connection.start.markId);
  const sourceOptions = activeFrame.marks.filter((mark) => mark.id !== connection.end.markId);

  return (
    <div className="editor-form">
      <div className="form-row">
        <label htmlFor="connection-source">From</label>
        <select
          id="connection-source"
          value={connection.start.markId}
          onChange={(event) => {
            const nextSourceMark = activeFrame.marks.find((mark) => mark.id === event.target.value);
            const nextTargetMark = activeFrame.marks.find((mark) => mark.id === connection.end.markId);
            if (!nextSourceMark || !nextTargetMark) return;
            updateConnection(connection.id, {
              start: { ...connection.start, markId: event.target.value, anchor: getMarkConnectionAnchors(nextSourceMark, nextTargetMark).start },
            });
          }}
        >
          {sourceOptions.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="connection-target">To</label>
        <select
          id="connection-target"
          value={connection.end.markId}
          onChange={(event) => {
            const nextSourceMark = activeFrame.marks.find((mark) => mark.id === connection.start.markId);
            const nextTargetMark = activeFrame.marks.find((mark) => mark.id === event.target.value);
            if (!nextSourceMark || !nextTargetMark) return;
            updateConnection(connection.id, {
              end: { ...connection.end, markId: event.target.value, anchor: getMarkConnectionAnchors(nextSourceMark, nextTargetMark).end },
            });
          }}
        >
          {targetOptions.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="connection-line-color">Line Color</label>
        <input id="connection-line-color" type="color" value={connection.color ?? sourceMark?.color ?? '#38bdf8'} onChange={(event) => updateConnection(connection.id, { color: event.target.value })} />
      </div>
      <div className="form-row">
        <label htmlFor="connection-line-style">Line Style</label>
        <select id="connection-line-style" value={connection.style ?? 'dotted'} onChange={(event) => updateConnection(connection.id, { style: event.target.value as MarkConnection['style'] })}>
          <option value="dotted">Dotted</option>
          <option value="dashed">Dashed</option>
          <option value="solid">Solid</option>
        </select>
      </div>
      <div className="form-row flex-row">
        <label className="checkbox-label">
          <input type="checkbox" checked={connection.arrowhead === true} onChange={(event) => updateConnection(connection.id, { arrowhead: event.target.checked })} />
          <span>Show arrowhead</span>
        </label>
      </div>
      <p className="grid-hint">{sourceMark?.name ?? 'Missing mark'} → {targetMark?.name ?? 'Missing mark'}</p>
    </div>
  );
}

function ArrowInspector({ arrow, updateArrow }: { arrow: TacticalArrow; updateArrow: (id: string, changes: Partial<TacticalArrow>) => void }) {
  const handleCurvedChange = (curved: boolean) => {
    updateArrow(arrow.id, {
      curved,
      points: curved
        ? ensureCurvedArrowControlPoint(arrow.points)
        : arrow.points.length > 2
          ? toTacticalArrowPoints([arrow.points[0], arrow.points[arrow.points.length - 1]]) ?? arrow.points
          : arrow.points,
    });
  };

  return (
    <InspectorTabs
      label="Arrow"
      tabs={[
        {
          id: 'settings',
          label: 'Settings',
          content: (
            <div className="editor-form">
              <div className="form-row"><label htmlFor="arrow-name">Name</label><input id="arrow-name" type="text" value={arrow.name} onChange={(event) => updateArrow(arrow.id, { name: event.target.value })} /></div>
              <div className="form-row"><label htmlFor="arrow-color">Color</label><input id="arrow-color" type="color" value={arrow.color} onChange={(event) => updateArrow(arrow.id, { color: event.target.value })} /></div>
              <div className="form-row"><label htmlFor="arrow-width">Line width ({arrow.lineWidth ?? 3}px)</label><input id="arrow-width" type="range" min="1" max="12" value={arrow.lineWidth ?? 3} onChange={(event) => updateArrow(arrow.id, { lineWidth: Number(event.target.value) })} /></div>
              <div className="form-row"><label htmlFor="arrow-style">Line style</label><select id="arrow-style" value={arrow.lineStyle ?? 'solid'} onChange={(event) => updateArrow(arrow.id, { lineStyle: event.target.value as TacticalArrow['lineStyle'] })}><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></div>
            </div>
          ),
        },
        {
          id: 'display',
          label: 'Display',
          content: (
            <div className="editor-form">
              <div className="form-row flex-row"><label className="checkbox-label"><input type="checkbox" checked={!!arrow.curved} onChange={(event) => handleCurvedChange(event.target.checked)} /><span>Curved arrow</span></label></div>
              <div className="form-row flex-row"><label className="checkbox-label"><input type="checkbox" checked={arrow.showArrowhead !== false} onChange={(event) => updateArrow(arrow.id, { showArrowhead: event.target.checked })} /><span>Show arrowhead</span></label></div>
            </div>
          ),
        },
      ]}
    />
  );
}

function RuleCommentInspector({
  activeFrame,
  comment,
  updateRuleComment,
}: {
  activeFrame: Frame;
  comment: RuleComment;
  updateRuleComment: (id: string, changes: Partial<RuleComment>) => void;
}) {
  const [ruleSearch, setRuleSearch] = useState('');
  const ruleOptions = Array.from(new Map(
    [...COMMON_RULE_REFERENCES, ...(activeFrame.rules ?? []), ...getRuleReferences(comment)]
      .map((rule) => [rule.id, rule] as const),
  ).values());
  const selectedRuleIds = getRuleReferences(comment).map((rule) => rule.id);
  const normalizedRuleSearch = ruleSearch.trim().toLowerCase();
  const visibleRuleOptions = ruleOptions.filter((rule) => (
    selectedRuleIds.includes(rule.id)
    || !normalizedRuleSearch
    || `${rule.label} ${rule.description ?? ''}`.toLowerCase().includes(normalizedRuleSearch)
  ));

  const updateRules = (selectedIds: string[]) => {
    updateRuleComment(comment.id, {
      rules: ruleOptions.filter((rule) => selectedIds.includes(rule.id)),
    });
  };

  const offenseOptions: Array<RuleOffenseTarget & { name: string }> = [
    ...activeFrame.boats.map((boat) => ({ id: boat.id, type: 'boat' as const, name: boat.name })),
    ...activeFrame.marks.map((mark) => ({ id: mark.id, type: 'mark' as const, name: mark.name })),
  ];
  const offenseKey = (target: RuleOffenseTarget) => `${target.type}:${target.id}`;
  const selectedOffenseKeys = new Set(comment.offenseTargets.map(offenseKey));
  const getOffenseName = (target: RuleOffenseTarget) => offenseOptions.find((option) => offenseKey(option) === offenseKey(target))?.name ?? target.id;

  const addOffense = (key: string) => {
    const target = offenseOptions.find((option) => offenseKey(option) === key);
    if (!target || selectedOffenseKeys.has(key)) return;

    updateRuleComment(comment.id, {
      offenseTargets: [...comment.offenseTargets, { id: target.id, type: target.type, color: '#ef4444' }],
    });
  };

  const removeOffense = (target: RuleOffenseTarget) => {
    updateRuleComment(comment.id, {
      offenseTargets: comment.offenseTargets.filter((candidate) => offenseKey(candidate) !== offenseKey(target)),
    });
  };

  const updateOffenseColor = (target: RuleOffenseTarget, color: string) => {
    updateRuleComment(comment.id, {
      offenseTargets: comment.offenseTargets.map((candidate) => (
        offenseKey(candidate) === offenseKey(target) ? { ...candidate, color } : candidate
      )),
    });
  };

  return (
    <div className="editor-form">
      <div className="form-row"><label htmlFor="rule-comment-name">Name</label><input id="rule-comment-name" type="text" value={comment.name} onChange={(event) => updateRuleComment(comment.id, { name: event.target.value })} /></div>
      <div className="form-row">
        <label htmlFor="rule-reference">Rule references</label>
        <input
          id="rule-reference-search"
          type="search"
          value={ruleSearch}
          placeholder="Search rules"
          aria-label="Search rule references"
          onChange={(event) => setRuleSearch(event.target.value)}
        />
        <select
          id="rule-reference"
          multiple
          size={Math.min(Math.max(visibleRuleOptions.length, 4), 8)}
          value={selectedRuleIds}
          onChange={(event) => updateRules(Array.from(event.target.selectedOptions, (option) => option.value))}
        >
          {visibleRuleOptions.map((rule) => <option key={rule.id} value={rule.id}>{rule.label}</option>)}
        </select>
        <p className="grid-hint">Select one or more rules.</p>
      </div>
      <div className="form-row"><label htmlFor="rule-comment-color">Highlight color</label><input id="rule-comment-color" type="color" value={comment.color} onChange={(event) => updateRuleComment(comment.id, { color: event.target.value })} /></div>
      <div className="form-row"><label htmlFor="rule-comment-size">Font size ({comment.fontSize ?? 14}px)</label><input id="rule-comment-size" type="range" min="10" max="32" value={comment.fontSize ?? 14} onChange={(event) => updateRuleComment(comment.id, { fontSize: Number(event.target.value) })} /></div>
      <div className="inspector-subsection">
        <h4 className="inspector-subsection-title">Highlight offending objects</h4>
        <div className="rule-offense-list">
          {comment.offenseTargets.map((target) => (
            <div className="rule-offense-row" key={offenseKey(target)}>
              <span className="rule-offense-name">{getOffenseName(target)}</span>
              <input
                type="color"
                value={target.color ?? '#ef4444'}
                aria-label={`Color for ${getOffenseName(target)}`}
                onChange={(event) => updateOffenseColor(target, event.target.value)}
              />
              <button
                type="button"
                className="rule-offense-remove"
                aria-label={`Remove offending object ${getOffenseName(target)}`}
                onClick={() => removeOffense(target)}
              >
                <X aria-hidden="true" size={14} />
              </button>
            </div>
          ))}
          {comment.offenseTargets.length === 0 && <p className="grid-hint">No offending objects highlighted yet.</p>}
        </div>
        <div className="rule-offense-add">
          <select
            id="rule-offense-add"
            defaultValue=""
            aria-label="Add offending object"
            onChange={(event) => {
              addOffense(event.target.value);
              event.currentTarget.value = '';
            }}
          >
            <option value="">Add offending object…</option>
            {offenseOptions.filter((target) => !selectedOffenseKeys.has(offenseKey(target))).map((target) => (
              <option key={offenseKey(target)} value={offenseKey(target)}>{target.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function CommentInspector({ comment, updateComment }: { comment: CommentNote; updateComment: (id: string, changes: Partial<CommentNote>) => void }) {
  return (
    <InspectorTabs
      label="Comment"
      tabs={[
        {
          id: 'content',
          label: 'Content',
          content: (
            <div className="editor-form">
              <div className="form-row"><label htmlFor="comment-name">Name</label><input id="comment-name" type="text" value={comment.name} onChange={(event) => updateComment(comment.id, { name: event.target.value })} /></div>
              <div className="form-row"><label htmlFor="comment-text">Text</label><textarea id="comment-text" value={comment.text} rows={4} onChange={(event) => updateComment(comment.id, { text: event.target.value })} /></div>
            </div>
          ),
        },
        {
          id: 'display',
          label: 'Display',
          content: (
            <div className="editor-form">
              <div className="form-row"><label htmlFor="comment-color">Text color</label><input id="comment-color" type="color" value={comment.color} onChange={(event) => updateComment(comment.id, { color: event.target.value })} /></div>
              <div className="form-row"><label htmlFor="comment-size">Font size ({comment.fontSize ?? 14}px)</label><input id="comment-size" type="range" min="10" max="32" value={comment.fontSize ?? 14} onChange={(event) => updateComment(comment.id, { fontSize: Number(event.target.value) })} /></div>
            </div>
          ),
        },
      ]}
    />
  );
}

function ImageInspector({ image, updateImage }: { image: DiagramImage; updateImage: (id: string, changes: Partial<DiagramImage>) => void }) {
  return (
    <InspectorTabs
      label="Image"
      tabs={[
        {
          id: 'settings',
          label: 'Settings',
          content: (
            <div className="editor-form">
              <div className="form-row"><label htmlFor="image-name">Name</label><input id="image-name" type="text" value={image.name} onChange={(event) => updateImage(image.id, { name: event.target.value })} /></div>
              <div className="form-row"><label htmlFor="image-width">Width ({image.width}px)</label><input id="image-width" type="range" min="40" max="800" value={image.width} onChange={(event) => updateImage(image.id, { width: Number(event.target.value) })} /></div>
            </div>
          ),
        },
        {
          id: 'display',
          label: 'Display',
          content: (
            <div className="editor-form">
              <div className="form-row"><label htmlFor="image-rotation">Rotation ({image.rotation ?? 0}°)</label><input id="image-rotation" type="range" min="0" max="359" value={image.rotation ?? 0} onChange={(event) => updateImage(image.id, { rotation: Number(event.target.value) })} /></div>
            </div>
          ),
        },
      ]}
    />
  );
}
