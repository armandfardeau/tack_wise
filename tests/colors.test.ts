import { getReadableCommentTextColor } from '../src/utils/colors';

describe('getReadableCommentTextColor', () => {
  it('keeps a color that has enough contrast with the card', () => {
    expect(getReadableCommentTextColor('#0f172a', 'light', '#ffffff')).toBe('#0f172a');
  });

  it('uses a dark fallback for pale colors on light cards', () => {
    expect(getReadableCommentTextColor('#f8fafc', 'light', '#ffffff')).toBe('#0f172a');
  });

  it('uses a light fallback for dark colors on dark cards', () => {
    expect(getReadableCommentTextColor('#0f172a', 'dark', '#172033')).toBe('#f8fafc');
  });
});
