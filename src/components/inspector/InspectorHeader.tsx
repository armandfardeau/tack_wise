import { Copy, Search, Trash2, X } from 'lucide-react';
import type { DeletableObject } from './types';

interface InspectorHeaderProps {
  objectName: string | null;
  deletableObject: DeletableObject | null;
  onDelete: () => void;
  onDuplicate: () => void;
  onClose: () => void;
}

export function InspectorHeader({ objectName, deletableObject, onDelete, onDuplicate, onClose }: InspectorHeaderProps) {
  return (
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
  );
}
