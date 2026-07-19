import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Eye, Moon, Presentation, Sun } from 'lucide-react';
import type { Theme } from '../types';

interface ViewActionsProps {
  className?: string;
  presenterMode: boolean;
  theme: Theme;
  onToggleTheme?: () => void;
  onTogglePresenter?: () => void;
}

export default function ViewActions({
  className = 'view-actions',
  presenterMode,
  theme,
  onToggleTheme,
  onTogglePresenter,
}: ViewActionsProps) {
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

  useEffect(() => {
    if (!isViewMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!viewMenuRef.current?.contains(event.target as Node)) setIsViewMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsViewMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isViewMenuOpen]);

  const closeViewMenu = () => setIsViewMenuOpen(false);

  return (
    <div className={className}>
      <div ref={viewMenuRef} className="view-dropdown">
        <button
          type="button"
          className="action-btn view-menu-trigger"
          aria-expanded={isViewMenuOpen}
          aria-haspopup="menu"
          aria-label="View options"
          onClick={() => setIsViewMenuOpen((isOpen) => !isOpen)}
        >
          <span className="action-icon" aria-hidden="true"><Eye size={16} /></span>
          <span className="action-label">View</span>
          <span className="view-menu-chevron" aria-hidden="true"><ChevronDown size={14} /></span>
        </button>
        {isViewMenuOpen && <div className="view-dropdown-menu" role="menu" aria-label="View options">
          <button
            type="button"
            className="action-btn view-menu-item"
            role="menuitem"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => {
              onToggleTheme?.();
              closeViewMenu();
            }}
          >
            <span className="action-icon" aria-hidden="true">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</span>
            <span className="action-label">{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
          </button>
          <button
            type="button"
            className="action-btn view-menu-item"
            role="menuitem"
            onClick={() => {
              onTogglePresenter?.();
              closeViewMenu();
            }}
          >
            <span className="action-icon" aria-hidden="true"><Presentation size={16} /></span>
            <span className="action-label">{presenterMode ? 'Exit presenter' : 'Presenter mode'}</span>
          </button>
        </div>}
      </div>
    </div>
  );
}
