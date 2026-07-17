import type { Frame, Boat, Mark } from '../types';
import type { SelectedType } from '../hooks/useScenario';

interface InspectorProps {
  activeFrame: Frame;
  autoSailTrim: boolean;
  onDelete: () => void;
  onSetAutoSailTrim: (enabled: boolean) => void;
  selectedBoat: Boat | undefined;
  selectedMark: Mark | undefined;
  selectedType: SelectedType;
  updateBoat: (boatId: string, changes: Partial<Boat>) => void;
  updateMark: (markId: string, changes: Partial<Mark>) => void;
}

export default function Inspector({
  activeFrame,
  autoSailTrim,
  onDelete,
  onSetAutoSailTrim,
  selectedBoat,
  selectedMark,
  selectedType,
  updateBoat,
  updateMark,
}: InspectorProps) {
  return (
    <div className="control-section inspector">
      <h3 className="section-title">🔍 Inspector</h3>

      {selectedType === 'boat' && selectedBoat ? (
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
            <input id="boat-heading" type="range" min="0" max="359" value={selectedBoat.heading} onChange={(event) => updateBoat(selectedBoat.id, { heading: Number(event.target.value) })} />
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
          <button type="button" className="delete-btn" onClick={onDelete}>🗑️ Delete Boat</button>
        </div>
      ) : selectedType === 'mark' && selectedMark ? (
        <MarkInspector
          activeFrame={activeFrame}
          mark={selectedMark}
          onDelete={onDelete}
          updateMark={updateMark}
        />
      ) : (
        <p className="no-selection">Click a boat or mark on the canvas to inspect and edit its properties.</p>
      )}
    </div>
  );
}

interface MarkInspectorProps {
  activeFrame: Frame;
  mark: Mark;
  onDelete: () => void;
  updateMark: (markId: string, changes: Partial<Mark>) => void;
}

function MarkInspector({ activeFrame, mark, onDelete, updateMark }: MarkInspectorProps) {
  const otherMarks = activeFrame.marks.filter((candidate) => candidate.id !== mark.id);

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
        </select>
      </div>
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
      <button type="button" className="delete-btn" onClick={onDelete}>🗑️ Delete Mark</button>
    </div>
  );
}
