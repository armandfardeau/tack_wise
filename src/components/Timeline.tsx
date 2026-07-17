import { useEffect, useRef, useState } from 'react';
import type { Frame } from '../types';

interface TimelineProps {
  currentFrameIndex: number;
  frames: Frame[];
  isPlaying: boolean;
  onAddFrame: () => void;
  onDeleteFrame: () => void;
  onDuplicateFrame: () => void;
  onRenameFrame: (frameIndex: number, name: string) => void;
  onSelectFrame: (index: number) => void;
  onTogglePlaying: () => void;
  playSpeed: number;
  onSetPlaySpeed: (speed: number) => void;
}

export default function Timeline({
  currentFrameIndex,
  frames,
  isPlaying,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  onRenameFrame,
  onSelectFrame,
  onTogglePlaying,
  playSpeed,
  onSetPlaySpeed,
}: TimelineProps) {
  const [editingFrameIndex, setEditingFrameIndex] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const lastPointerTypeRef = useRef<string | null>(null);

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

  return (
    <footer className="timeline-bar">
      <div className="playback-controls">
        <button type="button" className={`play-pause-btn ${isPlaying ? 'playing' : ''}`} aria-label={isPlaying ? 'Pause' : 'Play'} onClick={onTogglePlaying}>
          <span className="timeline-control-icon" aria-hidden="true">{isPlaying ? '⏸️' : '▶️'}</span>
          <span className="timeline-control-label">{isPlaying ? 'Pause' : 'Play'}</span>
        </button>
        <select className="speed-selector" value={playSpeed} onChange={(event) => onSetPlaySpeed(Number(event.target.value))} aria-label="Playback speed">
          <option value="2000">Slow (2s)</option>
          <option value="1000">Normal (1s)</option>
          <option value="500">Fast (0.5s)</option>
        </select>
        <button type="button" className="timeline-action-btn" aria-label="Add frame" onClick={onAddFrame}>
          <span className="timeline-control-icon" aria-hidden="true">➕</span>
          <span className="timeline-control-label">Add Frame</span>
        </button>
        <button type="button" className="timeline-action-btn" aria-label="Duplicate frame" onClick={onDuplicateFrame}>
          <span className="timeline-control-icon" aria-hidden="true">📋</span>
          <span className="timeline-control-label">Duplicate</span>
        </button>
        <button type="button" className="timeline-action-btn delete-frame-btn" aria-label="Delete frame" onClick={onDeleteFrame} disabled={frames.length <= 1}>
          <span className="timeline-control-icon" aria-hidden="true">🗑️</span>
          <span className="timeline-control-label">Delete</span>
        </button>
      </div>
      <div className="frames-scrubber" aria-label="Scenario frames">
        {frames.map((frame, index) => {
          const isEditing = editingFrameIndex === index;
          const thumbnailClassName = `frame-thumbnail ${index === currentFrameIndex ? 'active' : ''}`;

          if (isEditing) {
            return (
              <div key={frame.id} className={thumbnailClassName} role="group" aria-label={`Edit frame ${index + 1}`}>
                <span className="thumbnail-num">{index + 1}</span>
                <input
                  ref={titleInputRef}
                  type="text"
                  className="thumbnail-title-input"
                  aria-label={`Frame ${index + 1} title`}
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={commitEditing}
                />
              </div>
            );
          }

          return (
            <button
              type="button"
              key={frame.id}
              className={thumbnailClassName}
              onClick={() => onSelectFrame(index)}
              aria-current={index === currentFrameIndex ? 'step' : undefined}
            >
              <span className="thumbnail-num">{index + 1}</span>
              <span
                className="thumbnail-title"
                onClick={(event) => handleTitleClick(index, event)}
                onDoubleClick={(event) => startEditing(index, event)}
                onPointerDown={handleTitlePointerDown}
                onTouchStart={handleTitleTouchStart}
                title="Tap or double-click to edit"
              >
                {frame.name}
              </span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
