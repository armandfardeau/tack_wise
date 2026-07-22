import type { InspectorView, DeletableObject } from './types';

function getConnectionName(view: Extract<InspectorView, { kind: 'connection' }>) {
  const getMarkName = (markId: string) => view.activeFrame.marks.find((mark) => mark.id === markId)?.name || 'Unnamed mark';
  return `Connection: ${getMarkName(view.connection.start.markId)} → ${getMarkName(view.connection.end.markId)}`;
}

export function getInspectorMetadata(view: InspectorView): { objectName: string | null; deletableObject: DeletableObject | null } {
  switch (view.kind) {
    case 'boat':
      return { objectName: `Boat: ${view.boat.name || 'Unnamed boat'}`, deletableObject: 'Boat' };
    case 'mark':
      return { objectName: `Mark: ${view.mark.name || 'Unnamed mark'}`, deletableObject: 'Mark' };
    case 'connection':
      return { objectName: getConnectionName(view), deletableObject: 'Connection' };
    case 'arrow':
      return { objectName: `Arrow: ${view.arrow.name || 'Unnamed arrow'}`, deletableObject: 'Arrow' };
    case 'comment':
      return { objectName: `Comment: ${view.comment.name || 'Unnamed comment'}`, deletableObject: 'Comment' };
    case 'rule-comment':
      return { objectName: `Rule: ${view.comment.name || 'Unnamed rule'}`, deletableObject: 'Comment' };
    case 'image':
      return { objectName: `Image: ${view.image.name || 'Unnamed image'}`, deletableObject: 'Image' };
    case 'wind':
      return { objectName: 'Wind settings', deletableObject: null };
    case 'grid':
      return { objectName: 'Canvas settings', deletableObject: null };
    case 'playback':
      return { objectName: 'Playback settings', deletableObject: null };
    case 'empty':
      return { objectName: null, deletableObject: null };
  }
}
