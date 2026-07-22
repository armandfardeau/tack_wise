import { getMarkConnectionAnchors } from '../../utils/markConnections';
import ColorPicker from '../ColorPicker';
import type { InspectorView } from './types';

type ConnectionInspectorProps = Extract<InspectorView, { kind: 'connection' }>;

export function ConnectionInspector({ activeFrame, connection, updateConnection }: ConnectionInspectorProps) {
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
        <ColorPicker id="connection-line-color" label="Line Color" value={connection.color ?? sourceMark?.color ?? '#38bdf8'} onChange={(color) => updateConnection(connection.id, { color })} />
      </div>
      <div className="form-row">
        <label htmlFor="connection-line-style">Line Style</label>
        <select id="connection-line-style" value={connection.style ?? 'dotted'} onChange={(event) => updateConnection(connection.id, { style: event.target.value as typeof connection.style })}>
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
