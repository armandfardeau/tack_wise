import { Minus, Plus, RotateCcw } from 'lucide-react';

interface CanvasZoomControlsProps {
  canvasPosition: { x: number; y: number };
  canvasZoom: number;
  maxZoom: number;
  minZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAutoZoom: () => void;
  onReset: () => void;
}

export default function CanvasZoomControls({
  canvasPosition,
  canvasZoom,
  maxZoom,
  minZoom,
  onZoomIn,
  onZoomOut,
  onAutoZoom,
  onReset,
}: CanvasZoomControlsProps) {
  return (
    <div className="canvas-zoom-controls" aria-label="Canvas zoom controls">
      <button type="button" className="canvas-zoom-btn" onClick={onZoomIn} disabled={canvasZoom >= maxZoom} aria-label="Zoom in" title="Zoom in">
        <Plus aria-hidden="true" size={16} />
      </button>
      <span className="canvas-zoom-level" aria-live="polite">
        {Math.round(canvasZoom * 100)}%
      </span>
      <button type="button" className="canvas-zoom-btn" onClick={onZoomOut} disabled={canvasZoom <= minZoom} aria-label="Zoom out" title="Zoom out">
        <Minus aria-hidden="true" size={16} />
      </button>
      <button
        type="button"
        className="canvas-zoom-fit"
        onClick={onAutoZoom}
        aria-label="Auto zoom to fit all items"
        title="Fit all items"
      >
        Fit
      </button>
      <button
        type="button"
        className="canvas-zoom-reset"
        onClick={onReset}
        disabled={canvasZoom === 1 && canvasPosition.x === 0 && canvasPosition.y === 0}
        title="Reset zoom"
      >
        <RotateCcw aria-hidden="true" size={14} />
        Reset
      </button>
    </div>
  );
}
