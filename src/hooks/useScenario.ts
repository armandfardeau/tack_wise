import { useEffect, useState } from 'react';
import { BOAT_COLORS, MARK_COLORS } from '../constants';
import { cloneFrames } from '../data/initialFrames';
import type { Boat, Frame, Mark } from '../types';
import { calculateAutoSailAngle, type Position } from '../utils/simulation';

export type SelectedType = 'boat' | 'mark' | null;

export function useScenario() {
  const [frames, setFrames] = useState<Frame[]>(() => cloneFrames());
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>('boat-1');
  const [selectedType, setSelectedType] = useState<SelectedType>('boat');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const [autoSailTrim, setAutoSailTrim] = useState(true);

  const activeFrame = frames[currentFrameIndex] ?? frames[0];
  const selectedBoat = activeFrame.boats.find((boat) => boat.id === selectedId);
  const selectedMark = activeFrame.marks.find((mark) => mark.id === selectedId);

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

  const selectFrame = (index: number) => {
    setIsPlaying(false);
    setCurrentFrameIndex(index);
  };

  const selectObject = (id: string, type: Exclude<SelectedType, null>) => {
    setSelectedId(id);
    setSelectedType(type);
  };

  const updateActiveFrame = (changes: Partial<Frame>) => {
    setFrames((previousFrames) =>
      previousFrames.map((frame, index) =>
        index === currentFrameIndex ? { ...frame, ...changes } : frame,
      ),
    );
  };

  const updateBoat = (boatId: string, changes: Partial<Boat>) => {
    setFrames((previousFrames) =>
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
    setFrames((previousFrames) =>
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

  const moveBoat = (boatId: string, position: Position) => updateBoat(boatId, position);
  const moveMark = (markId: string, position: Position) => updateMark(markId, position);

  const addFrame = () => {
    setIsPlaying(false);
    const newFrame: Frame = {
      ...activeFrame,
      id: `frame-${Date.now()}`,
      name: `Frame ${frames.length + 1}`,
      boats: activeFrame.boats.map((boat) => ({ ...boat })),
      marks: activeFrame.marks.map((mark) => ({ ...mark })),
    };
    setFrames((previousFrames) => [...previousFrames, newFrame]);
    setCurrentFrameIndex(frames.length);
  };

  const duplicateFrame = () => {
    setIsPlaying(false);
    const newFrame: Frame = {
      ...activeFrame,
      id: `frame-${Date.now()}`,
      name: `${activeFrame.name} (Copy)`,
      boats: activeFrame.boats.map((boat) => ({ ...boat })),
      marks: activeFrame.marks.map((mark) => ({ ...mark })),
    };
    setFrames((previousFrames) => {
      const nextFrames = [...previousFrames];
      nextFrames.splice(currentFrameIndex + 1, 0, newFrame);
      return nextFrames;
    });
    setCurrentFrameIndex(currentFrameIndex + 1);
  };

  const deleteFrame = (indexToDelete: number) => {
    if (frames.length <= 1) return;

    setIsPlaying(false);
    setFrames((previousFrames) => previousFrames.filter((_, index) => index !== indexToDelete));
    setCurrentFrameIndex(Math.max(0, indexToDelete - 1));
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

    setFrames((previousFrames) =>
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

  const addMark = () => {
    const newMark: Mark = {
      id: `mark-${Date.now()}`,
      name: `Mark ${activeFrame.marks.length + 1}`,
      color: MARK_COLORS[activeFrame.marks.length % MARK_COLORS.length],
      x: 150 + Math.random() * 300,
      y: 150 + Math.random() * 200,
      shape: 'circle',
    };

    setFrames((previousFrames) =>
      previousFrames.map((frame) => ({ ...frame, marks: [...frame.marks, { ...newMark }] })),
    );
    selectObject(newMark.id, 'mark');
  };

  const deleteSelected = () => {
    if (!selectedId) return;

    setFrames((previousFrames) =>
      previousFrames.map((frame) => ({
        ...frame,
        boats: frame.boats.filter((boat) => boat.id !== selectedId),
        marks: frame.marks
          .filter((mark) => mark.id !== selectedId)
          .map((mark) =>
            mark.connectedToMarkId === selectedId ? { ...mark, connectedToMarkId: null } : mark,
          ),
      })),
    );
    setSelectedId(null);
    setSelectedType(null);
  };

  return {
    activeFrame,
    autoSailTrim,
    frames,
    currentFrameIndex,
    deleteFrame,
    deleteSelected,
    duplicateFrame,
    isPlaying,
    moveBoat,
    moveMark,
    addBoat,
    addFrame,
    addMark,
    playSpeed,
    selectFrame,
    selectObject,
    selectedBoat,
    selectedId,
    selectedMark,
    selectedType,
    setAutoSailTrim,
    setCurrentFrameIndex,
    setIsPlaying,
    setPlaySpeed,
    updateActiveFrame,
    updateBoat,
    updateMark,
  };
}
