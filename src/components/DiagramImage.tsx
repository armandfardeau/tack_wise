import { useEffect, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type { DiagramImage as DiagramImageModel } from '../types';

interface DiagramImageProps {
  image: DiagramImageModel;
  isSelected: boolean;
  onMove?: (id: string, position: { x: number; y: number }) => void;
  onOpenInspector?: () => void;
  onSelect?: (id: string) => void;
  readOnly?: boolean;
  isShadow?: boolean;
}

export default function DiagramImage({ image, isSelected, onMove, onOpenInspector, onSelect, readOnly = false, isShadow = false }: DiagramImageProps) {
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const element = new window.Image();
    element.onload = () => setLoadedImage(element);
    element.src = image.src;
    return () => {
      element.onload = null;
    };
  }, [image.src]);

  if (!loadedImage) return null;

  return (
    <KonvaImage
      image={loadedImage}
      x={image.x}
      y={image.y}
      width={image.width}
      height={image.height}
      rotation={image.rotation ?? 0}
      opacity={isShadow ? 0.22 : 1}
      stroke={isSelected ? '#22d3ee' : undefined}
      strokeWidth={isSelected ? 3 : 0}
      draggable={!isShadow && !readOnly}
      listening={!isShadow}
      onClick={() => {
        onSelect?.(image.id);
      }}
      onTap={() => {
        onSelect?.(image.id);
      }}
      onDblClick={() => onOpenInspector?.()}
      onDblTap={() => onOpenInspector?.()}
      onDragStart={() => onSelect?.(image.id)}
      onDragEnd={(event) => onMove?.(image.id, { x: event.target.x(), y: event.target.y() })}
    />
  );
}
