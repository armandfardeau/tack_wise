import { getRuleReferences, type Frame } from '../types';
import situationData from './situations/tacking-basics.json';
import { cloneTacticalArrowPoints } from '../utils/arrows';
import { normalizeFrameConnections } from '../utils/markConnections';

interface SituationData {
  title: string;
  frames: Frame[];
}

const situation: SituationData = situationData as SituationData;

export const initialScenarioTitle = situation.title;
export const initialFrames: Frame[] = situation.frames;

export function cloneFrames(frames: Frame[] = initialFrames): Frame[] {
  return frames.map((frame) => {
    const normalizedFrame = normalizeFrameConnections(frame);
    const frameWithoutLegacyTransition = { ...normalizedFrame } as Frame & { transition?: unknown };
    delete frameWithoutLegacyTransition.transition;

    return {
      ...frameWithoutLegacyTransition,
      boats: frame.boats.map((boat) => ({ ...boat })),
      marks: frameWithoutLegacyTransition.marks.map((mark) => ({ ...mark })),
      connections: frameWithoutLegacyTransition.connections?.map((connection) => ({
        ...connection,
        start: { ...connection.start, anchor: { ...connection.start.anchor } },
        end: { ...connection.end, anchor: { ...connection.end.anchor } },
      })),
      arrows: frame.arrows?.map((arrow) => ({
        ...arrow,
        points: cloneTacticalArrowPoints(arrow.points),
      })),
      comments: frame.comments?.map((comment) => {
        if (comment.type !== 'rule') return { ...comment };

        const normalizedComment = { ...comment };
        delete normalizedComment.rule;
        return {
          ...normalizedComment,
          rules: getRuleReferences(comment).map((rule) => ({ ...rule })),
          offenseTargets: comment.offenseTargets.map((target) => ({ ...target })),
        };
      }),
      images: frame.images?.map((image) => ({ ...image })),
      rules: frame.rules?.map((rule) => ({ ...rule })),
    };
  });
}
