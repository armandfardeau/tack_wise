import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Copy, ExternalLink, Heart, Info, MoreHorizontal } from 'lucide-react';
import { SponsorshipMenuItems, type SponsorshipLinks } from './SponsorshipActions';
import headerStyles from './AppHeader.module.css';

interface HeaderMoreActionsProps {
  onShareScenario?: () => void;
  onOpenAbout?: () => void;
  sponsorship?: SponsorshipLinks;
}

const repositoryUrl = 'https://github.com/armandfardeau/tack_wise';

interface MenuPosition {
  top: number;
  left: number;
  maxHeight: number;
}

export default function HeaderMoreActions({ onShareScenario, onOpenAbout, sponsorship }: HeaderMoreActionsProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const hasSupport = Boolean(sponsorship?.stripeUrl || sponsorship?.stripePublishableKey || sponsorship?.githubUrl || sponsorship?.donationUrl);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return undefined;
    }

    const updateMenuPosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      const menu = menuPanelRef.current;
      if (!triggerRect || !menu) return;

      const viewportMargin = 12;
      const menuGap = 8;
      const menuRect = menu.getBoundingClientRect();
      const menuWidth = Math.min(menuRect.width, window.innerWidth - viewportMargin * 2);
      const maxLeft = Math.max(viewportMargin, window.innerWidth - menuWidth - viewportMargin);
      const left = Math.min(Math.max(viewportMargin, triggerRect.right - menuWidth), maxLeft);
      const spaceBelow = Math.max(0, window.innerHeight - triggerRect.bottom - menuGap - viewportMargin);
      const spaceAbove = Math.max(0, triggerRect.top - menuGap - viewportMargin);
      const opensAbove = menuRect.height > spaceBelow && spaceAbove > spaceBelow;
      const maxHeight = opensAbove ? spaceAbove : spaceBelow;
      const top = opensAbove
        ? Math.max(viewportMargin, triggerRect.top - menuGap - Math.min(menuRect.height, maxHeight))
        : triggerRect.bottom + menuGap;

      setMenuPosition({ top, left, maxHeight });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen]);

  return (
    <div className="header-more-actions" ref={menuRef}>
      <button
        type="button"
        className={`${headerStyles.headerToolButton} header-more-trigger`}
        ref={triggerRef}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="More options"
        onClick={() => setIsOpen((open) => !open)}
      >
        <MoreHorizontal aria-hidden="true" size={16} />
        <span className="header-more-trigger-label">More</span>
      </button>

      {isOpen && (
        <div
          className="header-more-menu"
          ref={menuPanelRef}
          role="menu"
          aria-label="About and support"
          style={menuPosition ? {
            top: menuPosition.top,
            left: menuPosition.left,
            maxHeight: menuPosition.maxHeight,
            visibility: 'visible',
          } : { visibility: 'hidden' }}
        >
          <div className="header-more-about">
            <div className="header-more-section-heading"><Info aria-hidden="true" size={15} /> About Tack Wise</div>
            <p>A browser-based workspace for drawing, explaining, and sharing tactical sailing situations.</p>
            {onOpenAbout && <button type="button" className="header-more-link" role="menuitem" onClick={() => {
              onOpenAbout();
              setIsOpen(false);
            }}>
              <Info aria-hidden="true" size={14} /> Open About page
            </button>}
            <a className="header-more-link" role="menuitem" href={repositoryUrl} target="_blank" rel="noreferrer" onClick={() => setIsOpen(false)}>
              <ExternalLink aria-hidden="true" size={14} /> Explore the project
            </a>
          </div>

          {hasSupport && <>
            <div className="header-more-divider" role="separator" />
            <div className="header-more-section-heading"><Heart aria-hidden="true" size={15} /> Support</div>
            <SponsorshipMenuItems {...sponsorship} />
          </>}

          {onShareScenario && <>
            <div className="header-more-divider" role="separator" />
            <button type="button" className="header-more-link" role="menuitem" onClick={() => {
              onShareScenario();
              setIsOpen(false);
            }}>
              <Copy aria-hidden="true" size={14} /> Copy share link
            </button>
          </>}
        </div>
      )}
    </div>
  );
}
