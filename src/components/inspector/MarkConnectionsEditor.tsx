import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { InspectorView } from './types';
import styles from './Inspector.module.css';

type MarkConnectionEditorProps = Pick<Extract<InspectorView, { kind: 'mark' }>, 'activeFrame' | 'mark' | 'onConnectMarks' | 'onRemoveMarkConnection' | 'onReplaceMarkConnection'>;

export function MarkConnectionsEditor({ activeFrame, mark, onConnectMarks, onRemoveMarkConnection, onReplaceMarkConnection }: MarkConnectionEditorProps) {
  const otherMarks = activeFrame.marks.filter((candidate) => candidate.id !== mark.id);
  const connections = (activeFrame.connections ?? []).filter((connection) => connection.start.markId === mark.id);
  const connectedTargetIds = connections.map((connection) => connection.end.markId);
  const availableTargets = otherMarks.filter((candidate) => !connectedTargetIds.includes(candidate.id));
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [isAddingConnection, setIsAddingConnection] = useState(false);

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
    <div className={styles.editorForm}>
      <div className={styles.connectionListHeading}>
        <span className={styles.connectionSectionLabel}>Connect to</span>
        <button type="button" className={styles.connectionAddButton} aria-label="Add connection" disabled={availableTargets.length === 0} onClick={() => setIsAddingConnection(true)}>
          <Plus aria-hidden="true" size={14} /> Add
        </button>
      </div>
      {connections.length === 0 && !isAddingConnection && <p className={styles.connectionEmpty}>No connected marks.</p>}
      <div className={styles.connectionList} aria-label="Mark connections">
        {connections.map((connection) => {
          const targetMark = otherMarks.find((candidate) => candidate.id === connection.end.markId);
          const targetName = targetMark?.name ?? 'Missing mark';
          const isEditing = editingConnectionId === connection.id;
          const editOptions = otherMarks.filter((candidate) => candidate.id === connection.end.markId || !connectedTargetIds.includes(candidate.id));

          return (
            <div className={styles.connectionRow} key={connection.id}>
              {isEditing ? (
                <select aria-label={`Edit connection to ${targetName}`} value={connection.end.markId} onChange={(event) => replaceConnection(connection.id, event.target.value)}>
                  {editOptions.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                </select>
              ) : (
                <span className={styles.connectionTargetName}>{targetName}</span>
              )}
              <button type="button" className={styles.connectionRowButton} aria-label={`Edit connection to ${targetName}`} title="Edit connection" onClick={() => setEditingConnectionId(isEditing ? null : connection.id)}>
                <Pencil aria-hidden="true" size={14} />
              </button>
              <button type="button" className={`${styles.connectionRowButton} ${styles.connectionRowDeleteButton}`} aria-label={`Delete connection to ${targetName}`} title="Delete connection" onClick={() => removeConnection(connection.id)}>
                <Trash2 aria-hidden="true" size={14} />
              </button>
            </div>
          );
        })}
        {isAddingConnection && (
          <div className={styles.connectionRow}>
            <select aria-label="New connection target" defaultValue="" onChange={(event) => { if (event.target.value) addConnection(event.target.value); }}>
              <option value="">Select a mark…</option>
              {availableTargets.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
            </select>
            <button type="button" className={styles.connectionRowButton} aria-label="Cancel adding connection" title="Cancel" onClick={() => setIsAddingConnection(false)}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}
