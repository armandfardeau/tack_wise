import { act, renderHook } from '@testing-library/react';
import { useScenario } from '../src/hooks/useScenario';

describe('useScenario', () => {
  it('uses discrete playback by default', () => {
    const { result } = renderHook(() => useScenario());

    expect(result.current.settings).toEqual({
      title: expect.any(String),
      displayMode: 'single',
      presenterMode: false,
    });
  });

  it('connects the default committee boat to the pin end', () => {
    const { result } = renderHook(() => useScenario());

    expect(result.current.frames.every((frame) => (
      frame.marks.find((mark) => mark.id === 'mark-3')?.connectedToMarkId === 'mark-2'
    ))).toBe(true);
  });

  it('updates the selected boat and keeps auto trim in sync with its heading', () => {
    const { result } = renderHook(() => useScenario());

    act(() => {
      result.current.updateBoat('boat-1', { heading: 0 });
    });

    expect(result.current.selectedBoat?.heading).toBe(0);
    expect(result.current.selectedBoat?.sailAngle).toBe(2);
    expect(result.current.frames).toHaveLength(4);
  });

  it('adds and removes scenario objects from the active frame onward', () => {
    const { result } = renderHook(() => useScenario());

    act(() => {
      result.current.selectFrame(1);
    });
    act(() => {
      result.current.addBoat();
    });

    const addedBoatId = result.current.selectedId ?? '';
    expect(addedBoatId).toMatch(/^boat-/);
    expect(result.current.frames[0].boats.some((boat) => boat.id === addedBoatId)).toBe(false);
    expect(result.current.frames.slice(1).every((frame) => frame.boats.some((boat) => boat.id === addedBoatId))).toBe(true);

    act(() => {
      result.current.deleteSelected();
    });

    expect(result.current.frames.every((frame) => frame.boats.every((boat) => boat.id !== addedBoatId))).toBe(true);
    expect(result.current.selectedId).toBeNull();
  });

  it('imports frames and selects an object from the imported current frame', () => {
    const { result } = renderHook(() => useScenario());

    act(() => {
      result.current.importScenario({
        version: 1,
        currentFrameIndex: 0,
        frames: [
          {
            id: 'imported-frame',
            name: 'Imported Situation',
            windAngle: 90,
            windSpeed: 18,
            boats: [
              { id: 'imported-boat', name: 'Imported Boat', color: '#fff', x: 10, y: 20, heading: 45, sailAngle: 10 },
            ],
            marks: [],
          },
        ],
      });
    });

    expect(result.current.frames).toHaveLength(1);
    expect(result.current.activeFrame.name).toBe('Imported Situation');
    expect(result.current.currentFrameIndex).toBe(0);
    expect(result.current.selectedId).toBe('imported-boat');
    expect(result.current.selectedType).toBe('boat');
    expect(result.current.isPlaying).toBe(false);
  });

  it('renames only the requested frame and ignores blank titles', () => {
    const { result } = renderHook(() => useScenario());

    act(() => {
      result.current.renameFrame(1, '  Mark approach  ');
    });

    expect(result.current.frames[1].name).toBe('Mark approach');
    expect(result.current.frames[0].name).toBe('1. Preparation');

    act(() => {
      result.current.renameFrame(1, '   ');
    });

    expect(result.current.frames[1].name).toBe('Mark approach');
  });

  it('steps through frames and replays from the beginning', () => {
    const { result } = renderHook(() => useScenario());

    act(() => {
      result.current.selectFrame(2);
      result.current.stepBackward();
    });
    expect(result.current.currentFrameIndex).toBe(1);
    expect(result.current.isPlaying).toBe(false);

    act(() => result.current.stepForward());
    expect(result.current.currentFrameIndex).toBe(2);

    act(() => result.current.replayFromStart());
    expect(result.current.currentFrameIndex).toBe(0);
    expect(result.current.isPlaying).toBe(true);

    act(() => result.current.stepBackward());
    expect(result.current.currentFrameIndex).toBe(0);
    expect(result.current.isPlaying).toBe(false);

    act(() => {
      result.current.selectFrame(result.current.frames.length - 1);
      result.current.stepForward();
    });
    expect(result.current.currentFrameIndex).toBe(result.current.frames.length - 1);
  });

  it('advances one complete frame at a time during playback', () => {
    jest.useFakeTimers();

    try {
      const { result } = renderHook(() => useScenario());

      act(() => {
        result.current.setIsPlaying(true);
      });
      act(() => jest.advanceTimersByTime(999));
      expect(result.current.currentFrameIndex).toBe(0);

      act(() => jest.advanceTimersByTime(1));
      expect(result.current.currentFrameIndex).toBe(1);
      expect(result.current.displayFrame).toBe(result.current.frames[1]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('supports undo and redo for scenario edits', () => {
    const { result } = renderHook(() => useScenario());
    const originalName = result.current.selectedBoat?.name;

    act(() => {
      result.current.updateBoat('boat-1', { name: 'Updated Boat' });
    });
    expect(result.current.selectedBoat?.name).toBe('Updated Boat');
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.selectedBoat?.name).toBe(originalName);
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.redo());
    expect(result.current.selectedBoat?.name).toBe('Updated Boat');
  });

  it('adds richer diagram objects from the active frame onward', () => {
    const { result } = renderHook(() => useScenario());

    act(() => {
      result.current.selectFrame(1);
    });
    act(() => {
      result.current.addMark('obstruction');
      result.current.addArrow();
      result.current.addComment();
    });

    expect(result.current.frames[0].marks.some((mark) => mark.shape === 'obstruction')).toBe(false);
    expect(result.current.frames[0].arrows ?? []).toHaveLength(0);
    expect(result.current.frames[0].comments ?? []).toHaveLength(0);
    expect(result.current.frames.slice(1).every((frame) => frame.marks.some((mark) => mark.shape === 'obstruction'))).toBe(true);
    expect(result.current.frames.slice(1).every((frame) => frame.arrows?.length === 1)).toBe(true);
    const addedArrow = result.current.frames[1].arrows?.[0];
    expect(addedArrow).toBeDefined();
    if (!addedArrow) return;
    expect(addedArrow?.curved).toBe(true);
    expect(addedArrow?.points).toHaveLength(3);
    expect(addedArrow?.points[1]).not.toEqual({
      x: (addedArrow.points[0].x + addedArrow.points[2].x) / 2,
      y: (addedArrow.points[0].y + addedArrow.points[2].y) / 2,
    });
    expect(result.current.frames.slice(1).every((frame) => frame.comments?.length === 1)).toBe(true);
  });

  it('updates presentation settings and restores a saved library scenario', () => {
    localStorage.clear();
    const { result } = renderHook(() => useScenario());

    act(() => {
      result.current.updateSettings({ displayMode: 'cumulative' });
      result.current.saveToLibrary('Saved situation');
    });

    expect(result.current.settings.displayMode).toBe('cumulative');
    expect(result.current.libraryItems[0].title).toBe('Saved situation');

    act(() => result.current.updateBoat('boat-1', { name: 'Changed after save' }));
    act(() => result.current.loadFromLibrary(result.current.libraryItems[0].id));
    expect(result.current.selectedBoat?.name).toBe('Alpha');
  });
});
