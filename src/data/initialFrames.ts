import type { Frame } from '../types';
import situationData from './situations/tacking-basics.json';

interface SituationData {
  title: string;
  frames: Frame[];
}

const situation: SituationData = situationData as SituationData;

export const initialScenarioTitle = situation.title;
export const initialFrames: Frame[] = situation.frames;

export function cloneFrames(frames: Frame[] = initialFrames): Frame[] {
  return frames.map((frame) => ({
    ...frame,
    boats: frame.boats.map((boat) => ({ ...boat })),
    marks: frame.marks.map((mark) => ({ ...mark })),
    arrows: frame.arrows?.map((arrow) => ({
      ...arrow,
      points: arrow.points.map((point) => ({ ...point })),
    })),
    comments: frame.comments?.map((comment) => ({ ...comment })),
    images: frame.images?.map((image) => ({ ...image })),
    rules: frame.rules?.map((rule) => ({ ...rule })),
    transition: frame.transition ? { ...frame.transition } : undefined,
  }));
}
