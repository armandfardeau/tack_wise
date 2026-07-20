import type { CommentNote, DiagramImage, DisplayMode, Frame, Boat, Mark, TacticalArrow } from '../types';
import type { SelectedType } from '../hooks/useScenario';
import { ensureCurvedArrowControlPoint } from '../utils/arrows';
import { Pause, Play, RotateCcw, Search, Trash2 } from 'lucide-react';

interface InspectorProps {
  activeFrame: Frame;
  autoSailTrim: boolean;
  displayMode?: DisplayMode;
  gridSnapEnabled: boolean;
  isPlaying?: boolean;
  onDelete: () => void;
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
  selectedArrow?: TacticalArrow;
  selectedComment?: CommentNote;
  selectedImage?: DiagramImage;
  selectedType: SelectedType;
  showGrid: boolean;
  showFrameTitle?: boolean;
  showFrameNumber?: boolean;
  updateBoat: (boatId: string, changes: Partial<Boat>) => void;
  updateActiveFrame: (changes: Partial<Frame>) => void;
  updateMark: (markId: string, changes: Partial<Mark>) => void;
  updateArrow?: (arrowId: string, changes: Partial<TacticalArrow>) => void;
  updateComment?: (commentId: string, changes: Partial<CommentNote>) => void;
  updateImage?: (imageId: string, changes: Partial<DiagramImage>) => void;
}

export default function Inspector({
  activeFrame,
  autoSailTrim,
  displayMode = 'single',
  gridSnapEnabled,
  isPlaying = false,
  onDelete,
  onSetGridSnapEnabled,
  onSetAutoSailTrim,
  onSetDisplayMode = () => undefined,
  onSetShowFrameTitle = () => undefined,
  onSetShowFrameNumber = () => undefined,
  onSetShowGrid,
  onTogglePlaying = () => undefined,
  onSetPlaySpeed = () => undefined,
  playSpeed = 1000,
  selectedBoat,
  selectedMark,
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
  updateArrow,
  updateComment,
  updateImage,
}: InspectorProps) {
  const deletableObject =
    selectedType === 'boat' && selectedBoat ? 'Boat' :
      selectedType === 'mark' && selectedMark ? 'Mark' :
        selectedType === 'arrow' && selectedArrow ? 'Arrow' :
          selectedType === 'comment' && selectedComment ? 'Comment' :
            selectedType === 'image' && selectedImage ? 'Image' :
              null;

  return (
    <div className="control-section inspector">
      <h3 className="section-title inspector-drag-handle" title="Drag to move inspector">
        <span className="inspector-title-content"><Search aria-hidden="true" size={16} /> Inspector</span>
        {deletableObject && (
          <button
            type="button"
            className="inspector-delete-btn"
            aria-label={`Delete ${deletableObject}`}
            title={`Delete ${deletableObject}`}
            onClick={onDelete}
          >
            <Trash2 aria-hidden="true" size={16} />
          </button>
        )}
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
        <div className="editor-form">
          <div className="form-row">
            <label htmlFor="boat-name">Name</label>
            <input id="boat-name" type="text" value={selectedBoat.name} onChange={(event) => updateBoat(selectedBoat.id, { name: event.target.value })} />
          </div>
          <div className="form-row">
            <label htmlFor="boat-color">Color</label>
            <input id="boat-color" type="color" value={selectedBoat.color} onChange={(event) => updateBoat(selectedBoat.id, { color: event.target.value })} />
          </div>
          <div className="form-row">
            <label htmlFor="boat-heading">Heading ({selectedBoat.heading}°)</label>
            <input id="boat-heading" type="range" min="-360" max="360" value={selectedBoat.heading} onChange={(event) => updateBoat(selectedBoat.id, { heading: Number(event.target.value) })} />
          </div>
          <div className="form-row flex-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={autoSailTrim} onChange={(event) => onSetAutoSailTrim(event.target.checked)} />
              <span>Auto Sail Trim</span>
            </label>
          </div>
          {!autoSailTrim && (
            <div className="form-row">
              <label htmlFor="boat-sail-angle">Sail Angle ({selectedBoat.sailAngle}°)</label>
              <input id="boat-sail-angle" type="range" min="-90" max="90" value={selectedBoat.sailAngle} onChange={(event) => updateBoat(selectedBoat.id, { sailAngle: Number(event.target.value) })} />
            </div>
          )}
          <div className="form-row flex-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={!!selectedBoat.showHeadingLine} onChange={(event) => updateBoat(selectedBoat.id, { showHeadingLine: event.target.checked })} />
              <span>Show Dotted Path Line</span>
            </label>
          </div>
        </div>
      ) : selectedType === 'mark' && selectedMark ? (
        <MarkInspector
          activeFrame={activeFrame}
          mark={selectedMark}
          updateMark={updateMark}
        />
      ) : selectedType === 'arrow' && selectedArrow && updateArrow ? (
        <ArrowInspector arrow={selectedArrow} updateArrow={updateArrow} />
      ) : selectedType === 'comment' && selectedComment && updateComment ? (
        <CommentInspector comment={selectedComment} updateComment={updateComment} />
      ) : selectedType === 'image' && selectedImage && updateImage ? (
        <ImageInspector image={selectedImage} updateImage={updateImage} />
      ) : (
        <p className="no-selection">Click an object or the wind indicator on the canvas to inspect and edit its properties.</p>
      )}
    </div>
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
    <div className="editor-form">
      <div className="inspector-subsection">
        <h4 className="inspector-subsection-title">Magnetic Grid</h4>
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
      <div className="inspector-subsection">
        <h4 className="inspector-subsection-title">Frame Header</h4>
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
      <div className="inspector-subsection">
        <h4 className="inspector-subsection-title">Ghost Display</h4>
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
    </div>
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
          <option value="2000">Slow (2s)</option>
          <option value="1000">Normal (1s)</option>
          <option value="500">Fast (0.5s)</option>
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
}

function MarkInspector({ activeFrame, mark, updateMark }: MarkInspectorProps) {
  const otherMarks = activeFrame.marks.filter((candidate) => candidate.id !== mark.id);
  const rotationDirection = mark.rotationDirection ?? 'counterclockwise';

  const toggleConnection = (enabled: boolean) => {
    if (!enabled) {
      updateMark(mark.id, { connectedToMarkId: null });
      return;
    }

    updateMark(mark.id, {
      connectedToMarkId: otherMarks[0]?.id ?? null,
      connectionLineColor: mark.connectionLineColor ?? mark.color,
      connectionLineStyle: mark.connectionLineStyle ?? 'dotted',
    });
  };

  return (
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
        </select>
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
      <div className="form-row flex-row">
        <label className="checkbox-label">
          <input type="checkbox" checked={!!mark.connectedToMarkId} disabled={activeFrame.marks.length <= 1} onChange={(event) => toggleConnection(event.target.checked)} />
          <span>Show Dotted Line to Mark</span>
        </label>
      </div>
      {!!mark.connectedToMarkId && (
        <>
          <div className="form-row">
            <label htmlFor="mark-connection-target">Connect to</label>
            <select id="mark-connection-target" value={mark.connectedToMarkId} onChange={(event) => updateMark(mark.id, { connectedToMarkId: event.target.value })}>
              {otherMarks.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="mark-line-color">Line Color</label>
            <input id="mark-line-color" type="color" value={mark.connectionLineColor ?? mark.color} onChange={(event) => updateMark(mark.id, { connectionLineColor: event.target.value })} />
          </div>
          <div className="form-row">
            <label htmlFor="mark-line-style">Line Style</label>
            <select id="mark-line-style" value={mark.connectionLineStyle ?? 'dotted'} onChange={(event) => updateMark(mark.id, { connectionLineStyle: event.target.value as Mark['connectionLineStyle'] })}>
              <option value="dotted">Dotted</option>
              <option value="dashed">Dashed</option>
              <option value="solid">Solid</option>
            </select>
          </div>
        </>
      )}
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
          ? [arrow.points[0], arrow.points[arrow.points.length - 1]]
          : arrow.points,
    });
  };

  return (
    <div className="editor-form">
      <div className="form-row"><label htmlFor="arrow-name">Name</label><input id="arrow-name" type="text" value={arrow.name} onChange={(event) => updateArrow(arrow.id, { name: event.target.value })} /></div>
      <div className="form-row"><label htmlFor="arrow-color">Color</label><input id="arrow-color" type="color" value={arrow.color} onChange={(event) => updateArrow(arrow.id, { color: event.target.value })} /></div>
      <div className="form-row"><label htmlFor="arrow-width">Line width ({arrow.lineWidth ?? 3}px)</label><input id="arrow-width" type="range" min="1" max="12" value={arrow.lineWidth ?? 3} onChange={(event) => updateArrow(arrow.id, { lineWidth: Number(event.target.value) })} /></div>
      <div className="form-row"><label htmlFor="arrow-style">Line style</label><select id="arrow-style" value={arrow.lineStyle ?? 'solid'} onChange={(event) => updateArrow(arrow.id, { lineStyle: event.target.value as TacticalArrow['lineStyle'] })}><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></div>
      <div className="form-row flex-row"><label className="checkbox-label"><input type="checkbox" checked={!!arrow.curved} onChange={(event) => handleCurvedChange(event.target.checked)} /><span>Curved arrow</span></label></div>
      <div className="form-row flex-row"><label className="checkbox-label"><input type="checkbox" checked={arrow.showArrowhead !== false} onChange={(event) => updateArrow(arrow.id, { showArrowhead: event.target.checked })} /><span>Show arrowhead</span></label></div>
    </div>
  );
}

function CommentInspector({ comment, updateComment }: { comment: CommentNote; updateComment: (id: string, changes: Partial<CommentNote>) => void }) {
  return (
    <div className="editor-form">
      <div className="form-row"><label htmlFor="comment-name">Name</label><input id="comment-name" type="text" value={comment.name} onChange={(event) => updateComment(comment.id, { name: event.target.value })} /></div>
      <div className="form-row"><label htmlFor="comment-text">Text</label><textarea id="comment-text" value={comment.text} rows={4} onChange={(event) => updateComment(comment.id, { text: event.target.value })} /></div>
      <div className="form-row"><label htmlFor="comment-color">Text color</label><input id="comment-color" type="color" value={comment.color} onChange={(event) => updateComment(comment.id, { color: event.target.value })} /></div>
      <div className="form-row"><label htmlFor="comment-size">Font size ({comment.fontSize ?? 14}px)</label><input id="comment-size" type="range" min="10" max="32" value={comment.fontSize ?? 14} onChange={(event) => updateComment(comment.id, { fontSize: Number(event.target.value) })} /></div>
    </div>
  );
}

function ImageInspector({ image, updateImage }: { image: DiagramImage; updateImage: (id: string, changes: Partial<DiagramImage>) => void }) {
  return (
    <div className="editor-form">
      <div className="form-row"><label htmlFor="image-name">Name</label><input id="image-name" type="text" value={image.name} onChange={(event) => updateImage(image.id, { name: event.target.value })} /></div>
      <div className="form-row"><label htmlFor="image-width">Width ({image.width}px)</label><input id="image-width" type="range" min="40" max="800" value={image.width} onChange={(event) => updateImage(image.id, { width: Number(event.target.value) })} /></div>
      <div className="form-row"><label htmlFor="image-rotation">Rotation ({image.rotation ?? 0}°)</label><input id="image-rotation" type="range" min="0" max="359" value={image.rotation ?? 0} onChange={(event) => updateImage(image.id, { rotation: Number(event.target.value) })} /></div>
    </div>
  );
}
