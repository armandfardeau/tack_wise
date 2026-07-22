import type { InspectorView } from './types';
import { InspectorTabs } from './InspectorTabs';
import styles from './Inspector.module.css';

type CanvasSettingsInspectorProps = Extract<InspectorView, { kind: 'grid' }>;

export function CanvasSettingsInspector({
  displayMode,
  gridSnapEnabled,
  onSetDisplayMode,
  onSetShowFrameTitle,
  onSetShowFrameNumber,
  onSetGridSnapEnabled,
  onSetShowGrid,
  showFrameTitle,
  showFrameNumber,
  showGrid,
}: CanvasSettingsInspectorProps) {
  return (
    <InspectorTabs
      label="Canvas settings"
      tabs={[
        {
          id: 'grid',
          label: 'Magnetic Grid',
          content: (
            <div className={styles.editorForm}>
              <div className={`${styles.formRow} ${styles.flexRow}`}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={gridSnapEnabled} onChange={(event) => onSetGridSnapEnabled(event.target.checked)} />
                  <span>Snap boats &amp; marks</span>
                </label>
              </div>
              <div className={`${styles.formRow} ${styles.flexRow}`}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={showGrid} onChange={(event) => onSetShowGrid(event.target.checked)} />
                  <span>Show placement grid</span>
                </label>
              </div>
              <p className={styles.gridHint}>20px spacing · drag near an intersection</p>
            </div>
          ),
        },
        {
          id: 'header',
          label: 'Frame Header',
          content: (
            <div className={styles.editorForm}>
              <div className={`${styles.formRow} ${styles.flexRow}`}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={showFrameTitle} onChange={(event) => onSetShowFrameTitle(event.target.checked)} />
                  <span>Show frame title</span>
                </label>
              </div>
              <div className={`${styles.formRow} ${styles.flexRow}`}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={showFrameNumber} onChange={(event) => onSetShowFrameNumber(event.target.checked)} />
                  <span>Show frame number</span>
                </label>
              </div>
            </div>
          ),
        },
        {
          id: 'ghosts',
          label: 'Ghost Display',
          content: (
            <div className={styles.editorForm}>
              <p className={styles.gridHint}>Show earlier frames as translucent ghosts on the canvas.</p>
              <div className={`${styles.formRow} ${styles.flexRow}`}>
                <label className={styles.checkboxLabel}>
                  <input type="radio" name="ghost-display-mode" value="single" checked={displayMode === 'single'} onChange={() => onSetDisplayMode('single')} />
                  <span>Previous frame only</span>
                </label>
              </div>
              <div className={`${styles.formRow} ${styles.flexRow}`}>
                <label className={styles.checkboxLabel}>
                  <input type="radio" name="ghost-display-mode" value="cumulative" checked={displayMode === 'cumulative'} onChange={() => onSetDisplayMode('cumulative')} />
                  <span>All previous frames</span>
                </label>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
