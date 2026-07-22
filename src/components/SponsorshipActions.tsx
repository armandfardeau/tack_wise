import { ChevronDown, CreditCard, GitFork, Heart } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import StripeDonationForm from './StripeDonationForm';

export interface SponsorshipLinks {
  stripeUrl?: string;
  stripePublishableKey?: string;
  githubUrl?: string;
  donationUrl?: string;
}

interface SponsorshipActionsProps extends SponsorshipLinks {}

export function SponsorshipMenuItems({ stripeUrl, stripePublishableKey, githubUrl, donationUrl }: SponsorshipLinks) {
  return (
    <>
      {stripeUrl && (
        <a className="sponsorship-menu-item" role="menuitem" href={stripeUrl} target="_blank" rel="noreferrer">
          <CreditCard aria-hidden="true" size={16} />
          <span>
            <strong>Support with Stripe</strong>
            <small>One-time or recurring support</small>
          </span>
        </a>
      )}
      {!stripeUrl && stripePublishableKey && (
        <StripeDonationForm />
      )}
      {githubUrl && (
        <a className="sponsorship-menu-item" role="menuitem" href={githubUrl} target="_blank" rel="noreferrer">
          <GitFork aria-hidden="true" size={16} />
          <span>
            <strong>Sponsor on GitHub</strong>
            <small>Support the open-source project</small>
          </span>
        </a>
      )}
      {donationUrl && (
        <a className="sponsorship-menu-item" role="menuitem" href={donationUrl} target="_blank" rel="noreferrer">
          <Heart aria-hidden="true" size={16} />
          <span>
            <strong>Donate to open source</strong>
            <small>Help fund future Tack Wise development</small>
          </span>
        </a>
      )}
    </>
  );
}

interface MenuPosition {
  top: number;
  left: number;
  maxHeight: number;
}

export default function SponsorshipActions({ stripeUrl, stripePublishableKey, githubUrl, donationUrl }: SponsorshipActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
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
      const menu = menuRef.current;
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

  if (!stripeUrl && !stripePublishableKey && !githubUrl && !donationUrl) return null;

  return (
    <div className="sponsorship-actions" ref={containerRef}>
      <button
        type="button"
        className="header-tool-btn sponsorship-trigger"
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Support Tack Wise"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Heart aria-hidden="true" size={15} />
        Support
        <ChevronDown aria-hidden="true" size={14} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="sponsorship-menu"
          role="menu"
          aria-label="Support Tack Wise"
          style={menuPosition ? {
            top: menuPosition.top,
            left: menuPosition.left,
            maxHeight: menuPosition.maxHeight,
            visibility: 'visible',
          } : { visibility: 'hidden' }}
        >
          <p className="sponsorship-menu-title">Help keep Tack Wise sailing</p>
          <SponsorshipMenuItems stripeUrl={stripeUrl} stripePublishableKey={stripePublishableKey} githubUrl={githubUrl} donationUrl={donationUrl} />
        </div>
      )}
    </div>
  );
}
