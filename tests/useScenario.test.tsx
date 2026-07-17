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
});
