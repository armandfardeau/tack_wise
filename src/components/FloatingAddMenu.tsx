import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Mark } from '../types';

interface FloatingAddMenuProps {
  onAddBoat: () => void;
  onAddMark: (shape?: Mark['shape']) => void;
  onAddArrow: () => void;
  onAddComment: () => void;
  onAddImage: (src: string, name?: string) => void;
}

export default function FloatingAddMenu({ onAddBoat, onAddMark, onAddArrow, onAddComment, onAddImage }: FloatingAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [isOpen]);

  const runAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onAddImage(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className={`floating-add-menu${isOpen ? ' is-open' : ''}`}>
      {isOpen && (
        <div className="floating-add-actions" aria-label="Add diagram object">
          <button type="button" className="floating-add-action" onClick={() => runAction(onAddBoat)}>⛵ <span>Add boat</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(() => onAddMark())}>📍 <span>Add mark</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(() => onAddMark('obstruction'))}>⚠️ <span>Add obstruction</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(() => onAddMark('gate'))}>🚪 <span>Add gate</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(onAddArrow)}>↗️ <span>Add arrow</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(onAddComment)}>💬 <span>Add comment</span></button>
          <button type="button" className="floating-add-action" onClick={() => imageInputRef.current?.click()}>🖼️ <span>Add image</span></button>
          <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleImageChange} hidden />
        </div>
      )}
      <button
        type="button"
        className="floating-add-button"
        aria-label={isOpen ? 'Close add menu' : 'Open add menu'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">{isOpen ? '×' : '+'}</span>
      </button>
    </div>
  );
}
