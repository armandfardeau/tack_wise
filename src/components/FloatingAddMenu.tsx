import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react';
import { ArrowUpRight, BookOpen, DoorOpen, Flag, Image, MapPin, MessageCircle, Plus, Sailboat, TriangleAlert, X } from 'lucide-react';
import posthog from 'posthog-js';
import type { Boat, Mark } from '../types';

interface FloatingAddMenuProps {
  onAddBoat: (boatType?: Boat['type']) => void;
  onAddMark: (shape?: Mark['shape']) => void;
  onAddArrow: () => void;
  onAddComment: () => void;
  onAddRuleComment: () => void;
  onAddImage: (src: string, name?: string) => void;
}

export default function FloatingAddMenu({ onAddBoat, onAddMark, onAddArrow, onAddComment, onAddRuleComment, onAddImage }: FloatingAddMenuProps) {
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

  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    const menu = menuRef.current;
    const canvasWrap = menu?.parentElement;
    if (!menu || !canvasWrap) return undefined;

    const updatePosition = () => {
      menu.style.removeProperty('--floating-add-menu-bottom');

      const baseBottom = Number.parseFloat(window.getComputedStyle(menu).bottom);
      if (!Number.isFinite(baseBottom)) return;

      const menuRect = menu.getBoundingClientRect();
      const canvasRect = canvasWrap.getBoundingClientRect();
      const topMargin = 8;
      const topOverflow = canvasRect.top + topMargin - menuRect.top;

      if (topOverflow > 0) {
        menu.style.setProperty(
          '--floating-add-menu-bottom',
          `${Math.max(0, baseBottom - topOverflow)}px`,
        );
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);

    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updatePosition);
    resizeObserver?.observe(canvasWrap);
    resizeObserver?.observe(menu);

    return () => {
      window.removeEventListener('resize', updatePosition);
      resizeObserver?.disconnect();
      menu.style.removeProperty('--floating-add-menu-bottom');
    };
  }, [isOpen]);

  const runAction = (action: () => void, elementType: string) => {
    posthog.capture('object_added', { element_type: elementType });
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
        posthog.capture('object_added', { element_type: 'image' });
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
          <button type="button" className="floating-add-action" onClick={() => runAction(() => onAddBoat('racing'), 'boat')}><Sailboat aria-hidden="true" size={16} /> <span>Add boat</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(() => onAddBoat('judge'), 'judge_boat')}><Flag aria-hidden="true" size={16} /> <span>Add judge boat</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(() => onAddMark(), 'mark')}><MapPin aria-hidden="true" size={16} /> <span>Add mark</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(() => onAddMark('obstruction'), 'obstruction')}><TriangleAlert aria-hidden="true" size={16} /> <span>Add obstruction</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(() => onAddMark('gate'), 'gate')}><DoorOpen aria-hidden="true" size={16} /> <span>Add gate</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(() => onAddMark('committeeBoat'), 'committee_boat')}><Flag aria-hidden="true" size={16} /> <span>Add committee boat</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(onAddArrow, 'arrow')}><ArrowUpRight aria-hidden="true" size={16} /> <span>Add arrow</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(onAddComment, 'comment')}><MessageCircle aria-hidden="true" size={16} /> <span>Add comment</span></button>
          <button type="button" className="floating-add-action" onClick={() => runAction(onAddRuleComment, 'rule_comment')}><BookOpen aria-hidden="true" size={16} /> <span>Add rule</span></button>
          <button type="button" className="floating-add-action" onClick={() => imageInputRef.current?.click()}><Image aria-hidden="true" size={16} /> <span>Add image</span></button>
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
        {isOpen ? <X aria-hidden="true" size={22} /> : <Plus aria-hidden="true" size={22} />}
      </button>
    </div>
  );
}
