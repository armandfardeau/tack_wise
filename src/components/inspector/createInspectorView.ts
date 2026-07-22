import type { SelectedType } from '../../hooks/useScenario';
import type { CommentNote, DiagramImage, DisplayMode, Frame, FrameComment, Boat, Mark, MarkConnection, RuleComment, TacticalArrow } from '../../types';
import type { InspectorView } from './types';

const noop = () => undefined;

export interface InspectorViewInputs {
  activeFrame: Frame;
  autoSailTrim: boolean;
  displayMode?: DisplayMode;
  gridSnapEnabled: boolean;
  isPlaying?: boolean;
  onSetGridSnapEnabled: (enabled: boolean) => void;
  onSetAutoSailTrim: (enabled: boolean) => void;
  onSetDisplayMode?: (mode: DisplayMode) => void;
  onSetShowFrameTitle?: (show: boolean) => void;
  onSetShowFrameNumber?: (show: boolean) => void;
  onSetShowGrid: (show: boolean) => void;
  onTogglePlaying?: () => void;
  onSetPlaySpeed?: (speed: number) => void;
  playSpeed?: number;
  selectedBoat?: Boat;
  selectedMark?: Mark;
  selectedConnection?: MarkConnection;
  selectedArrow?: TacticalArrow;
  selectedComment?: FrameComment;
  selectedImage?: DiagramImage;
  selectedType: SelectedType;
  showGrid: boolean;
  showFrameTitle?: boolean;
  showFrameNumber?: boolean;
  updateBoat: (boatId: string, changes: Partial<Boat>) => void;
  updateActiveFrame: (changes: Partial<Frame>) => void;
  updateMark: (markId: string, changes: Partial<Mark>) => void;
  updateMarkRoomZone?: (markId: string, changes: Partial<Pick<Mark, 'showZone' | 'zoneRadius'>>) => void;
  onConnectMarks?: (sourceMarkId: string, targetMarkId: string, anchors?: { start?: { x: number; y: number }; end?: { x: number; y: number } }) => void;
  onRemoveMarkConnection?: (connectionId: string) => void;
  onReplaceMarkConnection?: (connectionId: string, nextTargetMarkId: string) => void;
  updateConnection?: (connectionId: string, changes: Partial<MarkConnection>) => void;
  updateArrow?: (arrowId: string, changes: Partial<TacticalArrow>) => void;
  updateComment?: (commentId: string, changes: Partial<CommentNote>) => void;
  updateRuleComment?: (commentId: string, changes: Partial<RuleComment>) => void;
  updateImage?: (imageId: string, changes: Partial<DiagramImage>) => void;
}

export function createInspectorView({
  activeFrame,
  autoSailTrim,
  displayMode = 'single',
  gridSnapEnabled,
  isPlaying = false,
  onSetGridSnapEnabled,
  onSetAutoSailTrim,
  onSetDisplayMode = noop,
  onSetShowFrameTitle = noop,
  onSetShowFrameNumber = noop,
  onSetShowGrid,
  onTogglePlaying = noop,
  onSetPlaySpeed = noop,
  playSpeed = 2000,
  selectedBoat,
  selectedMark,
  selectedConnection,
  selectedArrow,
  selectedComment,
  selectedImage,
  selectedType,
  showGrid,
  showFrameTitle = true,
  showFrameNumber = true,
  updateBoat,
  updateActiveFrame,
  updateMark,
  updateMarkRoomZone,
  onConnectMarks,
  onRemoveMarkConnection,
  onReplaceMarkConnection,
  updateConnection,
  updateArrow,
  updateComment,
  updateRuleComment,
  updateImage,
}: InspectorViewInputs): InspectorView {
  switch (selectedType) {
    case 'wind':
      return { kind: 'wind', activeFrame, updateActiveFrame };
    case 'grid':
      return {
        kind: 'grid',
        displayMode,
        gridSnapEnabled,
        onSetGridSnapEnabled,
        onSetDisplayMode,
        onSetShowFrameTitle,
        onSetShowFrameNumber,
        onSetShowGrid,
        showFrameTitle,
        showFrameNumber,
        showGrid,
      };
    case 'playback':
      return { kind: 'playback', isPlaying, onSetPlaySpeed, onTogglePlaying, playSpeed };
    case 'boat':
      return selectedBoat ? { kind: 'boat', autoSailTrim, boat: selectedBoat, onSetAutoSailTrim, updateBoat } : { kind: 'empty', requestedType: selectedType };
    case 'mark':
      return selectedMark
        ? { kind: 'mark', activeFrame, mark: selectedMark, updateMark, updateMarkRoomZone, onConnectMarks, onRemoveMarkConnection, onReplaceMarkConnection }
        : { kind: 'empty', requestedType: selectedType };
    case 'connection':
      return selectedConnection && updateConnection
        ? { kind: 'connection', activeFrame, connection: selectedConnection, updateConnection }
        : { kind: 'empty', requestedType: selectedType };
    case 'arrow':
      return selectedArrow && updateArrow
        ? { kind: 'arrow', arrow: selectedArrow, updateArrow }
        : { kind: 'empty', requestedType: selectedType };
    case 'comment':
      if (selectedComment?.type === 'rule' && updateRuleComment) {
        return { kind: 'rule-comment', activeFrame, comment: selectedComment, updateRuleComment };
      }
      return selectedComment && selectedComment.type !== 'rule' && updateComment
        ? { kind: 'comment', comment: selectedComment, updateComment }
        : { kind: 'empty', requestedType: selectedType };
    case 'image':
      return selectedImage && updateImage
        ? { kind: 'image', image: selectedImage, updateImage }
        : { kind: 'empty', requestedType: selectedType };
    case null:
      return { kind: 'empty', requestedType: selectedType };
  }
}
