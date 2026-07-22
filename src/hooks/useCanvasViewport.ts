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
  type CanvasContentRect,
  type CanvasContentBounds,
  type Position,
} from '../utils/simulation';

const CANVAS_FIT_PADDING = 32;
const CANVAS_FIT_TOP_CONTROL_OFFSET = 48;
const CANVAS_FIT_BOTTOM_CONTROL_OFFSET = 48;

interface PinchGesture {
  center: Position;
  distance: number;
}

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
  const stageSizeRef = useRef(stageSize);
  const canvasZoomRef = useRef(canvasZoom);
  const canvasPositionRef = useRef(canvasPosition);
  const pinchGestureRef = useRef<PinchGesture | null>(null);

  stageSizeRef.current = stageSize;
  canvasZoomRef.current = canvasZoom;
  canvasPositionRef.current = canvasPosition;

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

  const setCanvasViewport = (position: Position, zoom: number) => {
    canvasPositionRef.current = position;
    canvasZoomRef.current = zoom;
    setCanvasPosition(position);
    setCanvasZoom(zoom);
  };

  const zoomCanvasAtPoint = (requestedZoom: number, point: Position) => {
    const nextZoom = clampCanvasZoom(requestedZoom);
    const currentZoom = canvasZoomRef.current;
    const currentPosition = canvasPositionRef.current;
    const currentStageSize = stageSizeRef.current;
    const worldPoint = {
      x: (point.x - currentPosition.x) / currentZoom,
      y: (point.y - currentPosition.y) / currentZoom,
    };

    setCanvasViewport(
      constrainCanvasPosition(
        {
          x: point.x - worldPoint.x * nextZoom,
          y: point.y - worldPoint.y * nextZoom,
        },
        nextZoom,
        currentStageSize,
        getCanvasWorldBounds(currentStageSize),
      ),
      nextZoom,
    );
  };

  const zoomCanvasFromCenter = (factor: number) => {
    const currentStageSize = stageSizeRef.current;
    zoomCanvasAtPoint(canvasZoomRef.current * factor, {
      x: currentStageSize.width / 2,
      y: currentStageSize.height / 2,
    });
  };

  const resetCanvasZoom = () => {
    setCanvasViewport({ x: 0, y: 0 }, 1);
  };

  const getCurrentStageSize = () => {
    const canvasWrap = canvasWrapRef.current;
    if (!canvasWrap) return stageSizeRef.current;

    const { width, height } = canvasWrap.getBoundingClientRect();
    const measuredStageSize = {
      width: Math.max(Math.round(width), 320),
      height: Math.max(Math.round(height), 240),
    };
    stageSizeRef.current = measuredStageSize;
    return measuredStageSize;
  };

  const fitCanvasToContent = (contentRect: CanvasContentRect) => {
    if (contentRect.minX === contentRect.maxX && contentRect.minY === contentRect.maxY) {
      resetCanvasZoom();
      return;
    }

    const currentStageSize = getCurrentStageSize();
    const topFitInset = CANVAS_FIT_PADDING + CANVAS_FIT_TOP_CONTROL_OFFSET;
    const bottomFitInset = CANVAS_FIT_PADDING + CANVAS_FIT_BOTTOM_CONTROL_OFFSET;
    const availableWidth = Math.max(currentStageSize.width - CANVAS_FIT_PADDING * 2, 1);
    const availableHeight = Math.max(currentStageSize.height - topFitInset - bottomFitInset, 1);
    const contentWidth = Math.max(contentRect.maxX - contentRect.minX, 1);
    const contentHeight = Math.max(contentRect.maxY - contentRect.minY, 1);
    const nextZoom = clampCanvasZoom(Math.min(
      availableWidth / contentWidth,
      availableHeight / contentHeight,
    ));
    const contentCenter = {
      x: (contentRect.minX + contentRect.maxX) / 2,
      y: (contentRect.minY + contentRect.maxY) / 2,
    };
    const nextPosition = {
      x: currentStageSize.width / 2 - contentCenter.x * nextZoom,
      y: topFitInset + availableHeight / 2 - contentCenter.y * nextZoom,
    };

    setCanvasViewport(
      constrainCanvasPosition(
        nextPosition,
        nextZoom,
        currentStageSize,
        getCanvasWorldBounds(currentStageSize),
      ),
      nextZoom,
    );
  };

  const panCanvasBy = (delta: Position) => {
    const currentPosition = canvasPositionRef.current;
    const currentZoom = canvasZoomRef.current;
    const currentStageSize = stageSizeRef.current;
    setCanvasViewport(
      constrainCanvasPosition(
        {
          x: currentPosition.x + delta.x,
          y: currentPosition.y + delta.y,
        },
        currentZoom,
        currentStageSize,
        getCanvasWorldBounds(currentStageSize),
      ),
      currentZoom,
    );
  };

  const handleCanvasWheel = (event: { evt: { preventDefault: () => void; deltaY: number } }) => {
    event.evt.preventDefault();
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;

    const factor = event.evt.deltaY > 0 ? 1 / CANVAS_ZOOM_STEP : CANVAS_ZOOM_STEP;
    zoomCanvasAtPoint(canvasZoomRef.current * factor, pointer);
  };

  const handleCanvasDragEnd = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const position = { x: stage.x(), y: stage.y() };
    canvasPositionRef.current = position;
    setCanvasPosition(position);
  };

  const getTouchPoint = (touch: Touch): Position => {
    const canvasWrap = canvasWrapRef.current;
    if (!canvasWrap) return { x: touch.clientX, y: touch.clientY };
    const bounds = canvasWrap.getBoundingClientRect();
    return {
      x: touch.clientX - bounds.left,
      y: touch.clientY - bounds.top,
    };
  };

  const getPinchGesture = (touches: TouchList): PinchGesture | null => {
    if (touches.length < 2) return null;
    const first = getTouchPoint(touches[0]);
    const second = getTouchPoint(touches[1]);
    return {
      center: {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      },
      distance: Math.max(Math.hypot(second.x - first.x, second.y - first.y), 1),
    };
  };

  const stopCanvasDrag = () => {
    const stage = stageRef.current;
    if (!stage?.isDragging()) return;
    stage.stopDrag();
    const position = { x: stage.x(), y: stage.y() };
    canvasPositionRef.current = position;
    setCanvasPosition(position);
  };

  const handleCanvasTouchStart = (event: { evt: TouchEvent }) => {
    const gesture = getPinchGesture(event.evt.touches);
    if (!gesture) return;
    event.evt.preventDefault();
    stopCanvasDrag();
    pinchGestureRef.current = gesture;
  };

  const handleCanvasTouchMove = (event: { evt: TouchEvent }) => {
    const gesture = getPinchGesture(event.evt.touches);
    if (!gesture) return;
    event.evt.preventDefault();
    stopCanvasDrag();

    const previousGesture = pinchGestureRef.current;
    if (!previousGesture) {
      pinchGestureRef.current = gesture;
      return;
    }

    const currentZoom = canvasZoomRef.current;
    const currentPosition = canvasPositionRef.current;
    const currentStageSize = stageSizeRef.current;
    const worldPoint = {
      x: (previousGesture.center.x - currentPosition.x) / currentZoom,
      y: (previousGesture.center.y - currentPosition.y) / currentZoom,
    };
    const nextZoom = clampCanvasZoom(currentZoom * (gesture.distance / previousGesture.distance));
    const nextPosition = constrainCanvasPosition(
      {
        x: gesture.center.x - worldPoint.x * nextZoom,
        y: gesture.center.y - worldPoint.y * nextZoom,
      },
      nextZoom,
      currentStageSize,
      getCanvasWorldBounds(currentStageSize),
    );

    setCanvasViewport(nextPosition, nextZoom);
    pinchGestureRef.current = gesture;
  };

  const handleCanvasTouchEnd = (event: { evt: TouchEvent }) => {
    if (event.evt.touches.length < 2) {
      pinchGestureRef.current = null;
    }
  };

  return {
    canvasPosition,
    canvasWrapRef,
    canvasZoom,
    constrainPosition: (position: Position) =>
      constrainCanvasPosition(position, canvasZoom, stageSize, getCanvasWorldBounds(stageSize)),
    fitCanvasToContent,
    handleCanvasDragEnd,
    handleCanvasTouchEnd,
    handleCanvasTouchMove,
    handleCanvasTouchStart,
    handleCanvasWheel,
    maxZoom: MAX_CANVAS_ZOOM,
    minZoom: MIN_CANVAS_ZOOM,
    panCanvasBy,
    resetCanvasZoom,
    setCanvasViewport,
    stageRef,
    stageSize,
    zoomCanvasFromCenter,
  };
}
