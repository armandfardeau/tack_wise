import { Fragment, useEffect, useRef, useState } from 'react';
import { Copy, Layers, Pause, Pencil, Play, Plus, RotateCcw, SkipBack, SkipForward, Trash2, TriangleAlert, Wrench } from 'lucide-react';
import type { Frame } from '../types';
import styles from './Timeline.module.css';

interface TimelineProps {
  variant?: 'bottom' | 'sidebar';
  currentFrameIndex: number;
  frames: Frame[];
  unanimatableTransitionIndices?: number[];
  onFixTransition?: (transitionIndex: number) => void;
  isPlaying?: boolean;
  onAddFrame: () => void;
  onDeleteFrame: (frameIndex: number) => void;
  onDuplicateFrame: (frameIndex: number) => void;
  onRenameFrame: (frameIndex: number, name: string) => void;
  onSelectFrame: (index: number) => void;
  onOpenLayers?: (frameIndex: number) => void;
  onTogglePlaying?: () => void;
  onStepBackward?: () => void;
  onStepForward?: () => void;
  onReplayFromStart?: () => void;
  playSpeed?: number;
  onSetPlaySpeed?: (speed: number) => void;
}

const joinClasses = (...classNames: Array<string | false | undefined>) => classNames.filter(Boolean).join(' ');

export default function Timeline({
  variant = 'bottom',
  currentFrameIndex,
  frames,
  unanimatableTransitionIndices = [],
  onFixTransition = () => undefined,
  isPlaying = false,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  onRenameFrame,
  onSelectFrame,
  onOpenLayers,
  onTogglePlaying = () => undefined,
  onStepBackward = () => undefined,
  onStepForward = () => undefined,
  onReplayFromStart = () => undefined,
  playSpeed = 2000,
  onSetPlaySpeed = () => undefined,
}: TimelineProps) {
  const [editingFrameIndex, setEditingFrameIndex] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const lastPointerTypeRef = useRef<string | null>(null);
  const unanimatableTransitionIndexSet = new Set(unanimatableTransitionIndices);

  useEffect(() => {
    if (editingFrameIndex === null) return;

    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  }, [editingFrameIndex]);

  useEffect(() => {
    if (editingFrameIndex !== null && !frames[editingFrameIndex]) {
      setEditingFrameIndex(null);
    }
  }, [editingFrameIndex, frames]);

  const startEditing = (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setEditingFrameIndex(index);
    setDraftTitle(frames[index].name);
  };

  const cancelEditing = () => {
    setEditingFrameIndex(null);
    setDraftTitle('');
  };

  const commitEditing = () => {
    if (editingFrameIndex === null) return;

    const trimmedTitle = draftTitle.trim();
    if (trimmedTitle) {
      onRenameFrame(editingFrameIndex, trimmedTitle);
    }
    cancelEditing();
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitEditing();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  };

  const handleTitlePointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    lastPointerTypeRef.current = event.pointerType;
  };

  const handleTitleTouchStart = () => {
    lastPointerTypeRef.current = 'touch';
  };

  const handleTitleClick = (index: number, event: React.MouseEvent<HTMLSpanElement>) => {
    const pointerType = lastPointerTypeRef.current;
    lastPointerTypeRef.current = null;

    if (pointerType === 'touch') {
      startEditing(index, event);
    }
  };

  const isNewScenario = frames.length === 1
    && frames[0].name === 'Frame 1'
    && frames[0].boats.length === 0
    && frames[0].marks.length === 0
    && (frames[0].arrows?.length ?? 0) === 0
    && (frames[0].comments?.length ?? 0) === 0
    && (frames[0].images?.length ?? 0) === 0;

  return (
    <footer className={joinClasses(styles.timelineBar, variant === 'sidebar' && styles.sidebarTimeline)}>
      {variant !== 'sidebar' && <div className={styles.playbackControls}>
        <button
          type="button"
          className={joinClasses(styles.timelineActionButton, styles.playbackStepButton)}
          aria-label="Step backward"
          title="Step backward"
          onClick={onStepBackward}
          disabled={currentFrameIndex <= 0}
        >
          <span className={styles.timelineControlIcon} aria-hidden="true"><SkipBack size={16} /></span>
          <span className={styles.timelineControlLabel}>Backward</span>
        </button>
        <button type="button" className={joinClasses(styles.playPauseButton, isPlaying && styles.playing)} aria-label={isPlaying ? 'Pause' : 'Play'} onClick={onTogglePlaying}>
          <span className={styles.timelineControlIcon} aria-hidden="true">{isPlaying ? <Pause size={16} /> : <Play size={16} />}</span>
        </button>
        <button
          type="button"
          className={joinClasses(styles.timelineActionButton, styles.playbackStepButton)}
          aria-label="Step forward"
          title="Step forward"
          onClick={onStepForward}
          disabled={currentFrameIndex >= frames.length - 1}
        >
          <span className={styles.timelineControlIcon} aria-hidden="true"><SkipForward size={16} /></span>
          <span className={styles.timelineControlLabel}>Forward</span>
        </button>
        <button
          type="button"
          className={joinClasses(styles.timelineActionButton, styles.playbackReplayButton)}
          aria-label="Replay from start"
          title="Replay from start"
          onClick={onReplayFromStart}
        >
          <span className={styles.timelineControlIcon} aria-hidden="true"><RotateCcw size={16} /></span>
          <span className={styles.timelineControlLabel}>Replay</span>
        </button>
        <select className={styles.speedSelector} value={playSpeed} onChange={(event) => onSetPlaySpeed(Number(event.target.value))} aria-label="Playback speed">
          <option value="5000">Slow (5s)</option>
          <option value="2000">Normal (2s)</option>
          <option value="1000">Fast (1s)</option>
          <option value="500">Very fast (0.5s)</option>
        </select>
        <button type="button" className={styles.timelineActionButton} aria-label="Add frame" onClick={onAddFrame}>
          <span className={styles.timelineControlIcon} aria-hidden="true"><Plus size={16} /></span>
          <span className={styles.timelineControlLabel}>Add Frame</span>
        </button>
        <button type="button" className={styles.timelineActionButton} aria-label="Duplicate frame" onClick={() => onDuplicateFrame(currentFrameIndex)}>
          <span className={styles.timelineControlIcon} aria-hidden="true"><Copy size={16} /></span>
          <span className={styles.timelineControlLabel}>Duplicate</span>
        </button>
        <button type="button" className={joinClasses(styles.timelineActionButton, styles.deleteFrameButton)} aria-label="Delete frame" onClick={() => onDeleteFrame(currentFrameIndex)} disabled={frames.length <= 1}>
          <span className={styles.timelineControlIcon} aria-hidden="true"><Trash2 size={16} /></span>
          <span className={styles.timelineControlLabel}>Delete</span>
        </button>
      </div>}
      <div className={styles.framesScrubber} aria-label="Scenario frames">
        {frames.map((frame, index) => {
          const isEditing = editingFrameIndex === index;
          const hasUnanimatableIncomingTransition = unanimatableTransitionIndexSet.has(index - 1);
          const hasUnanimatableOutgoingTransition = unanimatableTransitionIndexSet.has(index);
          const hasUnanimatableTransition = hasUnanimatableIncomingTransition || hasUnanimatableOutgoingTransition;
          const thumbnailClassName = joinClasses(styles.frameThumbnail, index === currentFrameIndex && styles.active);
          const thumbnailRowClassName = joinClasses(
            styles.frameThumbnailRow,
            variant === 'sidebar' && onOpenLayers && styles.hasLayersButton,
            index === currentFrameIndex && styles.hasEditButton,
            variant === 'sidebar' && hasUnanimatableTransition && styles.hasUnanimatableTransition,
          );
          const editingThumbnailRowClassName = joinClasses(
            styles.frameThumbnailRow,
            variant === 'sidebar' && onOpenLayers && styles.hasLayersButton,
            variant === 'sidebar' && hasUnanimatableTransition && styles.hasUnanimatableTransition,
          );
          const transitionWarningLabel = hasUnanimatableIncomingTransition
            ? `Transition from frame ${index} to frame ${index + 1} cannot be animated`
            : '';

          if (isEditing) {
            return (
              <Fragment key={frame.id}>
                {variant === 'sidebar' && hasUnanimatableIncomingTransition && (
                  <div className={styles.frameTransitionWarning} role="status" aria-label={transitionWarningLabel} title={transitionWarningLabel}>
                    <TriangleAlert aria-hidden="true" size={14} />
                    <span>Cannot animate transition</span>
                    <button
                      type="button"
                      className={styles.frameTransitionFixButton}
                      aria-label={`Fix transition from frame ${index} to frame ${index + 1}`}
                      title="Fix transition"
                      onClick={(event) => {
                        event.stopPropagation();
                        onFixTransition(index - 1);
                      }}
                    >
                      <Wrench aria-hidden="true" size={12} />
                      <span>Fix</span>
                    </button>
                  </div>
                )}
                <div className={editingThumbnailRowClassName}>
                <div className={thumbnailClassName} role="group" aria-label={`Edit frame ${index + 1}`}>
                  <span className={styles.thumbnailNum}>{index + 1}</span>
                  <input
                    ref={titleInputRef}
                    type="text"
                    className={styles.thumbnailTitleInput}
                    aria-label={`Frame ${index + 1} title`}
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={commitEditing}
                  />
                </div>
                <button
                  type="button"
                  className={styles.frameDuplicateButton}
                  aria-label={`Duplicate frame ${index + 1}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDuplicateFrame(index);
                  }}
                >
                  <Copy aria-hidden="true" size={14} />
                </button>
                {variant === 'sidebar' && onOpenLayers && (
                  <button
                    type="button"
                    className={styles.frameLayersButton}
                    aria-label={`Show layers for frame ${index + 1}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenLayers(index);
                    }}
                  >
                    <Layers aria-hidden="true" size={14} />
                  </button>
                )}
                <button
                  type="button"
                  className={styles.frameDeleteButton}
                  aria-label={`Delete frame ${index + 1}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteFrame(index);
                  }}
                  disabled={frames.length <= 1}
                >
                  <Trash2 aria-hidden="true" size={14} />
                </button>
                </div>
              </Fragment>
            );
          }

          return (
            <Fragment key={frame.id}>
              {variant === 'sidebar' && hasUnanimatableIncomingTransition && (
                <div className={styles.frameTransitionWarning} role="status" aria-label={transitionWarningLabel} title={transitionWarningLabel}>
                  <TriangleAlert aria-hidden="true" size={14} />
                  <span>Cannot animate transition</span>
                  <button
                    type="button"
                    className={styles.frameTransitionFixButton}
                    aria-label={`Fix transition from frame ${index} to frame ${index + 1}`}
                    title="Fix transition"
                    onClick={(event) => {
                      event.stopPropagation();
                      onFixTransition(index - 1);
                    }}
                  >
                    <Wrench aria-hidden="true" size={12} />
                    <span>Fix</span>
                  </button>
                </div>
              )}
              <div className={thumbnailRowClassName}>
              <button
                type="button"
                className={thumbnailClassName}
                onClick={() => onSelectFrame(index)}
                aria-current={index === currentFrameIndex ? 'step' : undefined}
              >
                <span className={styles.thumbnailNum}>{index + 1}</span>
                <span
                  className={styles.thumbnailTitle}
                  onClick={(event) => handleTitleClick(index, event)}
                  onDoubleClick={(event) => startEditing(index, event)}
                  onPointerDown={handleTitlePointerDown}
                  onTouchStart={handleTitleTouchStart}
                  title="Tap or double-click to edit"
                >
                  {frame.name}
                </span>
              </button>
              {index === currentFrameIndex && (
                <button
                  type="button"
                  className={styles.frameEditButton}
                  aria-label={`Edit frame ${index + 1}`}
                  onClick={(event) => startEditing(index, event)}
                >
                  <Pencil aria-hidden="true" size={13} />
                  <span>Edit</span>
                </button>
              )}
              {variant === 'sidebar' && onOpenLayers && (
                <button
                  type="button"
                  className={styles.frameLayersButton}
                  aria-label={`Show layers for frame ${index + 1}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenLayers(index);
                  }}
                >
                  <Layers aria-hidden="true" size={14} />
                </button>
              )}
              <button
                type="button"
                className={styles.frameDuplicateButton}
                aria-label={`Duplicate frame ${index + 1}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDuplicateFrame(index);
                }}
              >
                <Copy aria-hidden="true" size={14} />
              </button>
              <button
                type="button"
                className={styles.frameDeleteButton}
                aria-label={`Delete frame ${index + 1}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteFrame(index);
                }}
                disabled={frames.length <= 1}
              >
                <Trash2 aria-hidden="true" size={14} />
              </button>
              </div>
            </Fragment>
          );
        })}
      </div>
      {isNewScenario && (
        <p className={styles.timelineContextHint} role="status">
          <Pencil aria-hidden="true" size={14} />
          <span>Select a frame, then choose Edit to rename it.</span>
        </p>
      )}
      {variant === 'sidebar' && (
        <button type="button" className={joinClasses(styles.timelineActionButton, styles.sidebarAddFrameButton)} aria-label="Add frame" onClick={onAddFrame}>
          <span className={styles.timelineControlIcon} aria-hidden="true"><Plus size={16} /></span>
          <span className={styles.timelineControlLabel}>Add Frame</span>
        </button>
      )}
    </footer>
  );
}
