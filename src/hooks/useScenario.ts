import { useEffect, useRef, useState } from 'react';
import { BOAT_COLORS, MARK_COLORS } from '../constants';
import { cloneFrames } from '../data/initialFrames';
import type {
  Boat,
  CommentNote,
  DiagramImage,
  Frame,
  Mark,
  RuleReference,
  ScenarioExportPayload,
  ScenarioRepositoryItem,
  ScenarioSettings,
  TacticalArrow,
} from '../types';
import { calculateAutoSailAngle, interpolateFrame, type Position } from '../utils/simulation';
import { parseScenarioFromJson } from '../utils/exporter';
import { deleteScenarioRepositoryItem, listScenarioRepositoryItems, loadScenarioRepositoryItem, saveScenarioRepositoryItem } from '../utils/repository';

export type SelectedType = 'boat' | 'mark' | 'arrow' | 'comment' | 'image' | 'wind' | 'grid' | 'playback' | null;

const AUTOSAVE_KEY = 'tack-wise-autosave';
const MAX_HISTORY_LENGTH = 50;

export const DEFAULT_SCENARIO_SETTINGS: ScenarioSettings = {
  animationMode: 'step',
  displayMode: 'single',
  presenterMode: false,
};

interface HistoryState {
  past: Frame[][];
  future: Frame[][];
}

function cloneScenarioFrames(frames: Frame[]) {
  return cloneFrames(frames);
}

function scenarioFramesFromPayload(payload: ScenarioExportPayload) {
  return cloneScenarioFrames(payload.frames);
}

export function useScenario() {
  const [frames, setFrames] = useState<Frame[]>(() => cloneFrames());
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>('boat-1');
  const [selectedType, setSelectedType] = useState<SelectedType>('boat');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const [autoSailTrim, setAutoSailTrim] = useState(true);
  const [frameProgress, setFrameProgress] = useState(0);
  const [settings, setSettings] = useState<ScenarioSettings>(DEFAULT_SCENARIO_SETTINGS);
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  const [hasAutosave, setHasAutosave] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.localStorage.getItem(AUTOSAVE_KEY));
  });
  const [libraryItems, setLibraryItems] = useState<ScenarioRepositoryItem[]>(() => listScenarioRepositoryItems());
  const skipInitialAutosaveRef = useRef(true);

  const activeFrame = frames[currentFrameIndex] ?? frames[0];
  const selectedBoat = activeFrame.boats.find((boat) => boat.id === selectedId);
  const selectedMark = activeFrame.marks.find((mark) => mark.id === selectedId);
  const selectedArrow = activeFrame.arrows?.find((arrow) => arrow.id === selectedId);
  const selectedComment = activeFrame.comments?.find((comment) => comment.id === selectedId);
  const selectedImage = activeFrame.images?.find((image) => image.id === selectedId);

  useEffect(() => {
    if (!isPlaying) {
      setFrameProgress(0);
      return undefined;
    }

    if (settings.animationMode === 'continuous') {
      const interval = window.setInterval(() => {
        setFrameProgress((progress) => {
          const nextProgress = progress + 50 / Math.max(playSpeed, 50);
          if (nextProgress < 1) return nextProgress;

          setCurrentFrameIndex((index) => (index >= frames.length - 1 ? 0 : index + 1));
          return 0;
        });
      }, 50);

      return () => window.clearInterval(interval);
    }

    const interval = window.setInterval(() => {
      setCurrentFrameIndex((index) => (index >= frames.length - 1 ? 0 : index + 1));
    }, playSpeed);

    return () => window.clearInterval(interval);
  }, [frames.length, isPlaying, playSpeed, settings.animationMode]);

  useEffect(() => {
    if (!autoSailTrim) return;

    setFrames((previousFrames) =>
      previousFrames.map((frame) => ({
        ...frame,
        boats: frame.boats.map((boat) => ({
          ...boat,
          sailAngle: calculateAutoSailAngle(boat.heading, frame.windAngle),
        })),
      })),
    );
  }, [activeFrame.windAngle, autoSailTrim]);

  useEffect(() => {
    if (skipInitialAutosaveRef.current) {
      skipInitialAutosaveRef.current = false;
      return;
    }

    try {
      window.localStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify({ version: 2, frames, currentFrameIndex, settings }),
      );
      setHasAutosave(true);
    } catch {
      // Storage can be unavailable in private browsing or restricted embeds.
    }
  }, [currentFrameIndex, frames, settings]);

  const commitFrames = (updater: (previousFrames: Frame[]) => Frame[]) => {
    setFrames((previousFrames) => {
      const nextFrames = updater(previousFrames);
      if (nextFrames === previousFrames) return previousFrames;

      setHistory((previousHistory) => ({
        past: [...previousHistory.past, cloneScenarioFrames(previousFrames)].slice(-MAX_HISTORY_LENGTH),
        future: [],
      }));
      return nextFrames;
    });
  };

  const selectFrame = (index: number) => {
    setIsPlaying(false);
    setFrameProgress(0);
    setCurrentFrameIndex(index);
  };

  const selectObject = (id: string, type: Exclude<SelectedType, null>) => {
    setSelectedId(id);
    setSelectedType(type);
  };

  const clearSelection = () => {
    setSelectedId(null);
    setSelectedType(null);
  };

  const updateActiveFrame = (changes: Partial<Frame>) => {
    commitFrames((previousFrames) =>
      previousFrames.map((frame, index) =>
        index === currentFrameIndex ? { ...frame, ...changes } : frame,
      ),
    );
  };

  const renameFrame = (frameIndex: number, name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    commitFrames((previousFrames) =>
      previousFrames.map((frame, index) =>
        index === frameIndex ? { ...frame, name: trimmedName } : frame,
      ),
    );
  };

  const updateBoat = (boatId: string, changes: Partial<Boat>) => {
    commitFrames((previousFrames) =>
      previousFrames.map((frame, index) => {
        if (index !== currentFrameIndex) return frame;

        return {
          ...frame,
          boats: frame.boats.map((boat) => {
            if (boat.id !== boatId) return boat;

            const updatedBoat = { ...boat, ...changes };
            if (autoSailTrim && (changes.heading !== undefined || changes.sailAngle === undefined)) {
              updatedBoat.sailAngle = calculateAutoSailAngle(updatedBoat.heading, frame.windAngle);
            }
            return updatedBoat;
          }),
        };
      }),
    );
  };

  const updateMark = (markId: string, changes: Partial<Mark>) => {
    commitFrames((previousFrames) =>
      previousFrames.map((frame, index) =>
        index === currentFrameIndex
          ? {
              ...frame,
              marks: frame.marks.map((mark) =>
                mark.id === markId ? { ...mark, ...changes } : mark,
              ),
            }
          : frame,
      ),
    );
  };

  const updateArrow = (arrowId: string, changes: Partial<TacticalArrow>) => {
    commitFrames((previousFrames) =>
      previousFrames.map((frame, index) =>
        index === currentFrameIndex
          ? { ...frame, arrows: (frame.arrows ?? []).map((arrow) => arrow.id === arrowId ? { ...arrow, ...changes } : arrow) }
          : frame,
      ),
    );
  };

  const updateComment = (commentId: string, changes: Partial<CommentNote>) => {
    commitFrames((previousFrames) =>
      previousFrames.map((frame, index) =>
        index === currentFrameIndex
          ? { ...frame, comments: (frame.comments ?? []).map((comment) => comment.id === commentId ? { ...comment, ...changes } : comment) }
          : frame,
      ),
    );
  };

  const updateImage = (imageId: string, changes: Partial<DiagramImage>) => {
    commitFrames((previousFrames) =>
      previousFrames.map((frame, index) =>
        index === currentFrameIndex
          ? { ...frame, images: (frame.images ?? []).map((image) => image.id === imageId ? { ...image, ...changes } : image) }
          : frame,
      ),
    );
  };

  const moveBoat = (boatId: string, position: Position) => updateBoat(boatId, position);
  const moveMark = (markId: string, position: Position) => updateMark(markId, position);
  const moveArrow = (arrowId: string, points: TacticalArrow['points']) => updateArrow(arrowId, { points });
  const moveComment = (commentId: string, position: Position) => updateComment(commentId, position);
  const moveImage = (imageId: string, position: Position) => updateImage(imageId, position);

  const addFrame = () => {
    setIsPlaying(false);
    const newFrame: Frame = {
      ...cloneScenarioFrames([activeFrame])[0],
      id: `frame-${Date.now()}`,
      name: `Frame ${frames.length + 1}`,
    };
    commitFrames((previousFrames) => [...previousFrames, newFrame]);
    setCurrentFrameIndex(frames.length);
  };

  const duplicateFrame = (frameIndex = currentFrameIndex) => {
    setIsPlaying(false);
    const sourceFrame = frames[frameIndex] ?? activeFrame;
    const newFrame: Frame = {
      ...cloneScenarioFrames([sourceFrame])[0],
      id: `frame-${Date.now()}`,
      name: `${sourceFrame.name} (Copy)`,
    };
    commitFrames((previousFrames) => {
      const nextFrames = [...previousFrames];
      nextFrames.splice(frameIndex + 1, 0, newFrame);
      return nextFrames;
    });
    setCurrentFrameIndex(frameIndex + 1);
  };

  const deleteFrame = (indexToDelete: number) => {
    if (frames.length <= 1) return;

    setIsPlaying(false);
    commitFrames((previousFrames) => previousFrames.filter((_, index) => index !== indexToDelete));
    setCurrentFrameIndex(Math.max(0, indexToDelete - 1));
  };

  const importScenario = (payload: ScenarioExportPayload) => {
    const importedFrames = scenarioFramesFromPayload(payload);
    const importedFrame = importedFrames[payload.currentFrameIndex];
    const firstBoat = importedFrame.boats[0];
    const firstMark = importedFrame.marks[0];
    const firstArrow = importedFrame.arrows?.[0];
    const firstComment = importedFrame.comments?.[0];

    setIsPlaying(false);
    setFrameProgress(0);
    setFrames(importedFrames);
    setCurrentFrameIndex(payload.currentFrameIndex);
    setSettings(payload.settings ?? DEFAULT_SCENARIO_SETTINGS);
    setHistory({ past: [], future: [] });
    setSelectedId(firstBoat?.id ?? firstMark?.id ?? firstArrow?.id ?? firstComment?.id ?? null);
    setSelectedType(firstBoat ? 'boat' : firstMark ? 'mark' : firstArrow ? 'arrow' : firstComment ? 'comment' : null);
  };

  const restoreAutosave = () => {
    try {
      const raw = window.localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return false;
      importScenario(parseScenarioFromJson(raw));
      return true;
    } catch {
      return false;
    }
  };

  const clearAutosave = () => {
    window.localStorage.removeItem(AUTOSAVE_KEY);
    setHasAutosave(false);
  };

  const saveToLibrary = (title: string) => {
    const item = saveScenarioRepositoryItem(title, {
      version: 2,
      frames: cloneScenarioFrames(frames),
      currentFrameIndex,
      settings,
    });
    setLibraryItems((items) => [item, ...items]);
  };

  const loadFromLibrary = (id: string) => {
    const item = loadScenarioRepositoryItem(id);
    if (!item) return false;
    importScenario(item.payload);
    return true;
  };

  const deleteFromLibrary = (id: string) => {
    deleteScenarioRepositoryItem(id);
    setLibraryItems((items) => items.filter((item) => item.id !== id));
  };

  const undo = () => {
    const previousEntry = history.past.at(-1);
    if (!previousEntry) return;

    setFrames(cloneScenarioFrames(previousEntry));
    setHistory({
      past: history.past.slice(0, -1),
      future: [cloneScenarioFrames(frames), ...history.future],
    });
  };

  const redo = () => {
    const nextEntry = history.future[0];
    if (!nextEntry) return;

    setFrames(cloneScenarioFrames(nextEntry));
    setHistory({
      past: [...history.past, cloneScenarioFrames(frames)],
      future: history.future.slice(1),
    });
  };

  const addBoat = () => {
    const newBoat: Boat = {
      id: `boat-${Date.now()}`,
      name: `Boat ${activeFrame.boats.length + 1}`,
      color: BOAT_COLORS[activeFrame.boats.length % BOAT_COLORS.length],
      x: 100 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      heading: 0,
      sailAngle: 0,
      boatClass: 'dinghy',
      sailPlan: 'main',
    };

    commitFrames((previousFrames) =>
      previousFrames.map((frame) => ({
        ...frame,
        boats: [
          ...frame.boats,
          { ...newBoat, sailAngle: calculateAutoSailAngle(newBoat.heading, frame.windAngle) },
        ],
      })),
    );
    selectObject(newBoat.id, 'boat');
  };

  const addMark = (shape: Mark['shape'] = 'circle') => {
    const newMark: Mark = {
      id: `mark-${Date.now()}`,
      name: shape === 'obstruction' ? 'Obstruction' : shape === 'gate' ? 'Gate' : `Mark ${activeFrame.marks.length + 1}`,
      color: MARK_COLORS[activeFrame.marks.length % MARK_COLORS.length],
      x: 150 + Math.random() * 300,
      y: 150 + Math.random() * 200,
      shape,
      size: shape === 'obstruction' ? 60 : 28,
      showRotationArrow: false,
      rotationDirection: 'counterclockwise',
    };

    commitFrames((previousFrames) =>
      previousFrames.map((frame) => ({ ...frame, marks: [...frame.marks, { ...newMark }] })),
    );
    selectObject(newMark.id, 'mark');
  };

  const addArrow = () => {
    const arrow: TacticalArrow = {
      id: `arrow-${Date.now()}`,
      name: `Arrow ${(activeFrame.arrows?.length ?? 0) + 1}`,
      color: '#f97316',
      points: [{ x: 180, y: 240 }, { x: 320, y: 180 }],
      curved: true,
      lineStyle: 'solid',
      lineWidth: 3,
      showArrowhead: true,
    };
    commitFrames((previousFrames) => previousFrames.map((frame) => ({ ...frame, arrows: [...(frame.arrows ?? []), { ...arrow, points: arrow.points.map((point) => ({ ...point })) }] })));
    selectObject(arrow.id, 'arrow');
  };

  const addComment = () => {
    const comment: CommentNote = {
      id: `comment-${Date.now()}`,
      name: `Comment ${(activeFrame.comments?.length ?? 0) + 1}`,
      text: 'Explain this situation',
      color: '#f8fafc',
      x: 180,
      y: 100,
      width: 180,
      fontSize: 14,
    };
    commitFrames((previousFrames) => previousFrames.map((frame) => ({ ...frame, comments: [...(frame.comments ?? []), { ...comment }] })));
    selectObject(comment.id, 'comment');
  };

  const addImage = (src: string, name = 'Diagram image') => {
    const image: DiagramImage = {
      id: `image-${Date.now()}`,
      name,
      src,
      x: 180,
      y: 140,
      width: 180,
      height: 120,
      rotation: 0,
    };
    commitFrames((previousFrames) => previousFrames.map((frame) => ({ ...frame, images: [...(frame.images ?? []), { ...image }] })));
    selectObject(image.id, 'image');
  };

  const deleteSelected = () => {
    if (!selectedId || selectedType === 'wind' || selectedType === 'grid' || selectedType === 'playback') {
      clearSelection();
      return;
    }

    commitFrames((previousFrames) =>
      previousFrames.map((frame) => ({
        ...frame,
        boats: frame.boats.filter((boat) => boat.id !== selectedId),
        marks: frame.marks
          .filter((mark) => mark.id !== selectedId)
          .map((mark) => mark.connectedToMarkId === selectedId ? { ...mark, connectedToMarkId: null } : mark),
        arrows: frame.arrows?.filter((arrow) => arrow.id !== selectedId),
        comments: frame.comments?.filter((comment) => comment.id !== selectedId),
        images: frame.images?.filter((image) => image.id !== selectedId),
      })),
    );
    setSelectedId(null);
    setSelectedType(null);
  };

  const updateSettings = (changes: Partial<ScenarioSettings>) => {
    setSettings((previousSettings) => ({ ...previousSettings, ...changes }));
  };

  const addRuleToActiveFrame = (rule: RuleReference) => {
    commitFrames((previousFrames) => previousFrames.map((frame, index) => index === currentFrameIndex ? { ...frame, rules: [...(frame.rules ?? []), rule] } : frame));
  };

  return {
    activeFrame,
    autoSailTrim,
    clearAutosave,
    clearSelection,
    currentFrameIndex,
    deleteFrame,
    deleteSelected,
    duplicateFrame,
    frames,
    displayFrame: settings.animationMode === 'continuous' && isPlaying
      ? interpolateFrame(activeFrame, frames[currentFrameIndex + 1], frameProgress)
      : activeFrame,
    frameProgress,
    hasAutosave,
    libraryItems,
    importScenario,
    isPlaying,
    moveArrow,
    moveBoat,
    moveComment,
    moveImage,
    moveMark,
    addArrow,
    addBoat,
    addComment,
    addFrame,
    addImage,
    addMark,
    addRuleToActiveFrame,
    playSpeed,
    saveToLibrary,
    loadFromLibrary,
    deleteFromLibrary,
    redo,
    renameFrame,
    restoreAutosave,
    selectFrame,
    selectObject,
    selectedArrow,
    selectedBoat,
    selectedComment,
    selectedId,
    selectedImage,
    selectedMark,
    selectedType,
    setAutoSailTrim,
    setCurrentFrameIndex,
    setIsPlaying,
    setPlaySpeed,
    settings,
    undo,
    updateActiveFrame,
    updateArrow,
    updateBoat,
    updateComment,
    updateImage,
    updateMark,
    updateSettings,
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
  };
}
