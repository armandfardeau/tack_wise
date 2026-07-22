import { fireEvent, render, screen } from '@testing-library/react';
import SponsorshipActions from '../src/components/SponsorshipActions';

const rect = (top: number, right: number, bottom: number, left = 0, width = right - left, height = bottom - top) => ({
  bottom,
  height,
  left,
  right,
  top,
  width,
  x: left,
  y: top,
  toJSON: () => ({}),
}) as DOMRect;

describe('SponsorshipActions', () => {
  it('keeps the menu inside a short viewport by opening it above the trigger', () => {
    const getBoundingClientRect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getRect(this: HTMLElement) {
      if (this.getAttribute('aria-label') === 'Support Tack Wise' && this.tagName === 'BUTTON') return rect(700, 934, 734, 900, 34, 34);
      if (this.getAttribute('role') === 'menu' && this.getAttribute('aria-label') === 'Support Tack Wise') return rect(0, 250, 250, 0, 250, 250);
      return rect(0, 0, 0);
    });
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });

    render(<SponsorshipActions githubUrl="https://github.com/sponsors/armandfardeau" />);
    fireEvent.click(screen.getByRole('button', { name: /support tack wise/i }));

    const menu = screen.getByRole('menu', { name: /support tack wise/i });
    expect(menu).toHaveStyle({ top: '442px', left: '684px', maxHeight: '680px', visibility: 'visible' });

    getBoundingClientRect.mockRestore();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
  });
});
