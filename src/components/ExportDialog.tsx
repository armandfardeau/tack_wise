import { Download, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ExportFormat, ExportFps, ExportOptions, ExportQuality, Theme } from '../types';
import { DEFAULT_EXPORT_FPS, EXPORT_FPS_OPTIONS } from '../types';
import { EXPORT_QUALITY_PRESETS } from '../utils/exportSettings';
import useModalFocus, { type ModalFocusRef } from '../hooks/useModalFocus';
import styles from './ExportDialog.module.css';

interface ExportDialogProps {
  theme: Theme;
  exportQuality?: ExportQuality;
  onExportQualityChange?: (quality: ExportQuality) => void;
  returnFocusRef?: ModalFocusRef;
  onCancel: () => void;
  onExport: (options: ExportOptions) => void;
}

const formatOptions: Array<{ value: ExportFormat; label: string; description: string }> = [
  { value: 'png', label: 'PNG image', description: 'A high-quality still image with transparency.' },
  { value: 'jpeg', label: 'JPG image', description: 'A compact still image for sharing.' },
  { value: 'gif', label: 'GIF animation', description: 'An animated image of the full scenario.' },
  { value: 'webm', label: 'WEBM video', description: 'A browser-friendly video of the full scenario.' },
  { value: 'mp4', label: 'MP4 video', description: 'A widely compatible video of the full scenario.' },
  { value: 'json', label: 'JSON scenario', description: 'The editable scenario data and presentation settings.' },
];

function isAnimatedFormat(format: ExportFormat) {
  return format === 'gif' || format === 'webm' || format === 'mp4';
}

function isVisualFormat(format: ExportFormat) {
  return format !== 'json';
}

export default function ExportDialog({
  theme,
  exportQuality = 'standard',
  onExportQualityChange = () => undefined,
  returnFocusRef,
  onCancel,
  onExport,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [exportTheme, setExportTheme] = useState<Theme>(theme);
  const [fps, setFps] = useState<ExportFps>(DEFAULT_EXPORT_FPS);
  const [autoFit, setAutoFit] = useState(true);
  const formatSelectRef = useRef<HTMLSelectElement>(null);
  const dialogRef = useModalFocus<HTMLFormElement>({ initialFocusRef: formatSelectRef, returnFocusRef });
  const selectedFormat = formatOptions.find((option) => option.value === format) ?? formatOptions[0];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onExport({ format, theme: exportTheme, fps, autoFit: isVisualFormat(format) && autoFit });
  };

  return (
    <div
      className={styles.exportDialogBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <form ref={dialogRef} className={styles.exportDialog} role="dialog" aria-modal="true" aria-labelledby="export-dialog-title" tabIndex={-1} onSubmit={handleSubmit}>
        <header className={styles.exportDialogHeader}>
          <div>
            <p className={styles.exportDialogEyebrow}>Save your scenario</p>
            <h2 id="export-dialog-title">Export</h2>
          </div>
          <button type="button" className={styles.exportDialogClose} aria-label="Close export dialog" onClick={onCancel}>
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div className={styles.exportDialogFields}>
          <label className={styles.exportDialogField}>
            <span>Format</span>
            <select ref={formatSelectRef} aria-label="Export format" value={format} onChange={(event) => setFormat(event.target.value as ExportFormat)}>
              {formatOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <small>{selectedFormat.description}</small>
          </label>

          {isVisualFormat(format) && (
            <>
              <fieldset className={`${styles.exportDialogField} ${styles.exportDialogThemeField}`}>
                <legend>Theme</legend>
                <div className={styles.exportDialogThemeOptions}>
                  {(['dark', 'light'] as Theme[]).map((option) => (
                    <label key={option} className={`${styles.exportThemeOption} ${exportTheme === option ? styles.isSelected : ''}`}>
                      <input
                        type="radio"
                        name="export-theme"
                        value={option}
                        checked={exportTheme === option}
                        onChange={() => setExportTheme(option)}
                      />
                      <span className={`${styles.exportThemeSwatch} ${option === 'dark' ? styles.darkTheme : styles.lightTheme}`} aria-hidden="true" />
                      <span>{option === 'dark' ? 'Dark' : 'Light'}</span>
                    </label>
                  ))}
                </div>
                <small>Choose the canvas appearance without changing the app theme.</small>
              </fieldset>

              <label className={styles.exportDialogAutoFit}>
                <input
                  type="checkbox"
                  aria-label="Auto-fit canvas"
                  checked={autoFit}
                  onChange={(event) => setAutoFit(event.target.checked)}
                />
                <span>
                  <strong>Auto-fit canvas</strong>
                  <small>Fit all scenario items in the export without changing your canvas view.</small>
                </span>
              </label>
            </>
          )}

          {isAnimatedFormat(format) && (
            <>
              <label className={styles.exportDialogField}>
                <span>Frames per second</span>
                <select aria-label="Export FPS" value={fps} onChange={(event) => setFps(Number(event.target.value) as ExportFps)}>
                  {EXPORT_FPS_OPTIONS.map((option) => <option key={option} value={option}>{option} FPS</option>)}
                </select>
                <small>Higher FPS creates smoother motion and larger exports.</small>
              </label>
              <label className={styles.exportDialogField}>
                <span>Quality</span>
                <select
                  aria-label="Export quality"
                  value={exportQuality}
                  onChange={(event) => onExportQualityChange(event.target.value as ExportQuality)}
                >
                  {(Object.keys(EXPORT_QUALITY_PRESETS) as ExportQuality[]).map((quality) => (
                    <option key={quality} value={quality}>{EXPORT_QUALITY_PRESETS[quality].label}</option>
                  ))}
                </select>
                <small>Higher quality uses more processing and memory.</small>
              </label>
              <p className={styles.exportDialogPreparationNote}>Animated exports load their encoder when started. The first export may take a moment to prepare.</p>
            </>
          )}
        </div>

        <footer className={styles.exportDialogActions}>
          <button type="button" className={styles.exportDialogSecondary} onClick={onCancel}>Cancel</button>
          <button type="submit" className={styles.exportDialogPrimary}>
            <Download aria-hidden="true" size={16} />
            Export {selectedFormat.label}
          </button>
        </footer>
      </form>
    </div>
  );
}
