import { useState } from 'react';
import { getGridSnap, type Position } from '../utils/simulation';
import { GRID_SNAP_RADIUS } from '../constants';

export interface SnapTarget extends Position {
  objectId: string;
  active: boolean;
}

export function useGridSnap(enabled: boolean) {
  const [snapTarget, setSnapTarget] = useState<SnapTarget | null>(null);

  const setSnapPreview = (nextTarget: SnapTarget | null) => {
    setSnapTarget((previousTarget) => {
      if (!nextTarget && !previousTarget) return previousTarget;
      if (
        nextTarget &&
        previousTarget &&
        nextTarget.objectId === previousTarget.objectId &&
        nextTarget.x === previousTarget.x &&
        nextTarget.y === previousTarget.y &&
        nextTarget.active === previousTarget.active
      ) {
        return previousTarget;
      }
      return nextTarget;
    });
  };

  const getSnappedPosition = (objectId: string, rawPosition: Position): Position => {
    if (!enabled) {
      setSnapPreview(null);
      return rawPosition;
    }

    const gridSnap = getGridSnap(rawPosition);
    if (gridSnap.distance <= GRID_SNAP_RADIUS) {
      setSnapPreview({ objectId, x: gridSnap.x, y: gridSnap.y, active: true });
      return { x: gridSnap.x, y: gridSnap.y };
    }

    setSnapPreview(null);
    return rawPosition;
  };

  return { getSnappedPosition, setSnapPreview, snapTarget };
}
