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
import styles from './AboutPage.module.css';

interface AboutPageProps {
  theme: Theme;
  onBackToEditor: () => void;
  onToggleTheme: () => void;
}

const repositoryUrl = 'https://github.com/armandfardeau/tack_wise';

export default function AboutPage({ theme, onBackToEditor, onToggleTheme }: AboutPageProps) {
  return (
    <main className={`app-shell ${theme}-theme ${styles.aboutShell}`}>
      <header className={`${headerStyles.appHeader} ${styles.aboutHeader}`}>
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
          <button type="button" className={styles.aboutBackButton} onClick={onBackToEditor}>
            <ArrowLeft aria-hidden="true" size={15} />
            Back to simulator
          </button>
        </div>
      </header>

      <div className={styles.aboutPage}>
        <section className={styles.hero} aria-labelledby="about-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>About the project</p>
            <h2 id="about-title">Make the situation<br /><span>the lesson.</span></h2>
            <p className={styles.lede}>
              Tack Wise is a browser-based workspace for drawing, animating, explaining,
              and sharing tactical sailing situations.
            </p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton} onClick={onBackToEditor}>
                Open the simulator
                <ArrowRight aria-hidden="true" size={16} />
              </button>
              <a className={styles.textLink} href={repositoryUrl} target="_blank" rel="noreferrer">
                Explore the source <ExternalLink aria-hidden="true" size={14} />
              </a>
            </div>
          </div>

          <div className={styles.heroBoard} aria-label="A tactical sailing situation diagram">
            <div className={styles.boardLabel}>Situation 01 <span>•</span> Port-starboard</div>
            <div className={styles.boardWind}><span>WIND</span><i aria-hidden="true" /></div>
            <div className={styles.boardGrid} aria-hidden="true" />
            <div className={`${styles.courseLine} ${styles.courseLineOne}`} aria-hidden="true" />
            <div className={`${styles.courseLine} ${styles.courseLineTwo}`} aria-hidden="true" />
            <div className={`${styles.mark} ${styles.markTop}`} aria-hidden="true" />
            <div className={`${styles.mark} ${styles.markBottom}`} aria-hidden="true" />
            <div className={`${styles.boat} ${styles.boatBlue}`}><Sailboat aria-hidden="true" size={29} /></div>
            <div className={`${styles.boat} ${styles.boatRed}`}><Sailboat aria-hidden="true" size={29} /></div>
            <div className={styles.boardNote}>Who has room?</div>
            <div className={styles.boardFooter}><span>01</span><span>02</span><span>03</span><span className={styles.isActive}>04</span></div>
          </div>
        </section>

        <section className={styles.story} aria-labelledby="story-title">
          <div>
            <p className={styles.eyebrow}>Why Tack Wise exists</p>
            <h3 id="story-title">Clearer debriefs.<br />Better decisions.</h3>
          </div>
          <div className={styles.storyCopy}>
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

        <section className={styles.capabilities} aria-labelledby="capabilities-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>The toolkit</p>
            <h3 id="capabilities-title">From first mark to final replay.</h3>
          </div>
          <div className={styles.capabilityGrid}>
            <article className={styles.capabilityCard}>
              <div className={styles.capabilityIcon}><Layers3 aria-hidden="true" size={20} /></div>
              <h4>Author the scene</h4>
              <p>Place boats, marks, gates, arrows, comments, and rule cards on a flexible tactical canvas.</p>
            </article>
            <article className={styles.capabilityCard}>
              <div className={styles.capabilityIcon}><Play aria-hidden="true" size={20} /></div>
              <h4>Explain the movement</h4>
              <p>Turn a static diagram into a step-by-step or cumulative replay that makes the geometry easy to follow.</p>
            </article>
            <article className={styles.capabilityCard}>
              <div className={styles.capabilityIcon}><Share2 aria-hidden="true" size={20} /></div>
              <h4>Share the learning</h4>
              <p>Export a diagram, animation, video, or portable scenario link for the next debrief or classroom.</p>
            </article>
          </div>
        </section>

        <section className={styles.author} aria-labelledby="author-title">
          <div className={styles.authorMark} aria-hidden="true">AF</div>
          <div className={styles.authorCopy}>
            <p className={styles.eyebrow}>The author</p>
            <h3 id="author-title">Built by Armand Fardeau.</h3>
            <p>
              Tack Wise is developed and maintained by Armand Fardeau as an open-source project
              for making sailing knowledge easier to see, discuss, and pass on.
            </p>
            <a className={styles.textLink} href="https://github.com/armandfardeau" target="_blank" rel="noreferrer">
              Visit Armand on GitHub <ExternalLink aria-hidden="true" size={14} />
            </a>
          </div>
          <div className={styles.authorCta}>
            <span>Have a situation to explain?</span>
            <button type="button" className={styles.primaryButton} onClick={onBackToEditor}>
              Start drawing <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
        </section>

        <footer className={styles.footer}>
          <span><BrandMark aria-hidden="true" size={15} /> Tack Wise</span>
          <span>Draw the moment. Understand the move.</span>
        </footer>
      </div>
    </main>
  );
}
