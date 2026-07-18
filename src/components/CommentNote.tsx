import { Group, Rect, Text } from 'react-konva';
import type { CommentNote as CommentNoteModel } from '../types';

interface CommentNoteProps {
  comment: CommentNoteModel;
  isSelected: boolean;
  onMove?: (id: string, position: { x: number; y: number }) => void;
  onOpenControls?: () => void;
  onSelect?: (id: string) => void;
  isShadow?: boolean;
}

export default function CommentNote({ comment, isSelected, onMove, onOpenControls, onSelect, isShadow = false }: CommentNoteProps) {
  const width = comment.width ?? 180;
  const fontSize = comment.fontSize ?? 14;

  return (
    <Group
      x={comment.x}
      y={comment.y}
      draggable={!isShadow}
      opacity={isShadow ? 0.22 : 1}
      listening={!isShadow}
      onClick={() => {
        onSelect?.(comment.id);
        onOpenControls?.();
      }}
      onTap={() => {
        onSelect?.(comment.id);
        onOpenControls?.();
      }}
      onDragStart={() => onSelect?.(comment.id)}
      onDragEnd={(event) => onMove?.(comment.id, { x: event.target.x(), y: event.target.y() })}
    >
      <Rect
        width={width}
        height={Math.max(48, comment.text.split('\n').length * (fontSize + 5) + 18)}
        fill="#172033"
        stroke={isSelected ? '#22d3ee' : comment.color}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={6}
        shadowColor="#000"
        shadowBlur={isShadow ? 0 : 5}
        shadowOpacity={0.25}
      />
      <Text
        text={comment.text}
        x={10}
        y={9}
        width={width - 20}
        fontSize={fontSize}
        fill={comment.color}
        lineHeight={1.25}
        wrap="word"
      />
    </Group>
  );
}
