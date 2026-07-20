import type { Theme } from '../types';

const LIGHT_THEME_COMMENT_TEXT = '#0f172a';
const DARK_THEME_COMMENT_TEXT = '#f8fafc';
const MINIMUM_TEXT_CONTRAST = 4.5;

function parseHexColor(color: string): [number, number, number] | null {
  const value = color.trim().replace(/^#/, '');
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(value)) return null;

  const hex = value.length === 3 ? value.split('').map((digit) => `${digit}${digit}`).join('') : value;
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function relativeLuminance([red, green, blue]: [number, number, number]): number {
  const transform = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * transform(red) + 0.7152 * transform(green) + 0.0722 * transform(blue);
}

function contrastRatio(foreground: string, background: string): number | null {
  const foregroundRgb = parseHexColor(foreground);
  const backgroundRgb = parseHexColor(background);
  if (!foregroundRgb || !backgroundRgb) return null;

  const foregroundLuminance = relativeLuminance(foregroundRgb);
  const backgroundLuminance = relativeLuminance(backgroundRgb);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getReadableCommentTextColor(color: string, theme: Theme, background: string): string {
  const ratio = contrastRatio(color, background);
  if (ratio !== null && ratio >= MINIMUM_TEXT_CONTRAST) return color;

  return theme === 'light' ? LIGHT_THEME_COMMENT_TEXT : DARK_THEME_COMMENT_TEXT;
}
