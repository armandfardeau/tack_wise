import type { Boat, Frame } from '../types';
import situationData from './situations/tacking-basics.json';

interface SituationData {
  title: string;
  frames: Frame[];
}

const situation: SituationData = situationData as SituationData;

export const initialScenarioTitle = situation.title;
export const initialFrames: Frame[] = situation.frames;

function cloneBoat(boat: Boat): Boat {
  const clonedBoat: Boat = {
    id: boat.id,
    name: boat.name,
    color: boat.color,
    x: boat.x,
    y: boat.y,
    heading: boat.heading,
    sailAngle: boat.sailAngle,
  };

  if (boat.showHeadingLine !== undefined) {
    clonedBoat.showHeadingLine = boat.showHeadingLine;
  }

  return clonedBoat;
}

export function cloneFrames(frames: Frame[] = initialFrames): Frame[] {
  return frames.map((frame) => {
    const frameWithoutLegacyTransition = { ...frame } as Frame & { transition?: unknown };
    delete frameWithoutLegacyTransition.transition;

    return {
      ...frameWithoutLegacyTransition,
      boats: frame.boats.map(cloneBoat),
      marks: frame.marks.map((mark) => ({ ...mark })),
      arrows: frame.arrows?.map((arrow) => ({
        ...arrow,
        points: arrow.points.map((point) => ({ ...point })),
      })),
      comments: frame.comments?.map((comment) => ({ ...comment })),
      images: frame.images?.map((image) => ({ ...image })),
      rules: frame.rules?.map((rule) => ({ ...rule })),
    };
  });
}
