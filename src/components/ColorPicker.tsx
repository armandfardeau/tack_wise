import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Check, Palette, Plus, Trash2 } from 'lucide-react';

const COLOR_PRESETS_STORAGE_KEY = 'tack-wise-color-presets';
const COLOR_PRESETS_UPDATED_EVENT = 'tack-wise-color-presets-updated';
const MAX_SAVED_PRESETS = 12;

const QUICK_COLOR_PRESETS = [
  '#38bdf8',
  '#f87171',
  '#4ade80',
  '#fbbf24',
  '#c084fc',
  '#fb7185',
  '#2dd4bf',
  '#ef4444',
  '#f97316',
  '#f8fafc',
] as const;

function normalizeHexColor(value: string) {
  const normalized = value.trim().replace(/^#/, '');
  if (/^[\da-f]{3}$/i.test(normalized)) {
    return `#${normalized.split('').map((character) => `${character}${character}`).join('')}`.toLowerCase();
  }
  if (/^[\da-f]{6}$/i.test(normalized)) return `#${normalized}`.toLowerCase();
  return '#38bdf8';
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#?(?:[\da-f]{3}|[\da-f]{6})$/i.test(value.trim());
}

function uniqueColors(colors: string[]) {
  return colors.filter((color, index) => colors.indexOf(color) === index);
}

function readSavedPresets() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(COLOR_PRESETS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return uniqueColors(
      parsed.filter(isHexColor).map(normalizeHexColor),
    ).slice(0, MAX_SAVED_PRESETS);
  } catch {
    return [];
  }
}

function persistSavedPresets(presets: string[]) {
  try {
    window.localStorage.setItem(COLOR_PRESETS_STORAGE_KEY, JSON.stringify(presets));
    window.dispatchEvent(new Event(COLOR_PRESETS_UPDATED_EVENT));
  } catch {
    // Storage may be unavailable in private browsing or restricted embeds.
  }
}

interface ColorPickerProps {
  'aria-label'?: string;
  compact?: boolean;
  id?: string;
  label?: string;
  onChange: (color: string) => void;
  value: string;
}

export default function ColorPicker({
  'aria-label': ariaLabel,
  compact = false,
  id,
  label = 'Color',
  onChange,
  value,
}: ColorPickerProps) {
  const generatedId = useId();
  const inputId = id ?? `color-picker-${generatedId.replace(/:/g, '')}`;
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const currentColor = normalizeHexColor(value);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const [savedPresets, setSavedPresets] = useState<string[]>(readSavedPresets);
  const [saveFeedback, setSaveFeedback] = useState('');
  const accessibleLabel = ariaLabel ?? label;
  const isSaved = savedPresets.includes(currentColor);
  const isQuickPreset = QUICK_COLOR_PRESETS.includes(currentColor as typeof QUICK_COLOR_PRESETS[number]);

  const dismissColorMenu = useCallback(() => {
    setIsOpen(false);
    setMenuPosition(null);
    triggerRef.current?.focus();
  }, []);

  const handleColorMenuKeyDown = useCallback((event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    dismissColorMenu();
  }, [dismissColorMenu]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (pickerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      dismissColorMenu();
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [dismissColorMenu, isOpen]);

  useEffect(() => {
    const syncSavedPresets = () => setSavedPresets(readSavedPresets());

    window.addEventListener(COLOR_PRESETS_UPDATED_EVENT, syncSavedPresets);
    window.addEventListener('storage', syncSavedPresets);
    return () => {
      window.removeEventListener(COLOR_PRESETS_UPDATED_EVENT, syncSavedPresets);
      window.removeEventListener('storage', syncSavedPresets);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return undefined;
    }

    const updateMenuPosition = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const viewportMargin = 12;
      const maxLeft = Math.max(viewportMargin, window.innerWidth - menuRect.width - viewportMargin);
      const maxTop = Math.max(viewportMargin, window.innerHeight - menuRect.height - viewportMargin);
      const belowTop = triggerRect.bottom + 8;
      const aboveTop = triggerRect.top - menuRect.height - 8;
      const top = belowTop + menuRect.height <= window.innerHeight - viewportMargin
        ? Math.min(Math.max(viewportMargin, belowTop), maxTop)
        : aboveTop >= viewportMargin
          ? aboveTop
          : maxTop;

      setMenuPosition({
        left: Math.min(Math.max(viewportMargin, triggerRect.right - menuRect.width), maxLeft),
        top,
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen]);

  const selectColor = (color: string) => {
    onChange(normalizeHexColor(color));
    setSaveFeedback('');
  };

  const saveCurrentColor = () => {
    const latestSavedPresets = readSavedPresets();
    setSavedPresets(latestSavedPresets);

    if (latestSavedPresets.includes(currentColor) || isQuickPreset) {
      setSaveFeedback('This color is already a preset.');
      return;
    }

    if (latestSavedPresets.length >= MAX_SAVED_PRESETS) {
      setSaveFeedback('Preset limit reached.');
      return;
    }

    const nextPresets = [currentColor, ...latestSavedPresets];
    setSavedPresets(nextPresets);
    persistSavedPresets(nextPresets);
    setSaveFeedback('Color saved as a preset.');
  };

  const removeSavedColor = (color: string) => {
    const nextPresets = readSavedPresets().filter((preset) => preset !== color);
    setSavedPresets(nextPresets);
    persistSavedPresets(nextPresets);
    setSaveFeedback('');
  };

  return (
    <div ref={pickerRef} className={`color-picker${compact ? ' color-picker-compact' : ''}`} data-open={isOpen}>
      <button
        ref={triggerRef}
        type="button"
        className="color-picker-trigger"
        aria-label={`Open ${accessibleLabel.toLowerCase()} picker`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onKeyDown={handleColorMenuKeyDown}
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          if (nextOpen) setMenuPosition(null);
          setSaveFeedback('');
        }}
      >
        <span className="color-picker-trigger-swatch" style={{ backgroundColor: currentColor }} aria-hidden="true" />
        <span className="color-picker-trigger-value">{currentColor}</span>
        <Palette aria-hidden="true" size={16} />
      </button>

      <input
        ref={nativeInputRef}
        id={inputId}
        className="color-picker-native-input"
        type="color"
        value={currentColor}
        aria-label={accessibleLabel}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => selectColor(event.target.value)}
      />

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="color-picker-menu"
          role="dialog"
          aria-label={`${accessibleLabel} picker`}
          onKeyDown={handleColorMenuKeyDown}
          style={{
            left: menuPosition?.left ?? 0,
            top: menuPosition?.top ?? 0,
            visibility: menuPosition ? 'visible' : 'hidden',
          }}
        >
          <div className="color-picker-menu-heading">
            <span>Quick colors</span>
            <span className="color-picker-menu-value">{currentColor}</span>
          </div>

          <div className="color-picker-speed-dial" role="group" aria-label="Quick color presets">
            <span className="color-picker-speed-dial-ring" aria-hidden="true" />
            <span className="color-picker-speed-dial-center" style={{ backgroundColor: currentColor }} aria-hidden="true" />
            {QUICK_COLOR_PRESETS.map((color, index) => {
              const angle = (index * 360) / QUICK_COLOR_PRESETS.length;

              return (
                <button
                  key={color}
                  type="button"
                  className="color-picker-dial-button"
                  aria-label={`Use color ${color}`}
                  aria-pressed={currentColor === color}
                  title={color}
                  style={{
                    left: `${50 + Math.sin((angle * Math.PI) / 180) * 37}%`,
                    top: `${50 - Math.cos((angle * Math.PI) / 180) * 37}%`,
                  }}
                  onClick={() => selectColor(color)}
                >
                  <span className="color-picker-swatch" style={{ backgroundColor: color }} aria-hidden="true" />
                  {currentColor === color && <Check aria-hidden="true" size={12} />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="color-picker-custom-row"
            aria-label="Choose custom color"
            onClick={() => {
              setIsOpen(true);
              nativeInputRef.current?.click();
            }}
          >
            <span className="color-picker-custom-label"><Palette aria-hidden="true" size={15} /> Custom color</span>
            <span className="color-picker-custom-value">{currentColor}</span>
            <span className="color-picker-swatch" style={{ backgroundColor: currentColor }} aria-hidden="true" />
          </button>

          <div className="color-picker-saved-heading">
            <span>Saved presets</span>
            <span>{savedPresets.length}/{MAX_SAVED_PRESETS}</span>
          </div>
          {savedPresets.length > 0 ? (
            <div className="color-picker-saved-list" role="group" aria-label="Saved color presets">
              {savedPresets.map((color) => (
                <div className="color-picker-saved-item" key={color}>
                  <button
                    type="button"
                    className="color-picker-saved-button"
                    aria-label={`Use saved color ${color}`}
                    aria-pressed={currentColor === color}
                    title={`Use ${color}`}
                    onClick={() => selectColor(color)}
                  >
                    <span className="color-picker-swatch" style={{ backgroundColor: color }} aria-hidden="true" />
                    {currentColor === color && <Check aria-hidden="true" size={12} />}
                  </button>
                  <button
                    type="button"
                    className="color-picker-remove-button"
                    aria-label={`Remove saved color ${color}`}
                    title={`Remove ${color}`}
                    onClick={() => removeSavedColor(color)}
                  >
                    <Trash2 aria-hidden="true" size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="color-picker-empty">Choose a custom color, then save it here for reuse.</p>
          )}

          <button
            type="button"
            className="color-picker-save-button"
            disabled={isSaved || isQuickPreset || savedPresets.length >= MAX_SAVED_PRESETS}
            onClick={saveCurrentColor}
          >
            <Plus aria-hidden="true" size={15} />
            {isSaved || isQuickPreset ? 'Already a preset' : savedPresets.length >= MAX_SAVED_PRESETS ? 'Preset limit reached' : 'Save current color'}
          </button>
          {saveFeedback && <p className="color-picker-feedback" aria-live="polite">{saveFeedback}</p>}

          <p className="color-picker-hint">Pick a quick color or open Custom color for any hex value.</p>
        </div>,
        pickerRef.current?.closest('.app-shell') ?? document.body,
      )}
    </div>
  );
}
