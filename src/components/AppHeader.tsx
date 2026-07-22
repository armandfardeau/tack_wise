import HeaderMoreActions from './HeaderMoreActions';
import ViewActions from './ViewActions';
import SponsorshipActions, { type SponsorshipLinks } from './SponsorshipActions';
import { Info, Sailboat } from 'lucide-react';
import type { Theme } from '../types';

interface AppHeaderProps {
  isExporting?: boolean;
  presenterMode?: boolean;
  onOpenAbout?: () => void;
  onToggleTheme?: () => void;
  onTogglePresenter?: () => void;
  theme?: Theme;
  sponsorship?: SponsorshipLinks;
}

export default function AppHeader({
  isExporting = false,
  presenterMode = false,
  onOpenAbout,
  onToggleTheme,
  onTogglePresenter,
  theme = 'dark',
  sponsorship,
}: AppHeaderProps) {
  return (
    <header className="app-header" aria-busy={isExporting}>
      <div className="header-main">
        <div className="branding">
          <span className="eyebrow">Tactical Sailing Simulator</span>
          <h1>Tack Wise <Sailboat className="brand-icon" aria-hidden="true" size={24} /></h1>
        </div>
      </div>
      <div className="header-tools" aria-label="Scenario tools">
        <ViewActions
          className="view-actions header-view-actions"
          presenterMode={presenterMode}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onTogglePresenter={onTogglePresenter}
        />
        {onOpenAbout && <button type="button" className="header-tool-btn header-about-btn" onClick={onOpenAbout}><Info aria-hidden="true" size={15} /> About</button>}
        <div className="header-standard-utility-actions">
          <SponsorshipActions {...sponsorship} />
        </div>
        <HeaderMoreActions onOpenAbout={onOpenAbout} sponsorship={sponsorship} />
      </div>
    </header>
  );
}
