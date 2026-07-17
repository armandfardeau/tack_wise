import { useEffect, useRef, useState } from 'react';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import {
  CANVAS_ZOOM_STEP,
  MAX_CANVAS_ZOOM,
  MIN_CANVAS_ZOOM,
  MOBILE_INITIAL_CANVAS_ZOOM,
} from '../constants';
import {
  clampCanvasZoom,
  constrainCanvasPosition,
  getCanvasWorldBounds,
  type CanvasContentBounds,
  type Position,
} from '../utils/simulation';

const isMobileViewport = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(max-width: 768px)').matches;

const getInitialCanvasZoom = (
  stageSize: { width: number; height: number },
  contentBounds?: CanvasContentBounds,
) => {
  if (!isMobileViewport()) return 1;
  if (!contentBounds) return MOBILE_INITIAL_CANVAS_ZOOM;

  const fitZoom = Math.min(
    stageSize.width / Math.max(contentBounds.maxX + 24, stageSize.width),
    stageSize.height / Math.max(contentBounds.maxY + 24, stageSize.height),
  );

  return Math.max(MIN_CANVAS_ZOOM, Math.min(MOBILE_INITIAL_CANVAS_ZOOM, fitZoom));
};

export function useCanvasViewport(contentBounds?: CanvasContentBounds) {
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<KonvaStage | null>(null);
  const hasMeasuredStageRef = useRef(false);
  const [stageSize, setStageSize] = useState({ width: 720, height: 500 });
  const [canvasZoom, setCanvasZoom] = useState(() => getInitialCanvasZoom({ width: 720, height: 500 }, contentBounds));
  const [canvasPosition, setCanvasPosition] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    const canvasWrap = canvasWrapRef.current;
    if (!canvasWrap) return undefined;

    const updateStageSize = () => {
      const { width, height } = canvasWrap.getBoundingClientRect();
      const nextStageSize = {
        width: Math.max(Math.round(width), 320),
        height: Math.max(Math.round(height), 240),
      };

      setStageSize(nextStageSize);

      if (!hasMeasuredStageRef.current) {
        const initialZoom = getInitialCanvasZoom(nextStageSize, contentBounds);
        setCanvasZoom(initialZoom);
        setCanvasPosition({ x: 0, y: 0 });
        hasMeasuredStageRef.current = true;
      }
    };

    updateStageSize();
    const observer = new ResizeObserver(updateStageSize);
    observer.observe(canvasWrap);
    return () => observer.disconnect();
  }, [contentBounds]);

  const zoomCanvasAtPoint = (requestedZoom: number, point: Position) => {
    const nextZoom = clampCanvasZoom(requestedZoom);
    const worldPoint = {
      x: (point.x - canvasPosition.x) / canvasZoom,
      y: (point.y - canvasPosition.y) / canvasZoom,
    };

    setCanvasPosition(
      constrainCanvasPosition(
        {
          x: point.x - worldPoint.x * nextZoom,
          y: point.y - worldPoint.y * nextZoom,
        },
        nextZoom,
        stageSize,
        getCanvasWorldBounds(stageSize),
      ),
    );
    setCanvasZoom(nextZoom);
  };

  const zoomCanvasFromCenter = (factor: number) => {
    zoomCanvasAtPoint(canvasZoom * factor, {
      x: stageSize.width / 2,
      y: stageSize.height / 2,
    });
  };

  const resetCanvasZoom = () => {
    setCanvasZoom(1);
    setCanvasPosition({ x: 0, y: 0 });
  };

  const handleCanvasWheel = (event: { evt: { preventDefault: () => void; deltaY: number } }) => {
    event.evt.preventDefault();
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;

    const factor = event.evt.deltaY > 0 ? 1 / CANVAS_ZOOM_STEP : CANVAS_ZOOM_STEP;
    zoomCanvasAtPoint(canvasZoom * factor, pointer);
  };

  const handleCanvasDragEnd = () => {
    const stage = stageRef.current;
    if (!stage) return;
    setCanvasPosition({ x: stage.x(), y: stage.y() });
  };

  return {
    canvasPosition,
    canvasWrapRef,
    canvasZoom,
    constrainPosition: (position: Position) =>
      constrainCanvasPosition(position, canvasZoom, stageSize, getCanvasWorldBounds(stageSize)),
    handleCanvasDragEnd,
    handleCanvasWheel,
    maxZoom: MAX_CANVAS_ZOOM,
    minZoom: MIN_CANVAS_ZOOM,
    resetCanvasZoom,
    stageRef,
    stageSize,
    zoomCanvasFromCenter,
  };
}
