import type { InspectorView } from './inspector/types';
import { ArrowInspector } from './inspector/ArrowInspector';
import { BoatInspector } from './inspector/BoatInspector';
import { CanvasSettingsInspector } from './inspector/CanvasSettingsInspector';
import { CommentInspector } from './inspector/CommentInspector';
import { ConnectionInspector } from './inspector/ConnectionInspector';
import { ImageInspector } from './inspector/ImageInspector';
import { InspectorHeader } from './inspector/InspectorHeader';
import { getInspectorMetadata } from './inspector/inspectorMetadata';
import { MarkInspector } from './inspector/MarkInspector';
import { PlaybackInspector } from './inspector/PlaybackInspector';
import { RuleCommentInspector } from './inspector/RuleCommentInspector';
import { WindInspector } from './inspector/WindInspector';

export interface InspectorProps {
  view: InspectorView;
  onDelete: () => void;
  onDuplicate?: () => void;
  onClose?: () => void;
}

function InspectorContent({ view }: { view: InspectorView }) {
  switch (view.kind) {
    case 'wind':
      return <WindInspector {...view} />;
    case 'grid':
      return <CanvasSettingsInspector {...view} />;
    case 'playback':
      return <PlaybackInspector {...view} />;
    case 'boat':
      return <BoatInspector {...view} />;
    case 'mark':
      return <MarkInspector {...view} />;
    case 'connection':
      return <ConnectionInspector {...view} />;
    case 'arrow':
      return <ArrowInspector {...view} />;
    case 'rule-comment':
      return <RuleCommentInspector {...view} />;
    case 'comment':
      return <CommentInspector {...view} />;
    case 'image':
      return <ImageInspector {...view} />;
    case 'empty':
      return <p className="no-selection">Click an object or the wind indicator on the canvas to inspect and edit its properties.</p>;
  }
}

export default function Inspector({ view, onDelete, onDuplicate = () => undefined, onClose = () => undefined }: InspectorProps) {
  const { objectName, deletableObject } = getInspectorMetadata(view);

  return (
    <div className="control-section inspector">
      <InspectorHeader
        objectName={objectName}
        deletableObject={deletableObject}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onClose={onClose}
      />
      <InspectorContent view={view} />
    </div>
  );
}
