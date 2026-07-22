import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Pencil, TriangleAlert, X } from 'lucide-react';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import { Rnd } from 'react-rnd';
import type { Boat, CommentNote, DiagramImage, FrameComment, Mark, MarkConnection, RuleComment, TacticalArrow } from '../types';
import type { DisplayMode, Frame, Theme } from '../types';
import type { SelectedType } from '../hooks/useScenario';
import type { SnapTarget } from '../hooks/useGridSnap';
import { getCommentHeight, getCommentText, type Position } from '../utils/simulation';
import CanvasZoomControls from './CanvasZoomControls';
import SimulationCanvas from './SimulationCanvas';
import WindHud from './WindHud';
import Inspector from './Inspector';
import GridSettingsButton from './GridSettingsButton';
import FloatingAddMenu from './FloatingAddMenu';
import PlaybackButton from './PlaybackButton';
import CanvasHistoryControls from './CanvasHistoryControls';
import FrameHeader from './FrameHeader';
import { getConnectionPoints } from '../utils/markConnections';

interface CanvasWorkspaceProps {
  activeFrame: Frame;
  inspectorFrame: Frame;
  autoSailTrim: boolean;
  canvasPosition: Position;
  canvasZoom: number;
  constrainPosition: (position: Position) => Position;
  currentFrameIndex: number;
  displayMode: DisplayMode;
  showFrameTitle: boolean;
  showFrameNumber: boolean;
  presenterMode: boolean;
  theme: Theme;
  frames: Frame[];
  canRedo: boolean;
  canUndo: boolean;
  hasAutosave: boolean;
  getSnappedPosition: (objectId: string, position: Position) => Position;
  gridSnapEnabled: boolean;
  isPlaying: boolean;
  playbackWarning?: string | null;
  isExporting: boolean;
  handleCanvasDragEnd: () => void;
  handleCanvasTouchEnd: (event: { evt: TouchEvent }) => void;
  handleCanvasTouchMove: (event: { evt: TouchEvent }) => void;
  handleCanvasTouchStart: (event: { evt: TouchEvent }) => void;
  handleCanvasWheel: (event: { evt: { preventDefault: () => void; deltaY: number } }) => void;
  maxZoom: number;
  minZoom: number;
  onAddBoat: () => void;
  onAddMark: (shape?: Mark['shape']) => void;
  onAddArrow: (start?: Position, end?: Position) => void;
  onAddComment: () => void;
  onAddRuleComment?: () => void;
  onAddImage: (src: string, name?: string) => void;
  onMoveBoat: (boatId: string, position: Position) => void;
  onRotateBoat: (boatId: string, heading: number) => void;
  onMoveMark: (markId: string, position: Position) => void;
  onConnectMarks?: (sourceMarkId: string, targetMarkId: string, anchors?: { start?: Position; end?: Position }) => void;
  onRemoveMarkConnection?: (connectionId: string) => void;
  onReplaceMarkConnection?: (connectionId: string, nextTargetMarkId: string) => void;
  onMoveArrow: (arrowId: string, points: NonNullable<Frame['arrows']>[number]['points']) => void;
  onMoveComment: (commentId: string, position: Position) => void;
  onMoveImage: (imageId: string, position: Position) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onClearSelection: () => void;
  onSetAutoSailTrim: (enabled: boolean) => void;
  onSetDisplayMode: (mode: DisplayMode) => void;
  onSetShowFrameTitle: (show: boolean) => void;
  onSetShowFrameNumber: (show: boolean) => void;
  onSetGridSnapEnabled: (enabled: boolean) => void;
  onSetShowGrid: (show: boolean) => void;
  onRedo: () => void;
  onRestoreAutosave: () => void;
  onTogglePlaying: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onReplayFromStart: () => void;
  onUndo: () => void;
  onSetPlaySpeed: (speed: number) => void;
  playSpeed: number;
  onPanCanvasBy: (delta: Position) => void;
  onOpenControls: () => void;
  onCloseControls: () => void;
  onSelectObject: (id: string, type: Exclude<SelectedType, null>) => void;
  inspectorRequest?: InspectorRequest | null;
  onSnapPreview: (target: SnapTarget | null) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAutoZoom: () => void;
  onResetZoom: () => void;
  selectedId: string | null;
  selectedType: SelectedType;
  selectedBoat: Boat | undefined;
  selectedMark: Mark | undefined;
  selectedConnection?: MarkConnection;
  selectedArrow?: TacticalArrow;
  selectedComment?: FrameComment;
  selectedImage?: DiagramImage;
  updateBoat: (boatId: string, changes: Partial<Boat>) => void;
  updateActiveFrame: (changes: Partial<Frame>) => void;
  updateMark: (markId: string, changes: Partial<Mark>) => void;
  updateConnection?: (connectionId: string, changes: Partial<MarkConnection>) => void;
  updateArrow?: (arrowId: string, changes: Partial<TacticalArrow>) => void;
  updateComment?: (commentId: string, changes: Partial<CommentNote>) => void;
  updateRuleComment?: (commentId: string, changes: Partial<RuleComment>) => void;
  updateImage?: (imageId: string, changes: Partial<DiagramImage>) => void;
  canvasWrapRef: RefObject<HTMLDivElement | null>;
  showGrid: boolean;
  snapTarget: SnapTarget | null;
  stageRef: RefObject<KonvaStage | null>;
  stageSize: { width: number; height: number };
  children?: ReactNode;
}

interface InspectorPlacement {
  left: number;
  top: number;
  needsPan: boolean;
  panDelta: Position;
}

const INSPECTOR_MARGIN = 12;
const INSPECTOR_GAP = 24;

export interface InspectorRequest {
  id: string;
  type: Exclude<SelectedType, null>;
  requestId: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function getInspectorPlacement(
  anchor: Position,
  objectSize: { width: number; height: number },
  inspectorSize: { width: number; height: number },
  stageSize: { width: number; height: number },
): InspectorPlacement {
  const maxLeft = Math.max(INSPECTOR_MARGIN, stageSize.width - inspectorSize.width - INSPECTOR_MARGIN);
  const maxTop = Math.max(INSPECTOR_MARGIN, stageSize.height - Math.min(inspectorSize.height, stageSize.height - INSPECTOR_MARGIN * 2) - INSPECTOR_MARGIN);
  const centeredTop = clamp(anchor.y - inspectorSize.height / 2, INSPECTOR_MARGIN, maxTop);
  const centeredLeft = clamp(anchor.x - inspectorSize.width / 2, INSPECTOR_MARGIN, maxLeft);

  const candidates = [
    {
      left: centeredLeft,
      top: centeredTop,
      fits: !(
        centeredLeft < anchor.x + objectSize.width / 2
        && centeredLeft + inspectorSize.width > anchor.x - objectSize.width / 2
        && centeredTop < anchor.y + objectSize.height / 2
        && centeredTop + inspectorSize.height > anchor.y - objectSize.height / 2
      ),
    },
    {
      left: anchor.x + objectSize.width / 2 + INSPECTOR_GAP,
      top: centeredTop,
      fits: anchor.x + objectSize.width / 2 + INSPECTOR_GAP >= INSPECTOR_MARGIN
        && anchor.x + objectSize.width / 2 + INSPECTOR_GAP <= maxLeft,
    },
    {
      left: anchor.x - objectSize.width / 2 - INSPECTOR_GAP - inspectorSize.width,
      top: centeredTop,
      fits: anchor.x - objectSize.width / 2 - INSPECTOR_GAP - inspectorSize.width >= INSPECTOR_MARGIN,
    },
    {
      left: centeredLeft,
      top: anchor.y + objectSize.height / 2 + INSPECTOR_GAP,
      fits: anchor.y + objectSize.height / 2 + INSPECTOR_GAP <= maxTop,
    },
    {
      left: centeredLeft,
      top: anchor.y - objectSize.height / 2 - INSPECTOR_GAP - inspectorSize.height,
      fits: anchor.y - objectSize.height / 2 - INSPECTOR_GAP - inspectorSize.height >= INSPECTOR_MARGIN,
    },
  ];

  const availableCandidate = candidates.find((candidate) => candidate.fits);
  const objectHalfWidth = objectSize.width / 2;
  const objectHalfHeight = objectSize.height / 2;
  const visibleMinX = INSPECTOR_MARGIN + objectHalfWidth;
  const visibleMaxX = stageSize.width - INSPECTOR_MARGIN - objectHalfWidth;
  const visibleMinY = INSPECTOR_MARGIN + objectHalfHeight;
  const visibleMaxY = stageSize.height - INSPECTOR_MARGIN - objectHalfHeight;
  const visibleObject = anchor.x >= visibleMinX
    && anchor.x <= visibleMaxX
    && anchor.y >= visibleMinY
    && anchor.y <= visibleMaxY;

  if (visibleObject) {
    if (availableCandidate) {
      return {
        left: availableCandidate.left,
        top: availableCandidate.top,
        needsPan: false,
        panDelta: { x: 0, y: 0 },
      };
    }

    return {
      left: centeredLeft,
      top: centeredTop,
      needsPan: true,
      panDelta: {
        x: stageSize.width / 2 - anchor.x,
        y: stageSize.height / 2 - anchor.y,
      },
    };
  }

  const rightTargetMaxX = maxLeft - objectHalfWidth - INSPECTOR_GAP;
  if (rightTargetMaxX >= visibleMinX) {
    const targetX = clamp(stageSize.width / 2, visibleMinX, rightTargetMaxX);
    const targetY = clamp(stageSize.height / 2, visibleMinY, visibleMaxY);
    return {
      left: centeredLeft,
      top: centeredTop,
      needsPan: true,
      panDelta: { x: targetX - anchor.x, y: targetY - anchor.y },
    };
  }

  const leftTargetMinX = INSPECTOR_MARGIN + inspectorSize.width + INSPECTOR_GAP + objectHalfWidth;
  if (leftTargetMinX <= visibleMaxX) {
    const targetX = clamp(stageSize.width / 2, leftTargetMinX, visibleMaxX);
    const targetY = clamp(stageSize.height / 2, visibleMinY, visibleMaxY);
    return {
      left: centeredLeft,
      top: centeredTop,
      needsPan: true,
      panDelta: { x: targetX - anchor.x, y: targetY - anchor.y },
    };
  }

  const belowTargetMaxY = maxTop - objectHalfHeight - INSPECTOR_GAP;
  if (belowTargetMaxY >= visibleMinY) {
    const targetX = clamp(stageSize.width / 2, visibleMinX, visibleMaxX);
    const targetY = clamp(stageSize.height / 2, visibleMinY, belowTargetMaxY);
    return {
      left: centeredLeft,
      top: centeredTop,
      needsPan: true,
      panDelta: { x: targetX - anchor.x, y: targetY - anchor.y },
    };
  }

  const aboveTargetMinY = INSPECTOR_MARGIN + inspectorSize.height + INSPECTOR_GAP + objectHalfHeight;
  if (aboveTargetMinY <= visibleMaxY) {
    const targetX = clamp(stageSize.width / 2, visibleMinX, visibleMaxX);
    const targetY = clamp(stageSize.height / 2, aboveTargetMinY, visibleMaxY);
    return {
      left: centeredLeft,
      top: centeredTop,
      needsPan: true,
      panDelta: { x: targetX - anchor.x, y: targetY - anchor.y },
    };
  }

  return {
    left: centeredLeft,
    top: centeredTop,
    needsPan: true,
    panDelta: {
      x: stageSize.width / 2 - anchor.x,
      y: stageSize.height / 2 - anchor.y,
    },
  };
}

export default function CanvasWorkspace({
  activeFrame,
  inspectorFrame,
  autoSailTrim,
  canvasPosition,
  canvasZoom,
  constrainPosition,
  currentFrameIndex,
  displayMode,
  showFrameTitle,
  showFrameNumber,
  presenterMode,
  theme,
  frames,
  canRedo,
  canUndo,
  hasAutosave,
  getSnappedPosition,
  gridSnapEnabled,
  isPlaying,
  playbackWarning,
  isExporting,
  handleCanvasDragEnd,
  handleCanvasTouchEnd,
  handleCanvasTouchMove,
  handleCanvasTouchStart,
  handleCanvasWheel,
  maxZoom,
  minZoom,
  onAddBoat,
  onAddMark,
  onAddArrow,
  onAddComment,
  onAddRuleComment = () => undefined,
  onAddImage,
  onMoveBoat,
  onRotateBoat,
  onMoveMark,
  onConnectMarks = () => undefined,
  onRemoveMarkConnection = () => undefined,
  onReplaceMarkConnection = () => undefined,
  onMoveArrow,
  onMoveComment,
  onMoveImage,
  onDeleteSelected,
  onDuplicateSelected,
  onClearSelection,
  onSetAutoSailTrim,
  onSetDisplayMode,
  onSetShowFrameTitle,
  onSetShowFrameNumber,
  onSetGridSnapEnabled,
  onSetShowGrid,
  onRedo,
  onRestoreAutosave,
  onTogglePlaying,
  onStepBackward,
  onStepForward,
  onReplayFromStart,
  onUndo,
  onSetPlaySpeed,
  playSpeed,
  onPanCanvasBy,
  onOpenControls,
  onCloseControls,
  onSelectObject,
  inspectorRequest,
  onSnapPreview,
  onZoomIn,
  onZoomOut,
  onAutoZoom,
  onResetZoom,
  selectedId,
  selectedType,
  selectedBoat,
  selectedMark,
  selectedConnection,
  selectedArrow,
  selectedComment,
  selectedImage,
  updateBoat,
  updateActiveFrame,
  updateMark,
  updateConnection = () => undefined,
  updateArrow,
  updateComment,
  updateRuleComment,
  updateImage,
  canvasWrapRef,
  showGrid,
  snapTarget,
  stageRef,
  stageSize,
  children,
}: CanvasWorkspaceProps) {
  const inspectorRef = useRef<HTMLDivElement | null>(null);
  const autoPanKeyRef = useRef<string | null>(null);
  const handledInspectorRequestRef = useRef<number | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorPosition, setInspectorPosition] = useState<Position | null>(null);
  const [playbackToast, setPlaybackToast] = useState<string | null>(null);
  const [isAddingArrow, setIsAddingArrow] = useState(false);
  const [arrowDrawingStart, setArrowDrawingStart] = useState<Position | null>(null);

  useEffect(() => {
    if (!playbackWarning) return undefined;

    setPlaybackToast(playbackWarning);
    const timeoutId = window.setTimeout(() => {
      setPlaybackToast((currentToast) => currentToast === playbackWarning ? null : currentToast);
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [currentFrameIndex, playbackWarning]);

  const resetInspectorPlacement = useCallback(() => {
    autoPanKeyRef.current = null;
    setInspectorPosition(null);
  }, []);

  const handleCloseInspector = useCallback(() => {
    setIsInspectorOpen(false);
    resetInspectorPlacement();
    onClearSelection();
  }, [onClearSelection, resetInspectorPlacement]);

  useEffect(() => {
    if (!selectedId || !isInspectorOpen) return undefined;

    const handlePointerOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && inspectorRef.current?.contains(event.target)) return;
      if (event.target instanceof Element && event.target.closest('.color-picker-menu')) return;
      handleCloseInspector();
    };

    document.addEventListener('pointerdown', handlePointerOutside, true);
    return () => document.removeEventListener('pointerdown', handlePointerOutside, true);
  }, [handleCloseInspector, isInspectorOpen, selectedId]);

  useEffect(() => {
    if (!isInspectorOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (document.querySelector('.color-picker-menu')) return;
      event.preventDefault();
      if (isAddingArrow) {
        setIsAddingArrow(false);
        setArrowDrawingStart(null);
        return;
      }
      handleCloseInspector();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleCloseInspector, isAddingArrow, isInspectorOpen]);

  const handleSelectObject = useCallback((id: string, type: Exclude<SelectedType, null>) => {
    resetInspectorPlacement();
    setIsInspectorOpen(false);
    onSelectObject(id, type);
  }, [onSelectObject, resetInspectorPlacement]);

  const handleOpenInspector = useCallback((id: string, type: Exclude<SelectedType, null>) => {
    if (presenterMode) return;
    onCloseControls();
    resetInspectorPlacement();
    setIsInspectorOpen(true);
    onSelectObject(id, type);
  }, [onCloseControls, onSelectObject, presenterMode, resetInspectorPlacement]);

  useEffect(() => {
    if (!inspectorRequest || inspectorRequest.requestId === handledInspectorRequestRef.current) return;

    handledInspectorRequestRef.current = inspectorRequest.requestId;
    handleOpenInspector(inspectorRequest.id, inspectorRequest.type);
  }, [handleOpenInspector, inspectorRequest]);

  const handleAddBoat = () => {
    resetInspectorPlacement();
    onAddBoat();
    setIsInspectorOpen(true);
  };

  const handleAddMark = (shape?: Mark['shape']) => {
    resetInspectorPlacement();
    onAddMark(shape);
    setIsInspectorOpen(true);
  };

  const handleAddArrow = () => {
    resetInspectorPlacement();
    setIsInspectorOpen(false);
    setArrowDrawingStart(null);
    setIsAddingArrow(true);
  };

  const handleArrowPoint = (point: Position) => {
    if (!isAddingArrow) return;

    if (!arrowDrawingStart) {
      setArrowDrawingStart(point);
      return;
    }

    onAddArrow(arrowDrawingStart, point);
    setArrowDrawingStart(null);
    setIsAddingArrow(false);
    setIsInspectorOpen(true);
  };

  const handleAddComment = () => {
    resetInspectorPlacement();
    onAddComment();
    setIsInspectorOpen(true);
  };

  const handleAddRuleComment = () => {
    resetInspectorPlacement();
    onAddRuleComment();
    setIsInspectorOpen(true);
  };

  const handleAddImage = (src: string, name?: string) => {
    resetInspectorPlacement();
    onAddImage(src, name);
    setIsInspectorOpen(true);
  };

  const selectedObjectRect = (() => {
    if (selectedType === 'boat' && selectedBoat) {
      const hasSpeechBubble = Boolean(selectedBoat.speechBubble?.trim());
      return hasSpeechBubble
        ? { left: selectedBoat.x - 110, top: selectedBoat.y - 140, width: 220, height: 200 }
        : { left: selectedBoat.x - 40, top: selectedBoat.y - 55, width: 80, height: 110 };
    }

    if (selectedType === 'mark' && selectedMark) {
      return { left: selectedMark.x - 40, top: selectedMark.y - 30, width: 80, height: 60 };
    }

    if (selectedType === 'connection' && selectedConnection) {
      const points = getConnectionPoints(selectedConnection, activeFrame.marks);
      if (points) {
        const xValues = points.map((point) => point.x);
        const yValues = points.map((point) => point.y);
        const left = Math.min(...xValues) - 18;
        const top = Math.min(...yValues) - 18;
        return {
          left,
          top,
          width: Math.max(...xValues) - left + 18,
          height: Math.max(...yValues) - top + 18,
        };
      }
    }

    if (selectedType === 'comment' && selectedComment) {
      const text = getCommentText(selectedComment);
      return {
        left: selectedComment.x,
        top: selectedComment.y,
        width: selectedComment.width ?? 180,
        height: getCommentHeight({ ...selectedComment, text }),
      };
    }

    if (selectedType === 'image' && selectedImage) {
      return { left: selectedImage.x, top: selectedImage.y, width: selectedImage.width, height: selectedImage.height };
    }

    if (selectedType === 'arrow' && selectedArrow?.points.length) {
      const xValues = selectedArrow.points.map((point) => point.x);
      const yValues = selectedArrow.points.map((point) => point.y);
      const left = Math.min(...xValues) - 16;
      const top = Math.min(...yValues) - 16;
      return {
        left,
        top,
        width: Math.max(...xValues) - left + 16,
        height: Math.max(...yValues) - top + 16,
      };
    }

    return null;
  })();

  const selectedPosition = selectedObjectRect
    ? {
        x: selectedObjectRect.left + selectedObjectRect.width / 2,
        y: selectedObjectRect.top + selectedObjectRect.height / 2,
      }
    : null;

  const inspectorHeightEstimate = selectedType === 'wind'
    ? 220
    : selectedType === 'grid'
      ? 330
      : selectedType === 'playback'
        ? 220
        : selectedType === 'boat'
          ? 560
      : selectedType === 'mark'
            ? 520
            : selectedType === 'connection'
              ? 360
            : 360;
  const isCompactLayout = typeof window !== 'undefined' && window.innerWidth <= 768;
  const inspectorLayoutHeight = isCompactLayout
    ? Math.min(inspectorHeightEstimate, window.innerHeight * 0.45)
    : inspectorHeightEstimate;
  const inspectorMaxTop = Math.max(
    12,
    stageSize.height - Math.min(inspectorLayoutHeight, stageSize.height - 24) - 12,
  );
  const inspectorWidth = isCompactLayout ? Math.max(0, window.innerWidth - 24) : 292;
  const centeredInspectorLeft = isCompactLayout
    ? 12
    : Math.max(12, Math.min(stageSize.width - inspectorWidth - 12, stageSize.width / 2 - inspectorWidth / 2));
  const centeredInspectorTop = Math.max(
    12,
    Math.min(inspectorMaxTop, stageSize.height / 2 - inspectorLayoutHeight / 2),
  );

  const inspectorPlacement = selectedObjectRect && selectedPosition
    ? getInspectorPlacement(
        {
          x: canvasPosition.x + selectedPosition.x * canvasZoom,
          y: canvasPosition.y + selectedPosition.y * canvasZoom,
        },
        {
          width: selectedObjectRect.width * canvasZoom,
          height: selectedObjectRect.height * canvasZoom,
        },
        { width: inspectorWidth, height: inspectorLayoutHeight },
        stageSize,
      )
    : null;

  const inspectorStyle = selectedType === 'wind'
    ? {
        left: centeredInspectorLeft,
        top: Math.max(12, Math.min(inspectorMaxTop, 84)),
      }
    : selectedType === 'grid'
      ? {
          left: centeredInspectorLeft,
          top: centeredInspectorTop,
        }
      : selectedType === 'playback'
        ? {
            left: centeredInspectorLeft,
            top: centeredInspectorTop,
          }
      : inspectorPlacement
        ? { left: inspectorPlacement.left, top: inspectorPlacement.top }
      : undefined;

  const shouldShowInspector = !presenterMode && isInspectorOpen && (selectedType === 'wind' || selectedType === 'grid' || selectedType === 'playback' || Boolean(selectedPosition));

  const inspectorPlacementKey = `${selectedId ?? ''}:${selectedType ?? ''}:${selectedPosition?.x ?? ''}:${selectedPosition?.y ?? ''}`;
  const inspectorStyleLeft = inspectorStyle?.left;
  const inspectorStyleTop = inspectorStyle?.top;
  const inspectorNeedsPan = inspectorPlacement?.needsPan ?? false;
  const inspectorPanDeltaX = inspectorPlacement?.panDelta.x ?? 0;
  const inspectorPanDeltaY = inspectorPlacement?.panDelta.y ?? 0;

  useEffect(() => {
    if (!shouldShowInspector || inspectorStyleLeft === undefined || inspectorStyleTop === undefined) {
      autoPanKeyRef.current = null;
      setInspectorPosition((position) => position === null ? position : null);
      return;
    }

    if (inspectorNeedsPan && autoPanKeyRef.current !== inspectorPlacementKey) {
      autoPanKeyRef.current = inspectorPlacementKey;
      setInspectorPosition(null);
      onPanCanvasBy({ x: inspectorPanDeltaX, y: inspectorPanDeltaY });
      return;
    }

    setInspectorPosition((position) => (
      position?.x === inspectorStyleLeft && position.y === inspectorStyleTop
        ? position
        : { x: inspectorStyleLeft, y: inspectorStyleTop }
    ));
  }, [
    inspectorNeedsPan,
    inspectorPanDeltaX,
    inspectorPanDeltaY,
    inspectorPlacementKey,
    inspectorStyleLeft,
    inspectorStyleTop,
    onPanCanvasBy,
    shouldShowInspector,
  ]);

  return (
    <section className="canvas-container">
      <div ref={canvasWrapRef} className={`canvas-wrap${isAddingArrow ? ' is-arrow-drawing' : ''}`}>
        <SimulationCanvas
          activeFrame={activeFrame}
          canvasPosition={canvasPosition}
          canvasZoom={canvasZoom}
          constrainPosition={constrainPosition}
          currentFrameIndex={currentFrameIndex}
          displayMode={displayMode}
          readOnly={presenterMode}
          presenterMode={presenterMode}
          isExporting={isExporting}
          theme={theme}
          frames={frames}
          getSnappedPosition={getSnappedPosition}
          gridSnapEnabled={gridSnapEnabled}
          showGrid={showGrid}
          onCanvasDragEnd={handleCanvasDragEnd}
          onCanvasTouchEnd={handleCanvasTouchEnd}
          onCanvasTouchMove={handleCanvasTouchMove}
          onCanvasTouchStart={handleCanvasTouchStart}
          onCanvasWheel={handleCanvasWheel}
          onMoveBoat={onMoveBoat}
          onRotateBoat={onRotateBoat}
          onMoveMark={onMoveMark}
          onConnectMarks={onConnectMarks}
          onMoveArrow={onMoveArrow}
          onArrowPoint={handleArrowPoint}
          isAddingArrow={isAddingArrow}
          arrowDrawingStart={arrowDrawingStart}
          onMoveComment={onMoveComment}
          onMoveImage={onMoveImage}
          onOpenControls={onOpenControls}
          onOpenInspector={handleOpenInspector}
          onSelectObject={handleSelectObject}
          onSnapPreview={onSnapPreview}
          selectedId={selectedId}
          selectedType={selectedType}
          snapTarget={snapTarget}
          stageRef={stageRef}
          stageSize={stageSize}
        />
        {!presenterMode && !isExporting && !isAddingArrow && !isInspectorOpen && selectedPosition && (
          <div className="canvas-edit-hint" role="status" aria-live="polite">
            <Pencil aria-hidden="true" size={14} />
            <span>Double-click or double-tap an object to edit it.</span>
          </div>
        )}
        {isAddingArrow && (
          <div className="arrow-drawing-hint" role="status" aria-live="polite">
            <span>{arrowDrawingStart ? 'Click the end point for the arrow.' : 'Click the start point for the arrow.'}</span>
            <button
              type="button"
              className="arrow-drawing-cancel"
              onClick={() => {
                setIsAddingArrow(false);
                setArrowDrawingStart(null);
              }}
            >
              Cancel
            </button>
          </div>
        )}
        <div className="canvas-top-controls">
          {!presenterMode && <GridSettingsButton onOpenInspector={() => handleOpenInspector('grid', 'grid')} />}
          {!presenterMode && (
            <CanvasHistoryControls
              canRedo={canRedo}
              canUndo={canUndo}
              hasAutosave={hasAutosave}
              onRedo={onRedo}
              onRestoreAutosave={onRestoreAutosave}
              onUndo={onUndo}
            />
          )}
          <WindHud
            windAngle={activeFrame.windAngle}
            windSpeed={activeFrame.windSpeed}
            onSelect={() => handleOpenInspector('wind', 'wind')}
          />
          <FrameHeader
            frameName={activeFrame.name}
            frameIndex={currentFrameIndex}
            frameCount={frames.length}
            showTitle={showFrameTitle}
            showNumber={showFrameNumber}
          />
        </div>
        {playbackToast && (
          <div className="playback-toast" role="status" aria-live="polite" aria-atomic="true">
            <TriangleAlert aria-hidden="true" size={17} />
            <span>{playbackToast}</span>
            <button
              type="button"
              className="playback-toast-dismiss"
              aria-label="Dismiss playback warning"
              onClick={() => setPlaybackToast(null)}
            >
              <X aria-hidden="true" size={15} />
            </button>
          </div>
        )}
        {shouldShowInspector && inspectorStyle && (
          <Rnd
            bounds="parent"
            className="floating-inspector"
            cancel=".inspector-close-btn, .inspector-delete-btn, .inspector-duplicate-btn"
            dragHandleClassName="inspector-drag-handle"
            enableResizing={false}
            position={{
              x: inspectorPosition?.x ?? inspectorStyle.left,
              y: inspectorPosition?.y ?? inspectorStyle.top,
            }}
            onDragStop={(_, data) => setInspectorPosition({ x: data.x, y: data.y })}
            key={selectedId ?? 'inspector'}
          >
            <div ref={inspectorRef}>
            <Inspector
              activeFrame={inspectorFrame}
              autoSailTrim={autoSailTrim}
              displayMode={displayMode}
              gridSnapEnabled={gridSnapEnabled}
              isPlaying={isPlaying}
              onDelete={onDeleteSelected}
              onDuplicate={onDuplicateSelected}
              onClose={handleCloseInspector}
              onSetGridSnapEnabled={onSetGridSnapEnabled}
              onSetAutoSailTrim={onSetAutoSailTrim}
              onSetDisplayMode={onSetDisplayMode}
              onSetShowFrameTitle={onSetShowFrameTitle}
              onSetShowFrameNumber={onSetShowFrameNumber}
              onSetShowGrid={onSetShowGrid}
              showFrameTitle={showFrameTitle}
              showFrameNumber={showFrameNumber}
              onTogglePlaying={onTogglePlaying}
              onSetPlaySpeed={onSetPlaySpeed}
              playSpeed={playSpeed}
              selectedBoat={selectedBoat}
              selectedMark={selectedMark}
              selectedConnection={selectedConnection}
              selectedArrow={selectedArrow}
              selectedComment={selectedComment}
              selectedImage={selectedImage}
              selectedType={selectedType}
              showGrid={showGrid}
              updateBoat={updateBoat}
              updateActiveFrame={updateActiveFrame}
              updateMark={updateMark}
              updateConnection={updateConnection}
              onConnectMarks={onConnectMarks}
              onRemoveMarkConnection={onRemoveMarkConnection}
              onReplaceMarkConnection={onReplaceMarkConnection}
              updateArrow={updateArrow}
              updateComment={updateComment}
              updateRuleComment={updateRuleComment}
              updateImage={updateImage}
            />
            </div>
          </Rnd>
        )}
        {!presenterMode && <FloatingAddMenu
            onAddBoat={handleAddBoat}
            onAddMark={handleAddMark}
            onAddArrow={handleAddArrow}
            onAddComment={handleAddComment}
            onAddRuleComment={handleAddRuleComment}
            onAddImage={handleAddImage}
          />}
        <PlaybackButton
          isPlaying={isPlaying}
          currentFrameIndex={currentFrameIndex}
          frameCount={frames.length}
          onTogglePlaying={onTogglePlaying}
          onStepBackward={onStepBackward}
          onStepForward={onStepForward}
          onReplayFromStart={onReplayFromStart}
          onOpenInspector={() => handleOpenInspector('playback', 'playback')}
        />
        <CanvasZoomControls
          canvasPosition={canvasPosition}
          canvasZoom={canvasZoom}
          maxZoom={maxZoom}
          minZoom={minZoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onAutoZoom={onAutoZoom}
          onReset={onResetZoom}
        />
      </div>
      {children}
    </section>
  );
}
