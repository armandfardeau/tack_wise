import { ChevronDown, CreditCard, GitFork, Heart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import StripeDonationForm from './StripeDonationForm';

export interface SponsorshipLinks {
  stripeUrl?: string;
  stripePublishableKey?: string;
  githubUrl?: string;
  donationUrl?: string;
}

interface SponsorshipActionsProps extends SponsorshipLinks {}

export default function SponsorshipActions({ stripeUrl, stripePublishableKey, githubUrl, donationUrl }: SponsorshipActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  if (!stripeUrl && !stripePublishableKey && !githubUrl && !donationUrl) return null;

  return (
    <div className="sponsorship-actions" ref={containerRef}>
      <button
        type="button"
        className="header-tool-btn sponsorship-trigger"
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
        <div className="sponsorship-menu" role="menu" aria-label="Support Tack Wise">
          <p className="sponsorship-menu-title">Help keep Tack Wise sailing</p>
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
        </div>
      )}
    </div>
  );
}
