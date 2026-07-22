import { useEffect, useRef } from 'react';
import { AlertTriangle, Download, Trash2, X } from 'lucide-react';
import useModalFocus, { type ModalFocusRef } from '../hooks/useModalFocus';

interface NewScenarioDialogProps {
  returnFocusRef?: ModalFocusRef;
  onCancel: () => void;
  onExportAndContinue: () => void;
  onDiscard: () => void;
}

export default function NewScenarioDialog({ returnFocusRef, onCancel, onExportAndContinue, onDiscard }: NewScenarioDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useModalFocus<HTMLElement>({ initialFocusRef: cancelButtonRef, returnFocusRef });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="new-scenario-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section ref={dialogRef} className="new-scenario-dialog" role="dialog" aria-modal="true" aria-labelledby="new-scenario-title" aria-describedby="new-scenario-description" tabIndex={-1}>
        <div className="new-scenario-header">
          <div className="new-scenario-heading">
            <AlertTriangle aria-hidden="true" size={20} />
            <h2 id="new-scenario-title">Start a new diagram?</h2>
          </div>
          <button type="button" className="new-scenario-close" aria-label="Close new diagram dialog" onClick={onCancel}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <p id="new-scenario-description">
          Your current changes will be replaced. Export a JSON backup first if you may want to return to this diagram.
        </p>

        <div className="new-scenario-actions">
          <button ref={cancelButtonRef} type="button" className="new-scenario-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="new-scenario-export" onClick={onExportAndContinue}>
            <Download aria-hidden="true" size={16} /> Export JSON &amp; continue
          </button>
          <button type="button" className="new-scenario-danger" onClick={onDiscard}>
            <Trash2 aria-hidden="true" size={16} /> Discard changes
          </button>
        </div>
      </section>
    </div>
  );
}
