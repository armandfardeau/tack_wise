import { Group, Rect, Text } from 'react-konva';
import { COMMENT_PADDING_X, COMMENT_PADDING_Y } from '../constants';
import type { FrameComment, Theme } from '../types';
import { getCommentHeight, getCommentText } from '../utils/simulation';

interface CommentNoteProps {
  comment: FrameComment;
  isSelected: boolean;
  theme: Theme;
  onMove?: (id: string, position: { x: number; y: number }) => void;
  onOpenInspector?: () => void;
  onSelect?: (id: string) => void;
  readOnly?: boolean;
  isShadow?: boolean;
}

export default function CommentNote({ comment, isSelected, theme, onMove, onOpenInspector, onSelect, readOnly = false, isShadow = false }: CommentNoteProps) {
  const width = comment.width ?? 180;
  const fontSize = comment.fontSize ?? 14;
  const text = getCommentText(comment);
  const isRule = comment.type === 'rule';
  const height = getCommentHeight({ ...comment, text });

  return (
    <Group
      x={comment.x}
      y={comment.y}
      draggable={!isShadow && !readOnly}
      opacity={isShadow ? 0.22 : 1}
      listening={!isShadow}
      onClick={() => {
        onSelect?.(comment.id);
      }}
      onTap={() => {
        onSelect?.(comment.id);
      }}
      onDblClick={() => onOpenInspector?.()}
      onDblTap={() => onOpenInspector?.()}
      onDragStart={readOnly ? undefined : () => onSelect?.(comment.id)}
      onDragEnd={readOnly ? undefined : (event) => onMove?.(comment.id, { x: event.target.x(), y: event.target.y() })}
    >
      <Rect
        width={width}
        height={height}
        fill={theme === 'light' ? '#ffffff' : '#172033'}
        stroke={isSelected ? '#22d3ee' : isRule ? '#f59e0b' : comment.color}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={6}
        shadowColor="#000"
        shadowBlur={isShadow ? 0 : 5}
        shadowOpacity={0.25}
      />
      <Text
        text={text}
        x={COMMENT_PADDING_X}
        y={COMMENT_PADDING_Y}
        width={width - COMMENT_PADDING_X * 2}
        fontSize={fontSize}
        fill={comment.color}
        lineHeight={1.25}
        wrap="word"
      />
    </Group>
  );
}
