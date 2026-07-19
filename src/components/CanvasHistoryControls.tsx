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
        ↶
      </button>
      <button
        type="button"
        className="canvas-history-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl/Cmd+Shift+Z)"
        aria-label="Redo"
      >
        ↷
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
