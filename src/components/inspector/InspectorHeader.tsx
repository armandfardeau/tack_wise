import { Copy, Search, Trash2, X } from 'lucide-react';
import type { DeletableObject } from './types';
import styles from './Inspector.module.css';

interface InspectorHeaderProps {
  objectName: string | null;
  deletableObject: DeletableObject | null;
  onDelete: () => void;
  onDuplicate: () => void;
  onClose: () => void;
}

export function InspectorHeader({ objectName, deletableObject, onDelete, onDuplicate, onClose }: InspectorHeaderProps) {
  return (
    <h3 className={`${styles.sectionTitle} ${styles.dragHandle}`} title="Drag to move inspector" aria-label={objectName ? `Inspector for ${objectName}` : 'Inspector'}>
      <span className={styles.titleContent}><Search aria-hidden="true" size={16} /><span>Inspector</span>{objectName && <span className={styles.objectName} title={objectName}>{objectName}</span>}</span>
      <span className={styles.actions}>
        {deletableObject && (
          <>
            <button
              type="button"
              className={styles.duplicateButton}
              aria-label={`Duplicate ${deletableObject}`}
              title={`Duplicate ${deletableObject}`}
              onClick={onDuplicate}
            >
              <Copy aria-hidden="true" size={16} />
            </button>
            <button
              type="button"
              className={styles.deleteButton}
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
          className={styles.closeButton}
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
