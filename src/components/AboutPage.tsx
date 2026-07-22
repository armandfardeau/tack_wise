import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  GitBranch,
  Layers3,
  Play,
  Sailboat,
  Share2,
  Sun,
} from 'lucide-react';
import BrandMark from './BrandMark';
import type { Theme } from '../types';
import headerStyles from './AppHeader.module.css';

interface AboutPageProps {
  theme: Theme;
  onBackToEditor: () => void;
  onToggleTheme: () => void;
}

const repositoryUrl = 'https://github.com/armandfardeau/tack_wise';

export default function AboutPage({ theme, onBackToEditor, onToggleTheme }: AboutPageProps) {
  return (
    <main className={`app-shell ${theme}-theme about-shell`}>
      <header className={`${headerStyles.appHeader} about-header`}>
        <div className={headerStyles.headerMain}>
          <div className={headerStyles.branding}>
            <span className={headerStyles.eyebrow}>Tactical Sailing Simulator</span>
            <h1>Tack Wise <BrandMark className={headerStyles.brandIcon} aria-hidden="true" size={24} /></h1>
          </div>
        </div>
        <div className={headerStyles.headerTools} aria-label="About page tools">
          <button type="button" className={headerStyles.headerToolButton} onClick={onToggleTheme}>
            <Sun aria-hidden="true" size={15} />
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <a className={headerStyles.headerToolButton} href={repositoryUrl} target="_blank" rel="noreferrer">
            <GitBranch aria-hidden="true" size={15} />
            GitHub
          </a>
          <button type="button" className="about-back-btn" onClick={onBackToEditor}>
            <ArrowLeft aria-hidden="true" size={15} />
            Back to simulator
          </button>
        </div>
      </header>

      <div className="about-page">
        <section className="about-hero" aria-labelledby="about-title">
          <div className="about-hero-copy">
            <p className="about-eyebrow">About the project</p>
            <h2 id="about-title">Make the situation<br /><span>the lesson.</span></h2>
            <p className="about-lede">
              Tack Wise is a browser-based workspace for drawing, animating, explaining,
              and sharing tactical sailing situations.
            </p>
            <div className="about-hero-actions">
              <button type="button" className="about-primary-btn" onClick={onBackToEditor}>
                Open the simulator
                <ArrowRight aria-hidden="true" size={16} />
              </button>
              <a className="about-text-link" href={repositoryUrl} target="_blank" rel="noreferrer">
                Explore the source <ExternalLink aria-hidden="true" size={14} />
              </a>
            </div>
          </div>

          <div className="about-hero-board" aria-label="A tactical sailing situation diagram">
            <div className="about-board-label">Situation 01 <span>•</span> Port-starboard</div>
            <div className="about-board-wind"><span>WIND</span><i aria-hidden="true" /></div>
            <div className="about-board-grid" aria-hidden="true" />
            <div className="about-course-line about-course-line-one" aria-hidden="true" />
            <div className="about-course-line about-course-line-two" aria-hidden="true" />
            <div className="about-mark about-mark-top" aria-hidden="true" />
            <div className="about-mark about-mark-bottom" aria-hidden="true" />
            <div className="about-boat about-boat-blue"><Sailboat aria-hidden="true" size={29} /></div>
            <div className="about-boat about-boat-red"><Sailboat aria-hidden="true" size={29} /></div>
            <div className="about-board-note">Who has room?</div>
            <div className="about-board-footer"><span>01</span><span>02</span><span>03</span><span className="is-active">04</span></div>
          </div>
        </section>

        <section className="about-story" aria-labelledby="story-title">
          <div>
            <p className="about-eyebrow">Why Tack Wise exists</p>
            <h3 id="story-title">Clearer debriefs.<br />Better decisions.</h3>
          </div>
          <div className="about-story-copy">
            <p>
              Sailing situations are spatial, fast-moving, and often difficult to reconstruct
              after the fact. Tack Wise gives coaches, sailors, umpires, and protest committees
              a shared visual language for the moments that matter.
            </p>
            <p>
              Build a sequence frame by frame, replay the movement, add rule-focused notes, and
              send a portable scenario to someone else. The result is a practical teaching aid,
              ready wherever a browser is available.
            </p>
          </div>
        </section>

        <section className="about-capabilities" aria-labelledby="capabilities-title">
          <div className="about-section-heading">
            <p className="about-eyebrow">The toolkit</p>
            <h3 id="capabilities-title">From first mark to final replay.</h3>
          </div>
          <div className="about-capability-grid">
            <article className="about-capability-card">
              <div className="about-capability-icon"><Layers3 aria-hidden="true" size={20} /></div>
              <h4>Author the scene</h4>
              <p>Place boats, marks, gates, arrows, comments, and rule cards on a flexible tactical canvas.</p>
            </article>
            <article className="about-capability-card">
              <div className="about-capability-icon"><Play aria-hidden="true" size={20} /></div>
              <h4>Explain the movement</h4>
              <p>Turn a static diagram into a step-by-step or cumulative replay that makes the geometry easy to follow.</p>
            </article>
            <article className="about-capability-card">
              <div className="about-capability-icon"><Share2 aria-hidden="true" size={20} /></div>
              <h4>Share the learning</h4>
              <p>Export a diagram, animation, video, or portable scenario link for the next debrief or classroom.</p>
            </article>
          </div>
        </section>

        <section className="about-author" aria-labelledby="author-title">
          <div className="about-author-mark" aria-hidden="true">AF</div>
          <div className="about-author-copy">
            <p className="about-eyebrow">The author</p>
            <h3 id="author-title">Built by Armand Fardeau.</h3>
            <p>
              Tack Wise is developed and maintained by Armand Fardeau as an open-source project
              for making sailing knowledge easier to see, discuss, and pass on.
            </p>
            <a className="about-text-link" href="https://github.com/armandfardeau" target="_blank" rel="noreferrer">
              Visit Armand on GitHub <ExternalLink aria-hidden="true" size={14} />
            </a>
          </div>
          <div className="about-author-cta">
            <span>Have a situation to explain?</span>
            <button type="button" className="about-primary-btn" onClick={onBackToEditor}>
              Start drawing <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
        </section>

        <footer className="about-footer">
          <span><BrandMark aria-hidden="true" size={15} /> Tack Wise</span>
          <span>Draw the moment. Understand the move.</span>
        </footer>
      </div>
    </main>
  );
}
