import { act, renderHook } from '@testing-library/react';
import { useScenario } from '../src/hooks/useScenario';

describe('useScenario', () => {
  it('updates the selected boat and keeps auto trim in sync with its heading', () => {
    const { result } = renderHook(() => useScenario());

    act(() => {
      result.current.updateBoat('boat-1', { heading: 0 });
    });

    expect(result.current.selectedBoat?.heading).toBe(0);
    expect(result.current.selectedBoat?.sailAngle).toBe(2);
    expect(result.current.frames).toHaveLength(4);
  });

  it('adds and removes scenario objects across every frame', () => {
    const { result } = renderHook(() => useScenario());
    act(() => {
      result.current.addBoat();
    });

    const addedBoatId = result.current.selectedId ?? '';
    expect(addedBoatId).toMatch(/^boat-/);
    expect(result.current.frames.every((frame) => frame.boats.some((boat) => boat.id === addedBoatId))).toBe(true);

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
});
