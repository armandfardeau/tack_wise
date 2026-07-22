import type { SelectedType } from '../../hooks/useScenario';
import type {
  Boat,
  CommentNote,
  DiagramImage,
  DisplayMode,
  Frame,
  Mark,
  MarkConnection,
  RuleComment,
  TacticalArrow,
} from '../../types';

export type UpdateBoat = (boatId: string, changes: Partial<Boat>) => void;
export type UpdateMark = (markId: string, changes: Partial<Mark>) => void;
export type UpdateConnection = (connectionId: string, changes: Partial<MarkConnection>) => void;
export type UpdateArrow = (arrowId: string, changes: Partial<TacticalArrow>) => void;
export type UpdateComment = (commentId: string, changes: Partial<CommentNote>) => void;
export type UpdateRuleComment = (commentId: string, changes: Partial<RuleComment>) => void;
export type UpdateImage = (imageId: string, changes: Partial<DiagramImage>) => void;
export type UpdateActiveFrame = (changes: Partial<Frame>) => void;

export interface ConnectionAnchors {
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export type DeletableObject = 'Boat' | 'Mark' | 'Connection' | 'Arrow' | 'Comment' | 'Image';

export type InspectorView =
  | {
    kind: 'wind';
    activeFrame: Frame;
    updateActiveFrame: UpdateActiveFrame;
  }
  | {
    kind: 'grid';
    displayMode: DisplayMode;
    gridSnapEnabled: boolean;
    onSetGridSnapEnabled: (enabled: boolean) => void;
    onSetDisplayMode: (mode: DisplayMode) => void;
    onSetShowFrameTitle: (show: boolean) => void;
    onSetShowFrameNumber: (show: boolean) => void;
    onSetShowGrid: (show: boolean) => void;
    showFrameTitle: boolean;
    showFrameNumber: boolean;
    showGrid: boolean;
  }
  | {
    kind: 'playback';
    isPlaying: boolean;
    onSetPlaySpeed: (speed: number) => void;
    onTogglePlaying: () => void;
    playSpeed: number;
  }
  | {
    kind: 'boat';
    boat: Boat;
    autoSailTrim: boolean;
    onSetAutoSailTrim: (enabled: boolean) => void;
    updateBoat: UpdateBoat;
  }
  | {
    kind: 'mark';
    activeFrame: Frame;
    mark: Mark;
    updateMark: UpdateMark;
    updateMarkRoomZone?: (markId: string, changes: Partial<Pick<Mark, 'showZone' | 'zoneRadius'>>) => void;
    onConnectMarks?: (sourceMarkId: string, targetMarkId: string, anchors?: ConnectionAnchors) => void;
    onRemoveMarkConnection?: (connectionId: string) => void;
    onReplaceMarkConnection?: (connectionId: string, nextTargetMarkId: string) => void;
  }
  | {
    kind: 'connection';
    activeFrame: Frame;
    connection: MarkConnection;
    updateConnection: UpdateConnection;
  }
  | {
    kind: 'arrow';
    arrow: TacticalArrow;
    updateArrow: UpdateArrow;
  }
  | {
    kind: 'comment';
    comment: CommentNote;
    updateComment: UpdateComment;
  }
  | {
    kind: 'rule-comment';
    activeFrame: Frame;
    comment: RuleComment;
    updateRuleComment: UpdateRuleComment;
  }
  | {
    kind: 'image';
    image: DiagramImage;
    updateImage: UpdateImage;
  }
  | {
    kind: 'empty';
    requestedType: SelectedType;
  };
