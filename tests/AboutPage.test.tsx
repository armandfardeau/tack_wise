import { fireEvent, render, screen } from '@testing-library/react';
import AboutPage from '../src/components/AboutPage';

describe('AboutPage', () => {
  it('renders the about content and tactical board', () => {
    render(<AboutPage theme="dark" onBackToEditor={jest.fn()} onToggleTheme={jest.fn()} />);

    expect(screen.getByRole('main')).toHaveClass('app-shell', 'dark-theme');
    expect(screen.getByRole('heading', { name: /make the situation the lesson/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/tactical sailing situation diagram/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /clearer debriefs/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /from first mark to final replay/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /built by armand fardeau/i })).toBeInTheDocument();
    expect(screen.getByText('Draw the moment. Understand the move.')).toBeInTheDocument();
  });

  it('keeps the theme and simulator actions wired', () => {
    const onBackToEditor = jest.fn();
    const onToggleTheme = jest.fn();

    render(<AboutPage theme="light" onBackToEditor={onBackToEditor} onToggleTheme={onToggleTheme} />);

    expect(screen.getByRole('main')).toHaveClass('light-theme');
    fireEvent.click(screen.getByRole('button', { name: /dark mode/i }));
    fireEvent.click(screen.getByRole('button', { name: /open the simulator/i }));
    fireEvent.click(screen.getByRole('button', { name: /back to simulator/i }));
    fireEvent.click(screen.getByRole('button', { name: /start drawing/i }));

    expect(onToggleTheme).toHaveBeenCalledTimes(1);
    expect(onBackToEditor).toHaveBeenCalledTimes(3);
  });

  it('keeps the repository links external', () => {
    render(<AboutPage theme="dark" onBackToEditor={jest.fn()} onToggleTheme={jest.fn()} />);

    expect(screen.getByRole('link', { name: /explore the source/i })).toHaveAttribute(
      'href',
      'https://github.com/armandfardeau/tack_wise',
    );
    expect(screen.getByRole('link', { name: /visit armand on github/i })).toHaveAttribute(
      'href',
      'https://github.com/armandfardeau',
    );
    expect(screen.getByRole('link', { name: /^github$/i })).toHaveAttribute('target', '_blank');
  });
});
