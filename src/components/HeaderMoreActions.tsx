import { useEffect, useRef, useState } from 'react';
import { Copy, ExternalLink, Heart, Info, MoreHorizontal } from 'lucide-react';
import { SponsorshipMenuItems, type SponsorshipLinks } from './SponsorshipActions';

interface HeaderMoreActionsProps {
  onShareScenario?: () => void;
  onOpenAbout?: () => void;
  sponsorship?: SponsorshipLinks;
}

const repositoryUrl = 'https://github.com/armandfardeau/tack_wise';

export default function HeaderMoreActions({ onShareScenario, onOpenAbout, sponsorship }: HeaderMoreActionsProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="header-more-actions" ref={menuRef}>
      <button
        type="button"
        className="header-tool-btn header-more-trigger"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="More options"
        onClick={() => setIsOpen((open) => !open)}
      >
        <MoreHorizontal aria-hidden="true" size={16} />
        <span className="header-more-trigger-label">More</span>
      </button>

      {isOpen && (
        <div className="header-more-menu" role="menu" aria-label="About and support">
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
