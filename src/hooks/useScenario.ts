import { useEffect, useRef, useState } from 'react';
import { BOAT_COLORS, DEFAULT_BOAT_ASPECT_RATIO, DEFAULT_OBSTRUCTION_PROXIMITY_RADIUS, MARK_COLORS } from '../constants';
import { cloneFrames, initialScenarioTitle } from '../data/initialFrames';
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
import { calculateAutoSailAngle, type Position } from '../utils/simulation';
import { getCurvedArrowPoints } from '../utils/arrows';
import { parseScenarioFromJson } from '../utils/exporter';
import { deleteScenarioRepositoryItem, listScenarioRepositoryItems, loadScenarioRepositoryItem, saveScenarioRepositoryItem } from '../utils/repository';

export type SelectedType = 'boat' | 'mark' | 'arrow' | 'comment' | 'image' | 'wind' | 'grid' | 'playback' | null;

const AUTOSAVE_KEY = 'tack-wise-autosave';
const MAX_HISTORY_LENGTH = 50;

export const DEFAULT_SCENARIO_SETTINGS: ScenarioSettings = {
  title: initialScenarioTitle,
  displayMode: 'single',
  presenterMode: false,
  showFrameTitle: true,
  showFrameNumber: true,
};

interface HistoryState {
  past: Frame[][];
  future: Frame[][];
}

interface InitialScenarioState {
  frames: Frame[];
  currentFrameIndex: number;
  settings: ScenarioSettings;
  selectedId: string | null;
  selectedType: SelectedType;
}

function cloneScenarioFrames(frames: Frame[]) {
  return cloneFrames(frames);
}

function scenarioFramesFromPayload(payload: ScenarioExportPayload) {
  return cloneScenarioFrames(payload.frames);
}

function readAutosave(): ScenarioExportPayload | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(AUTOSAVE_KEY);
    return raw ? parseScenarioFromJson(raw) : null;
  } catch {
    return null;
  }
}

function getInitialScenarioState(): InitialScenarioState {
  const autosave = readAutosave();
  const frames = autosave ? scenarioFramesFromPayload(autosave) : cloneFrames();
  const currentFrameIndex = autosave?.currentFrameIndex ?? 0;
  const activeFrame = frames[currentFrameIndex] ?? frames[0];
  const firstBoat = activeFrame.boats[0];
  const firstMark = activeFrame.marks[0];
  const firstArrow = activeFrame.arrows?.[0];
  const firstComment = activeFrame.comments?.[0];
  const firstImage = activeFrame.images?.[0];

  return {
    frames,
    currentFrameIndex,
    settings: autosave?.settings ? { ...autosave.settings } : DEFAULT_SCENARIO_SETTINGS,
    selectedId: firstBoat?.id ?? firstMark?.id ?? firstArrow?.id ?? firstComment?.id ?? firstImage?.id ?? null,
    selectedType: firstBoat ? 'boat' : firstMark ? 'mark' : firstArrow ? 'arrow' : firstComment ? 'comment' : firstImage ? 'image' : null,
  };
}

export function useScenario() {
  const [initialScenario] = useState<InitialScenarioState>(getInitialScenarioState);
  const [frames, setFrames] = useState<Frame[]>(initialScenario.frames);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(initialScenario.currentFrameIndex);
  const [selectedId, setSelectedId] = useState<string | null>(initialScenario.selectedId);
  const [selectedType, setSelectedType] = useState<SelectedType>(initialScenario.selectedType);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const [autoSailTrim, setAutoSailTrim] = useState(true);
  const [settings, setSettings] = useState<ScenarioSettings>(initialScenario.settings);
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  const [hasAutosave, setHasAutosave] = useState(() => {
    return Boolean(readAutosave());
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
    if (!isPlaying) return undefined;

    const interval = window.setInterval(() => {
      setCurrentFrameIndex((index) => (index >= frames.length - 1 ? 0 : index + 1));
    }, playSpeed);

    return () => window.clearInterval(interval);
  }, [frames.length, isPlaying, playSpeed]);

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
    setCurrentFrameIndex(index);
  };

  const stepFrame = (direction: 1 | -1) => {
    setIsPlaying(false);
    setCurrentFrameIndex((index) => Math.min(Math.max(index + direction, 0), frames.length - 1));
  };

  const stepBackward = () => stepFrame(-1);
  const stepForward = () => stepFrame(1);

  const replayFromStart = () => {
    setCurrentFrameIndex(0);
    setIsPlaying(true);
  };

  const selectObject = (id: string, type: Exclude<SelectedType, null>) => {
    setSelectedId(id);
    setSelectedType(type);
  };

  const clearSelection = () => {
    setSelectedId(null);
    setSelectedType(null);
  };

  const createNewScenario = () => {
    setIsPlaying(false);
    setFrames([{
      id: `frame-${Date.now()}`,
      name: 'Frame 1',
      windAngle: 0,
      windSpeed: 12,
      boats: [],
      marks: [],
    }]);
    setCurrentFrameIndex(0);
    setSettings({
      ...DEFAULT_SCENARIO_SETTINGS,
      title: 'Untitled situation',
    });
    setHistory({ past: [], future: [] });
    clearSelection();
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

  const updateCurrentAndFutureFrames = (updater: (frame: Frame) => Frame) => {
    commitFrames((previousFrames) => previousFrames.map((frame, index) => (
      index >= currentFrameIndex ? updater(frame) : frame
    )));
  };

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
    setFrames(importedFrames);
    setCurrentFrameIndex(payload.currentFrameIndex);
    setSettings(payload.settings ? {
      title: payload.settings.title,
      displayMode: payload.settings.displayMode,
      presenterMode: payload.settings.presenterMode,
      showFrameTitle: payload.settings.showFrameTitle ?? true,
      showFrameNumber: payload.settings.showFrameNumber ?? true,
    } : DEFAULT_SCENARIO_SETTINGS);
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
      aspectRatio: DEFAULT_BOAT_ASPECT_RATIO,
    };

    updateCurrentAndFutureFrames((frame) => ({
      ...frame,
      boats: [
        ...frame.boats,
        { ...newBoat, sailAngle: calculateAutoSailAngle(newBoat.heading, frame.windAngle) },
      ],
    }));
    selectObject(newBoat.id, 'boat');
  };

  const addMark = (shape: Mark['shape'] = 'circle') => {
    const newMark: Mark = {
      id: `mark-${Date.now()}`,
      name: shape === 'obstruction'
        ? 'Obstruction'
        : shape === 'gate'
          ? 'Gate'
          : shape === 'committeeBoat'
            ? 'Committee boat'
            : `Mark ${activeFrame.marks.length + 1}`,
      color: MARK_COLORS[activeFrame.marks.length % MARK_COLORS.length],
      x: 150 + Math.random() * 300,
      y: 150 + Math.random() * 200,
      shape,
      size: shape === 'obstruction' ? 60 : 28,
      rotation: 0,
      proximityRadius: shape === 'obstruction' ? DEFAULT_OBSTRUCTION_PROXIMITY_RADIUS : undefined,
      showRotationArrow: false,
      rotationDirection: 'counterclockwise',
    };

    updateCurrentAndFutureFrames((frame) => ({
      ...frame,
      marks: [...frame.marks, { ...newMark }],
    }));
    selectObject(newMark.id, 'mark');
  };

  const addArrow = () => {
    const arrow: TacticalArrow = {
      id: `arrow-${Date.now()}`,
      name: `Arrow ${(activeFrame.arrows?.length ?? 0) + 1}`,
      color: '#f97316',
      points: getCurvedArrowPoints({ x: 180, y: 240 }, { x: 320, y: 180 }),
      curved: true,
      lineStyle: 'solid',
      lineWidth: 3,
      showArrowhead: true,
    };
    updateCurrentAndFutureFrames((frame) => ({
      ...frame,
      arrows: [
        ...(frame.arrows ?? []),
        { ...arrow, points: arrow.points.map((point) => ({ ...point })) },
      ],
    }));
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
    updateCurrentAndFutureFrames((frame) => ({
      ...frame,
      comments: [...(frame.comments ?? []), { ...comment }],
    }));
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
    updateCurrentAndFutureFrames((frame) => ({
      ...frame,
      images: [...(frame.images ?? []), { ...image }],
    }));
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
    createNewScenario,
    currentFrameIndex,
    deleteFrame,
    deleteSelected,
    duplicateFrame,
    frames,
    displayFrame: activeFrame,
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
    replayFromStart,
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
    stepBackward,
    stepForward,
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
