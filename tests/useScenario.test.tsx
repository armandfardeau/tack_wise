import { act, renderHook } from '@testing-library/react';
import { useScenario } from '../src/hooks/useScenario';

describe('useScenario', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('uses discrete playback by default', () => {
    const { result } = renderHook(() => useScenario());

    expect(result.current.playSpeed).toBe(2000);
    expect(result.current.settings).toEqual({
      title: expect.any(String),
      displayMode: 'single',
      presenterMode: false,
      showFrameTitle: true,
      showFrameNumber: true,
    });
  });

  it('keeps the default mark connections across the scenario', () => {
    const { result } = renderHook(() => useScenario());

    expect(result.current.frames[0].connections).toEqual(expect.arrayContaining([
      expect.objectContaining({
        start: expect.objectContaining({ markId: 'mark-3' }),
        end: expect.objectContaining({ markId: 'mark-5' }),
      }),
    ]));
    expect(result.current.frames.slice(1).every((frame) => (
      frame.connections?.some((connection) => connection.start.markId === 'mark-3' && connection.end.markId === 'mark-2')
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

  it('restores a boat deletion after the scenario is reloaded', () => {
    const firstSession = renderHook(() => useScenario());

    act(() => {
      firstSession.result.current.deleteSelected();
    });

    expect(firstSession.result.current.activeFrame.boats.some((boat) => boat.id === 'boat-1')).toBe(false);
    expect(JSON.parse(localStorage.getItem('tack-wise-autosave') ?? '{}').frames[0].boats.some((boat: { id: string }) => boat.id === 'boat-1')).toBe(false);

    firstSession.unmount();

    const reloadedSession = renderHook(() => useScenario());
    expect(reloadedSession.result.current.activeFrame.boats.some((boat) => boat.id === 'boat-1')).toBe(false);
    expect(reloadedSession.result.current.selectedId).not.toBe('boat-1');
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
    expect(result.current.frames[0].name).toBe('1. Toolbox Tour');

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

  it('animates continuously and advances the frame at the end of a segment', () => {
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    let frameCallback: FrameRequestCallback | null = null;

    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        frameCallback = callback;
        return 1;
      },
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: jest.fn(),
    });

    try {
      const { result } = renderHook(() => useScenario());
      const startFrame = {
        id: 'start',
        name: 'Start',
        windAngle: 0,
        windSpeed: 12,
        boats: [{ id: 'boat', name: 'Boat', color: '#fff', x: 0, y: 0, heading: 90, sailAngle: 0 }],
        marks: [],
      };
      const endFrame = {
        ...startFrame,
        id: 'end',
        name: 'End',
        boats: [{ ...startFrame.boats[0], x: 10, y: -10, heading: 0 }],
      };

      act(() => {
        result.current.importScenario({ version: 1, currentFrameIndex: 0, frames: [startFrame, endFrame] });
        result.current.setPlaySpeed(1000);
        result.current.setIsPlaying(true);
      });

      act(() => frameCallback?.(0));
      act(() => frameCallback?.(200));
      expect(result.current.currentFrameIndex).toBe(0);
      expect(result.current.playbackProgress).toBeCloseTo(0.2);
      expect(result.current.displayFrame.boats[0].x).toBeCloseTo(5);

      act(() => frameCallback?.(1000));
      expect(result.current.currentFrameIndex).toBe(1);
      expect(result.current.playbackProgress).toBe(0);
      expect(result.current.displayFrame).toBe(result.current.frames[1]);

      act(() => frameCallback?.(1500));
      expect(result.current.currentFrameIndex).toBe(1);
      expect(result.current.playbackProgress).toBeCloseTo(0.5);
      expect(result.current.displayFrame).toBe(result.current.frames[1]);

      act(() => frameCallback?.(2000));
      expect(result.current.currentFrameIndex).toBe(0);
    } finally {
      Object.defineProperty(window, 'requestAnimationFrame', { configurable: true, value: originalRequestAnimationFrame });
      Object.defineProperty(window, 'cancelAnimationFrame', { configurable: true, value: originalCancelAnimationFrame });
    }
  });

  it('holds an invalid boat route and reports a transient warning without mutating frames', () => {
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    let frameCallback: FrameRequestCallback | null = null;

    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        frameCallback = callback;
        return 1;
      },
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: jest.fn(),
    });

    try {
      const { result } = renderHook(() => useScenario());
      const startFrame = {
        id: 'start',
        name: 'Start',
        windAngle: 0,
        windSpeed: 12,
        boats: [{ id: 'boat', name: 'Boat', color: '#fff', x: 0, y: 0, heading: 90, sailAngle: 0 }],
        marks: [],
      };
      const endFrame = {
        ...startFrame,
        id: 'end',
        name: 'End',
        boats: [{ ...startFrame.boats[0], x: 10, y: 10, heading: 0 }],
      };

      act(() => {
        result.current.importScenario({ version: 1, currentFrameIndex: 0, frames: [startFrame, endFrame] });
        result.current.setIsPlaying(true);
      });

      expect(result.current.playbackWarning).toContain('Boat cannot complete the straight-line manoeuvre');
      act(() => frameCallback?.(0));
      act(() => frameCallback?.(500));
      expect(result.current.displayFrame.boats[0]).toMatchObject({ x: 0, y: 0, heading: 90 });
      expect(result.current.frames[0].boats[0]).toMatchObject({ x: 0, y: 0, heading: 90 });
    } finally {
      Object.defineProperty(window, 'requestAnimationFrame', { configurable: true, value: originalRequestAnimationFrame });
      Object.defineProperty(window, 'cancelAnimationFrame', { configurable: true, value: originalCancelAnimationFrame });
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

    expect(result.current.frames[0].marks.some((mark) => mark.shape === 'obstruction')).toBe(true);
    expect(result.current.frames[0].arrows ?? []).toHaveLength(3);
    expect(result.current.frames[0].comments ?? []).toHaveLength(2);
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
    expect(result.current.selectedBoat?.name).toBe('Alpha — dinghy');
  });

  it('updates every diagram object and exposes movement helpers', () => {
    const { result } = renderHook(() => useScenario());
    const importedFrame = {
      id: 'objects-frame',
      name: 'Objects',
      windAngle: 0,
      windSpeed: 12,
      boats: [{ id: 'boat-a', name: 'Boat', color: '#fff', x: 10, y: 20, heading: 0, sailAngle: 0 }],
      marks: [
        { id: 'mark-a', name: 'A', color: '#fff', x: 30, y: 40, shape: 'circle' as const },
        { id: 'mark-b', name: 'B', color: '#000', x: 50, y: 60, shape: 'gate' as const },
      ],
      arrows: [{ id: 'arrow-a', name: 'Arrow', color: '#f00', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] }],
      comments: [{ id: 'comment-a', name: 'Comment', text: 'Text', color: '#fff', x: 1, y: 2 }],
      images: [{ id: 'image-a', name: 'Image', src: 'data:image/png;base64,AA==', x: 1, y: 2, width: 30, height: 40 }],
    };

    act(() => result.current.importScenario({ version: 1, currentFrameIndex: 1, frames: [importedFrame, { ...importedFrame, id: 'objects-frame-2' }] }));
    act(() => result.current.selectFrame(1));
    act(() => {
      result.current.updateActiveFrame({ windSpeed: 20 });
      result.current.moveBoat('boat-a', { x: 100, y: 110 });
      result.current.moveMark('mark-a', { x: 120, y: 130 });
      result.current.moveArrow('arrow-a', [{ x: 2, y: 3 }, { x: 12, y: 13 }]);
      result.current.moveComment('comment-a', { x: 140, y: 150 });
      result.current.moveImage('image-a', { x: 160, y: 170 });
      result.current.updateArrow('arrow-a', { curved: true });
      result.current.updateComment('comment-a', { text: 'Updated' });
      result.current.updateImage('image-a', { rotation: 45 });
    });

    expect(result.current.activeFrame.windSpeed).toBe(20);
    expect(result.current.activeFrame.boats[0]).toMatchObject({ x: 100, y: 110 });
    expect(result.current.activeFrame.marks[0]).toMatchObject({ x: 120, y: 130 });
    expect(result.current.activeFrame.arrows?.[0]).toMatchObject({ points: [{ x: 2, y: 3 }, { x: 12, y: 13 }], curved: true });
    expect(result.current.activeFrame.comments?.[0]).toMatchObject({ x: 140, y: 150, text: 'Updated' });
    expect(result.current.activeFrame.images?.[0]).toMatchObject({ x: 160, y: 170, rotation: 45 });
  });

  it('adds, replaces, removes, and undoes multiple mark connections', () => {
    const { result } = renderHook(() => useScenario());
    const baseFrame = {
      id: 'connections-frame',
      name: 'Connections',
      windAngle: 0,
      windSpeed: 12,
      boats: [],
      marks: [
        { id: 'mark-a', name: 'A', color: '#fff', x: 10, y: 10, shape: 'circle' as const },
        { id: 'mark-b', name: 'B', color: '#000', x: 30, y: 30, shape: 'circle' as const },
        { id: 'mark-c', name: 'C', color: '#f00', x: 50, y: 50, shape: 'circle' as const },
      ],
    };

    act(() => result.current.importScenario({ version: 1, currentFrameIndex: 0, frames: [baseFrame] }));
    act(() => result.current.connectMarks('mark-a', 'mark-b', { start: { x: 0.5, y: 0 }, end: { x: -0.5, y: 0.25 } }));
    const firstConnectionId = 'mark-connection-mark-a-mark-b';
    act(() => result.current.replaceMarkConnection(firstConnectionId, 'mark-c'));
    act(() => result.current.connectMarks('mark-a', 'mark-b'));
    act(() => result.current.connectMarks('mark-a', 'mark-c'));
    act(() => result.current.connectMarks('mark-a', 'mark-a'));

    expect(result.current.activeFrame.connections).toEqual([
      expect.objectContaining({
        id: firstConnectionId,
        start: { markId: 'mark-a', anchor: { x: 0.5, y: 0 } },
        end: { markId: 'mark-c', anchor: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }) },
        arrowhead: false,
      }),
      expect.objectContaining({
        start: { markId: 'mark-a', anchor: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }) },
        end: { markId: 'mark-b', anchor: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }) },
        arrowhead: false,
      }),
    ]);

    act(() => result.current.removeMarkConnection(firstConnectionId));
    expect(result.current.activeFrame.connections).toHaveLength(1);
    expect(result.current.activeFrame.connections?.[0].end.markId).toBe('mark-b');

    act(() => result.current.undo());
    expect(result.current.activeFrame.connections).toHaveLength(2);
    act(() => result.current.redo());
    expect(result.current.activeFrame.connections).toHaveLength(1);

    const remainingConnectionId = result.current.activeFrame.connections?.[0].id;
    expect(remainingConnectionId).toBeDefined();
    if (remainingConnectionId) {
      act(() => result.current.selectObject(remainingConnectionId, 'connection'));
      act(() => result.current.deleteSelected());
    }
    expect(result.current.activeFrame.connections).toEqual([]);
    expect(result.current.selectedType).toBeNull();
  });

  it('adds, duplicates, deletes, and selects frames', () => {
    jest.spyOn(Date, 'now').mockReturnValue(987);
    const { result } = renderHook(() => useScenario());
    const originalLength = result.current.frames.length;

    act(() => result.current.addFrame());
    expect(result.current.frames).toHaveLength(originalLength + 1);
    expect(result.current.currentFrameIndex).toBe(originalLength);
    expect(result.current.isPlaying).toBe(false);

    act(() => result.current.duplicateFrame());
    expect(result.current.frames[originalLength + 1].name).toMatch(/\(Copy\)$/);
    expect(result.current.currentFrameIndex).toBe(originalLength + 1);

    act(() => result.current.deleteFrame(1));
    expect(result.current.currentFrameIndex).toBe(0);
    expect(result.current.frames).toHaveLength(originalLength + 1);

    act(() => result.current.duplicateFrame(999));
    expect(result.current.currentFrameIndex).toBe(1000);

    act(() => result.current.setCurrentFrameIndex(2));
    expect(result.current.currentFrameIndex).toBe(2);
  });

  it('adds images, rules, and all supported mark shapes from the active frame onward', () => {
    jest.spyOn(Date, 'now').mockReturnValue(456);
    const { result } = renderHook(() => useScenario());

    act(() => result.current.selectFrame(1));
    act(() => {
      result.current.addBoat();
      result.current.addMark('gate');
      result.current.addMark();
      result.current.addImage('data:image/png;base64,AA==', 'Background');
      result.current.addImage('data:image/png;base64,AA==');
      result.current.addRuleToActiveFrame({ id: 'rrs-10', label: 'RRS 10' });
      result.current.updateSettings({ presenterMode: true, title: 'Lesson' });
      result.current.setAutoSailTrim(false);
      result.current.setPlaySpeed(500);
    });

    expect(result.current.frames[0].images?.some((image) => image.name === 'Background')).toBe(false);
    expect(result.current.frames.slice(1).every((frame) => frame.images?.some((image) => image.name === 'Background'))).toBe(true);
    expect(result.current.frames[1].rules?.some((rule) => rule.id === 'rrs-10')).toBe(true);
    expect(result.current.frames.slice(1).every((frame) => frame.boats.length > 1)).toBe(true);
    expect(result.current.frames.slice(1).some((frame) => frame.marks.some((mark) => mark.shape === 'gate'))).toBe(true);
    expect(result.current.settings).toMatchObject({ presenterMode: true, title: 'Lesson' });
    expect(result.current.playSpeed).toBe(500);

    act(() => result.current.clearSelection());
    expect(result.current.selectedId).toBeNull();
    expect(result.current.selectedType).toBeNull();
  });

  it('adds rule comments, highlights selected offense targets, and removes their frame tag on delete', () => {
    jest.spyOn(Date, 'now').mockReturnValue(789);
    const { result } = renderHook(() => useScenario());

    act(() => {
      result.current.selectFrame(1);
      result.current.addRuleComment();
    });

    const ruleComment = result.current.selectedComment;
    expect(ruleComment?.type).toBe('rule');
    expect(result.current.activeFrame.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'rrs-10', label: 'RRS 10' }),
    ]));
    expect(result.current.frames.slice(1).every((frame) => frame.comments?.some((comment) => comment.id === ruleComment?.id))).toBe(true);

    if (!ruleComment || ruleComment.type !== 'rule') return;
    expect(ruleComment.rules?.[0].label).toBe('RRS 10');

    act(() => {
      result.current.updateRuleComment(ruleComment.id, {
        rules: [{ id: 'rrs-10', label: 'RRS 10' }, { id: 'rrs-18', label: 'RRS 18' }],
        offenseTargets: [{ id: 'boat-1', type: 'boat' }],
      });
    });

    expect(result.current.activeFrame.comments?.find((comment) => comment.id === ruleComment.id)).toMatchObject({
      rules: [{ label: 'RRS 10' }, { label: 'RRS 18' }],
      offenseTargets: [{ id: 'boat-1', type: 'boat' }],
    });
    expect(result.current.activeFrame.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'rrs-10', label: 'RRS 10' }),
      expect.objectContaining({ id: 'rrs-18', label: 'RRS 18' }),
    ]));

    act(() => result.current.deleteSelected());
    expect(result.current.frames.every((frame) => !frame.comments?.some((comment) => comment.id === ruleComment.id))).toBe(true);
    expect(result.current.frames.every((frame) => !frame.rules?.some((rule) => ['rrs-10', 'rrs-18'].includes(rule.id)))).toBe(true);
  });

  it('restores and clears a valid autosave, while rejecting missing or invalid data', () => {
    localStorage.setItem('tack-wise-autosave', JSON.stringify({
      version: 2,
      currentFrameIndex: 0,
      settings: { title: 'Recovered', displayMode: 'cumulative', presenterMode: true },
      frames: [{ id: 'recovered', name: 'Recovered', windAngle: 45, windSpeed: 15, boats: [], marks: [] }],
    }));

    const { result } = renderHook(() => useScenario());
    expect(result.current.hasAutosave).toBe(true);

    // The initial autosave effect intentionally runs once after mount; restore
    // from a fresh copy so this test exercises the recovery path itself.
    localStorage.setItem('tack-wise-autosave', JSON.stringify({
      version: 2,
      currentFrameIndex: 0,
      settings: { title: 'Recovered', displayMode: 'cumulative', presenterMode: true },
      frames: [{ id: 'recovered', name: 'Recovered', windAngle: 45, windSpeed: 15, boats: [], marks: [] }],
    }));

    let restored = false;
    act(() => { restored = result.current.restoreAutosave(); });
    expect(restored).toBe(true);
    expect(result.current.activeFrame.name).toBe('Recovered');
    expect(result.current.settings.displayMode).toBe('cumulative');

    act(() => result.current.clearAutosave());
    expect(result.current.hasAutosave).toBe(false);
    expect(localStorage.getItem('tack-wise-autosave')).toBeNull();

    let missing = true;
    act(() => { missing = result.current.restoreAutosave(); });
    expect(missing).toBe(false);

    localStorage.setItem('tack-wise-autosave', '{bad json');
    let invalid = true;
    act(() => { invalid = result.current.restoreAutosave(); });
    expect(invalid).toBe(false);
  });

  it('selects the first available imported object and falls back to no selection', () => {
    const { result } = renderHook(() => useScenario());
    const base = { id: 'frame', name: 'Frame', windAngle: 0, windSpeed: 12, boats: [], marks: [] };

    act(() => result.current.importScenario({ version: 1, currentFrameIndex: 0, frames: [{ ...base, marks: [{ id: 'mark', name: 'Mark', color: '#fff', x: 1, y: 1, shape: 'circle' }] }] }));
    expect(result.current.selectedType).toBe('mark');
    act(() => result.current.importScenario({ version: 1, currentFrameIndex: 0, frames: [{ ...base, arrows: [{ id: 'arrow', name: 'Arrow', color: '#fff', points: [{ x: 1, y: 1 }, { x: 2, y: 2 }] }] }] }));
    expect(result.current.selectedType).toBe('arrow');
    act(() => result.current.importScenario({ version: 1, currentFrameIndex: 0, frames: [{ ...base, comments: [{ id: 'comment', name: 'Comment', text: 'Text', color: '#fff', x: 1, y: 1 }] }] }));
    expect(result.current.selectedType).toBe('comment');
    act(() => result.current.importScenario({ version: 1, currentFrameIndex: 0, frames: [base] }));
    expect(result.current.selectedId).toBeNull();
    expect(result.current.selectedType).toBeNull();
  });

  it('deletes selected objects and clears mark connections to the deleted mark', () => {
    const { result } = renderHook(() => useScenario());
    const frame = {
      id: 'objects', name: 'Objects', windAngle: 0, windSpeed: 12,
      boats: [{ id: 'boat', name: 'Boat', color: '#fff', x: 1, y: 1, heading: 0, sailAngle: 0 }],
      marks: [
        { id: 'mark-a', name: 'A', color: '#fff', x: 1, y: 1, shape: 'circle' as const, connectedToMarkId: 'mark-b' },
        { id: 'mark-b', name: 'B', color: '#000', x: 2, y: 2, shape: 'circle' as const },
      ],
      arrows: [{ id: 'arrow', name: 'Arrow', color: '#f00', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }],
      comments: [{ id: 'comment', name: 'Comment', text: 'Text', color: '#fff', x: 1, y: 1 }],
      images: [{ id: 'image', name: 'Image', src: 'data:image/png;base64,AA==', x: 1, y: 1, width: 20, height: 20 }],
    };

    act(() => result.current.importScenario({ version: 1, currentFrameIndex: 0, frames: [frame] }));
    act(() => result.current.selectObject('mark-b', 'mark'));
    act(() => result.current.deleteSelected());
    expect(result.current.activeFrame.marks).toEqual([
      expect.objectContaining({ id: 'mark-a' }),
    ]);
    expect(result.current.activeFrame.connections).toEqual([]);

    for (const [id, type] of [['boat', 'boat'], ['arrow', 'arrow'], ['comment', 'comment'], ['image', 'image']] as const) {
      act(() => result.current.selectObject(id, type));
      act(() => result.current.deleteSelected());
    }

    expect(result.current.activeFrame.boats).toEqual([]);
    expect(result.current.activeFrame.arrows).toEqual([]);
    expect(result.current.activeFrame.comments).toEqual([]);
    expect(result.current.activeFrame.images).toEqual([]);
    expect(result.current.selectedId).toBeNull();
  });

  it('duplicates the selected object, offsets it, and selects the copy', () => {
    const { result } = renderHook(() => useScenario());
    const frame = {
      id: 'objects', name: 'Objects', windAngle: 0, windSpeed: 12,
      boats: [{ id: 'boat', name: 'Boat', color: '#fff', x: 1, y: 1, heading: 0, sailAngle: 0 }],
      marks: [],
      arrows: [],
      comments: [],
      images: [],
    };

    act(() => result.current.importScenario({ version: 1, currentFrameIndex: 0, frames: [frame] }));
    act(() => result.current.duplicateSelected());

    const duplicate = result.current.activeFrame.boats.find((boat) => boat.id === result.current.selectedId);
    expect(duplicate).toEqual(expect.objectContaining({
      name: 'Boat (Copy)',
      x: 25,
      y: 25,
    }));
    expect(duplicate?.id).not.toBe('boat');
    expect(result.current.selectedType).toBe('boat');
    expect(result.current.activeFrame.boats).toHaveLength(2);
  });

  it('returns false for missing library entries and removes saved entries', () => {
    const { result } = renderHook(() => useScenario());

    expect(result.current.loadFromLibrary('missing')).toBe(false);
    act(() => result.current.saveToLibrary('Temporary'));
    const id = result.current.libraryItems[0].id;
    act(() => result.current.deleteFromLibrary(id));

    expect(result.current.libraryItems.some((item) => item.id === id)).toBe(false);
    expect(result.current.loadFromLibrary(id)).toBe(false);
  });

  it('clears special and empty selections without changing frames', () => {
    const { result } = renderHook(() => useScenario());
    const frameCount = result.current.frames.length;

    act(() => result.current.clearSelection());
    act(() => result.current.deleteSelected());
    expect(result.current.frames).toHaveLength(frameCount);

    act(() => result.current.selectObject('wind', 'wind'));
    act(() => result.current.deleteSelected());
    expect(result.current.selectedId).toBeNull();
    expect(result.current.selectedType).toBeNull();

    act(() => result.current.setAutoSailTrim(false));
    act(() => result.current.selectObject('boat-1', 'boat'));
    act(() => result.current.updateBoat('boat-1', { name: 'Manual trim' }));
    expect(result.current.selectedBoat?.name).toBe('Manual trim');
  });

  it('ignores undo, redo, and deleting the only remaining frame without history', () => {
    const { result } = renderHook(() => useScenario());

    act(() => result.current.importScenario({
      version: 1,
      currentFrameIndex: 0,
      frames: [{ id: 'only-frame', name: 'Only frame', windAngle: 0, windSpeed: 12, boats: [], marks: [] }],
    }));
    const originalName = result.current.frames[0].name;

    act(() => {
      result.current.undo();
      result.current.redo();
      result.current.deleteFrame(0);
    });

    expect(result.current.frames[0].name).toBe(originalName);
    expect(result.current.frames).toHaveLength(1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
});
