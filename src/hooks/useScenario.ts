import { useEffect, useRef, useState } from 'react';
import { BOAT_COLORS, DEFAULT_OBSTRUCTION_PROXIMITY_RADIUS, MARK_COLORS } from '../constants';
import { cloneFrames, initialScenarioTitle } from '../data/initialFrames';
import type {
  Boat,
  CommentNote,
  DiagramImage,
  Frame,
  FrameComment,
  Mark,
  RuleComment,
  MarkConnection,
  RuleReference,
  ScenarioExportPayload,
  ScenarioRepositoryItem,
  ScenarioSettings,
  TacticalArrow,
} from '../types';
import { getRuleReferences } from '../types';
import { calculateAutoSailAngle, type Position } from '../utils/simulation';
import { getCurvedArrowPoints } from '../utils/arrows';
import { getMarkConnectionAnchors } from '../utils/markConnections';
import { parseScenarioFromJson } from '../utils/exporter';
import { deleteScenarioRepositoryItem, listScenarioRepositoryItems, loadScenarioRepositoryItem, saveScenarioRepositoryItem } from '../utils/repository';

export type SelectedType = 'boat' | 'mark' | 'connection' | 'arrow' | 'comment' | 'image' | 'wind' | 'grid' | 'playback' | null;

const AUTOSAVE_KEY = 'tack-wise-autosave';
const MAX_HISTORY_LENGTH = 50;
const DUPLICATE_OFFSET = 24;

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

function objectIdExists(frames: Frame[], id: string) {
  return frames.some((frame) => (
    frame.boats.some((boat) => boat.id === id)
      || frame.marks.some((mark) => mark.id === id)
      || frame.arrows?.some((arrow) => arrow.id === id)
      || frame.comments?.some((comment) => comment.id === id)
      || frame.images?.some((image) => image.id === id)
  ));
}

function createDuplicateId(type: Exclude<SelectedType, null>, frames: Frame[]) {
  const prefix = `${type}-`;
  let id = `${prefix}${Date.now()}`;
  let suffix = 1;

  while (objectIdExists(frames, id)) {
    id = `${prefix}${Date.now()}-${suffix}`;
    suffix += 1;
  }

  return id;
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
  const selectedConnection = activeFrame.connections?.find((connection) => connection.id === selectedId);
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

  const connectMarks = (
    sourceMarkId: string,
    targetMarkId: string,
    anchors?: { start?: MarkConnection['start']['anchor']; end?: MarkConnection['end']['anchor'] },
  ) => {
    commitFrames((previousFrames) => {
      let changed = false;

      const nextFrames = previousFrames.map((frame, index) => {
        if (index !== currentFrameIndex) return frame;

        const sourceMark = frame.marks.find((mark) => mark.id === sourceMarkId);
        const targetMark = frame.marks.find((mark) => mark.id === targetMarkId);
        if (!sourceMark || !targetMark || sourceMarkId === targetMarkId) return frame;

        const defaultAnchors = getMarkConnectionAnchors(sourceMark, targetMark);

        const connections = frame.connections ?? [];
        if (connections.some((connection) => connection.start.markId === sourceMarkId && connection.end.markId === targetMarkId)) return frame;

        const connectionIdBase = `mark-connection-${sourceMarkId}-${targetMarkId}`;
        let connectionId = connectionIdBase;
        let connectionIdSuffix = 2;
        while (connections.some((connection) => connection.id === connectionId)) {
          connectionId = `${connectionIdBase}-${connectionIdSuffix}`;
          connectionIdSuffix += 1;
        }

        changed = true;
        return {
          ...frame,
          connections: [
            ...connections,
            {
              id: connectionId,
              start: { markId: sourceMarkId, anchor: anchors?.start ?? defaultAnchors.start },
              end: { markId: targetMarkId, anchor: anchors?.end ?? defaultAnchors.end },
              color: sourceMark.connectionLineColor ?? sourceMark.color,
              style: sourceMark.connectionLineStyle ?? 'dotted',
              arrowhead: true,
            },
          ],
        };
      });

      return changed ? nextFrames : previousFrames;
    });
  };

  const removeMarkConnection = (connectionId: string) => {
    commitFrames((previousFrames) => {
      let changed = false;

      const nextFrames = previousFrames.map((frame, index) => {
        if (index !== currentFrameIndex) return frame;

        const connections = frame.connections ?? [];
        if (!connections.some((connection) => connection.id === connectionId)) return frame;

        changed = true;
        return { ...frame, connections: connections.filter((connection) => connection.id !== connectionId) };
      });

      return changed ? nextFrames : previousFrames;
    });
  };

  const updateConnection = (connectionId: string, changes: Partial<MarkConnection>) => {
    commitFrames((previousFrames) => {
      let changed = false;

      const nextFrames = previousFrames.map((frame, index) => {
        if (index !== currentFrameIndex) return frame;

        const connections = frame.connections ?? [];
        const connection = connections.find((candidate) => candidate.id === connectionId);
        if (!connection) return frame;

        const nextConnection = { ...connection, ...changes };
        const hasValidMarks = frame.marks.some((mark) => mark.id === nextConnection.start.markId)
          && frame.marks.some((mark) => mark.id === nextConnection.end.markId);
        const isSelfConnection = nextConnection.start.markId === nextConnection.end.markId;
        const duplicatesExisting = connections.some((candidate) => (
          candidate.id !== connectionId
          && candidate.start.markId === nextConnection.start.markId
          && candidate.end.markId === nextConnection.end.markId
        ));
        if (!hasValidMarks || isSelfConnection || duplicatesExisting) return frame;

        changed = true;
        return { ...frame, connections: connections.map((candidate) => candidate.id === connectionId ? nextConnection : candidate) };
      });

      return changed ? nextFrames : previousFrames;
    });
  };

  const replaceMarkConnection = (connectionId: string, nextTargetMarkId: string) => {
    const connection = activeFrame.connections?.find((candidate) => candidate.id === connectionId);
    if (!connection) return;

    const sourceMark = activeFrame.marks.find((mark) => mark.id === connection.start.markId);
    const targetMark = activeFrame.marks.find((mark) => mark.id === nextTargetMarkId);
    if (!sourceMark || !targetMark) return;

    updateConnection(connectionId, {
      end: { markId: nextTargetMarkId, anchor: getMarkConnectionAnchors(sourceMark, targetMark).end },
    });
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
          ? {
              ...frame,
              comments: (frame.comments ?? []).map((comment) => (
                comment.id === commentId && comment.type !== 'rule'
                  ? { ...comment, ...changes }
                  : comment
              )),
            }
          : frame,
      ),
    );
  };

  const updateRuleComment = (commentId: string, changes: Partial<RuleComment>) => {
    commitFrames((previousFrames) =>
      previousFrames.map((frame, index) => {
        if (index !== currentFrameIndex) return frame;

        const currentComment = frame.comments?.find((comment) => comment.id === commentId);
        if (!currentComment || currentComment.type !== 'rule') return frame;

        const currentReferences = getRuleReferences(currentComment);
        const updatedReferences = changes.rules ?? currentReferences;
        const currentReferenceIds = new Set(currentReferences.map((rule) => rule.id));
        const referencesUsedByOtherComments = new Set(
          (frame.comments ?? [])
            .filter((comment) => comment.id !== commentId && comment.type === 'rule')
            .flatMap((comment) => comment.type === 'rule' ? getRuleReferences(comment).map((rule) => rule.id) : []),
        );
        const retainedRules = (frame.rules ?? []).filter((rule) => !currentReferenceIds.has(rule.id) || referencesUsedByOtherComments.has(rule.id));
        const rules = [
          ...retainedRules,
          ...updatedReferences.filter((rule) => !retainedRules.some((existingRule) => existingRule.id === rule.id)),
        ];
        const updatedComment: RuleComment = { ...currentComment, ...changes, rules: updatedReferences };

        return {
          ...frame,
          comments: (frame.comments ?? []).map((comment) => comment.id === commentId ? updatedComment : comment),
          rules,
        };
      }),
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

  const addRuleComment = () => {
    const ruleId = `rule-${Date.now()}`;
    const ruleComment: RuleComment = {
      id: `rule-comment-${Date.now()}`,
      name: `Rule ${(activeFrame.comments?.filter((comment) => comment.type === 'rule').length ?? 0) + 1}`,
      type: 'rule',
      rules: activeFrame.rules?.length
        ? [{ ...activeFrame.rules[0] }]
        : [{ id: ruleId, label: 'RRS rule', description: 'Describe the rule and why the highlighted objects are in breach.' }],
      offenseTargets: [],
      color: '#facc15',
      x: 180,
      y: 100,
      width: 230,
      fontSize: 14,
    };

    updateCurrentAndFutureFrames((frame) => ({
      ...frame,
      comments: [...(frame.comments ?? []), { ...ruleComment, rules: ruleComment.rules?.map((rule) => ({ ...rule })), offenseTargets: [] }],
      rules: [
        ...(frame.rules ?? []),
        ...(ruleComment.rules ?? []).filter((rule) => !(frame.rules ?? []).some((existingRule) => existingRule.id === rule.id)),
      ],
    }));
    selectObject(ruleComment.id, 'comment');
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

    const selectedRuleComment = selectedType === 'comment'
      ? activeFrame.comments?.find((comment) => comment.id === selectedId)
      : undefined;
    const selectedRuleIds = selectedRuleComment?.type === 'rule'
      ? new Set(getRuleReferences(selectedRuleComment).map((rule) => rule.id))
      : new Set<string>();

    commitFrames((previousFrames) => previousFrames.map((frame, index) => {
      if (selectedType === 'connection' && index !== currentFrameIndex) return frame;

      return {
        ...frame,
        boats: frame.boats.filter((boat) => boat.id !== selectedId),
        marks: frame.marks.filter((mark) => mark.id !== selectedId),
        connections: frame.connections?.filter((connection) => (
          selectedType === 'connection'
            ? connection.id !== selectedId
            : connection.start.markId !== selectedId && connection.end.markId !== selectedId
        )),
        arrows: frame.arrows?.filter((arrow) => arrow.id !== selectedId),
        comments: frame.comments?.filter((comment) => comment.id !== selectedId),
        images: frame.images?.filter((image) => image.id !== selectedId),
        rules: selectedRuleIds.size > 0 ? frame.rules?.filter((rule) => !selectedRuleIds.has(rule.id)) : frame.rules,
      };
    }));
    setSelectedId(null);
    setSelectedType(null);
  };

  const duplicateSelected = () => {
    if (!selectedId || !selectedType || selectedType === 'wind' || selectedType === 'grid' || selectedType === 'playback') return;

    const duplicateId = createDuplicateId(selectedType, frames);
    const offsetPosition = (position: Position) => ({
      x: position.x + DUPLICATE_OFFSET,
      y: position.y + DUPLICATE_OFFSET,
    });

    if (selectedType === 'boat' && selectedBoat) {
      const duplicate: Boat = {
        ...selectedBoat,
        id: duplicateId,
        name: `${selectedBoat.name} (Copy)`,
        ...offsetPosition(selectedBoat),
      };
      updateCurrentAndFutureFrames((frame) => ({ ...frame, boats: [...frame.boats, { ...duplicate }] }));
    } else if (selectedType === 'mark' && selectedMark) {
      const duplicate: Mark = {
        ...selectedMark,
        id: duplicateId,
        name: `${selectedMark.name} (Copy)`,
        ...offsetPosition(selectedMark),
      };
      updateCurrentAndFutureFrames((frame) => ({ ...frame, marks: [...frame.marks, { ...duplicate }] }));
    } else if (selectedType === 'arrow' && selectedArrow) {
      const duplicate: TacticalArrow = {
        ...selectedArrow,
        id: duplicateId,
        name: `${selectedArrow.name} (Copy)`,
        points: selectedArrow.points.map(offsetPosition),
      };
      updateCurrentAndFutureFrames((frame) => ({
        ...frame,
        arrows: [...(frame.arrows ?? []), { ...duplicate, points: duplicate.points.map((point) => ({ ...point })) }],
      }));
    } else if (selectedType === 'comment' && selectedComment) {
      const duplicate: FrameComment = selectedComment.type === 'rule'
        ? {
            ...selectedComment,
            id: duplicateId,
            name: `${selectedComment.name} (Copy)`,
            ...offsetPosition(selectedComment),
            rules: selectedComment.rules?.map((rule) => ({ ...rule })),
            offenseTargets: selectedComment.offenseTargets.map((target) => ({ ...target })),
          }
        : {
            ...selectedComment,
            id: duplicateId,
            name: `${selectedComment.name} (Copy)`,
            ...offsetPosition(selectedComment),
          };
      updateCurrentAndFutureFrames((frame) => ({ ...frame, comments: [...(frame.comments ?? []), { ...duplicate }] }));
    } else if (selectedType === 'image' && selectedImage) {
      const duplicate: DiagramImage = {
        ...selectedImage,
        id: duplicateId,
        name: `${selectedImage.name} (Copy)`,
        ...offsetPosition(selectedImage),
      };
      updateCurrentAndFutureFrames((frame) => ({ ...frame, images: [...(frame.images ?? []), { ...duplicate }] }));
    } else {
      return;
    }

    selectObject(duplicateId, selectedType);
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
    connectMarks,
    createNewScenario,
    currentFrameIndex,
    deleteFrame,
    deleteSelected,
    duplicateSelected,
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
    removeMarkConnection,
    replaceMarkConnection,
    addArrow,
    addBoat,
    addComment,
    addRuleComment,
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
    selectedConnection,
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
    updateRuleComment,
    updateConnection,
    updateImage,
    updateMark,
    updateSettings,
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
  };
}
