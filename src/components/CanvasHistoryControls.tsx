import { Redo2, Undo2 } from 'lucide-react';

interface CanvasHistoryControlsProps {
  canRedo: boolean;
  canUndo: boolean;
  hasAutosave: boolean;
  onRedo: () => void;
  onRestoreAutosave: () => void;
  onUndo: () => void;
}

export default function CanvasHistoryControls({
  canRedo,
  canUndo,
  hasAutosave,
  onRedo,
  onRestoreAutosave,
  onUndo,
}: CanvasHistoryControlsProps) {
  return (
    <div className="canvas-history-controls" aria-label="Canvas history controls">
      <button
        type="button"
        className="canvas-history-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl/Cmd+Z)"
        aria-label="Undo"
      >
        <Undo2 aria-hidden="true" size={16} />
      </button>
      <button
        type="button"
        className="canvas-history-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl/Cmd+Shift+Z)"
        aria-label="Redo"
      >
        <Redo2 aria-hidden="true" size={16} />
      </button>
      {hasAutosave && (
        <button
          type="button"
          className="canvas-history-restore-btn"
          onClick={onRestoreAutosave}
          title="Restore the last autosaved scenario"
        >
          Restore autosave
        </button>
      )}
    </div>
  );
}
