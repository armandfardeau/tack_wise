import { fireEvent, render, screen } from '@testing-library/react';
import AppHeader from '../src/components/AppHeader';

const renderHeader = () => render(
  <AppHeader
    isExporting={false}
    onOpenAbout={jest.fn()}
    onToggleTheme={jest.fn()}
    onTogglePresenter={jest.fn()}
    theme="dark"
    sponsorship={{ stripeUrl: 'https://buy.stripe.com/test-link' }}
  />,
);

describe('AppHeader', () => {
  it('keeps view and secondary utilities in the header', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: /view options/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /support tack wise/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /file options/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy share link/i })).not.toBeInTheDocument();
  });

  it('groups theme and presenter controls under View', () => {
    const onToggleTheme = jest.fn();
    const onTogglePresenter = jest.fn();

    render(
      <AppHeader
        isExporting={false}
        onToggleTheme={onToggleTheme}
        onTogglePresenter={onTogglePresenter}
        theme="dark"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /view options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /switch to light mode/i }));
    fireEvent.click(screen.getByRole('button', { name: /view options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /presenter mode/i }));

    expect(onToggleTheme).toHaveBeenCalledTimes(1);
    expect(onTogglePresenter).toHaveBeenCalledTimes(1);
  });
});
