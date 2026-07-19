import { fireEvent, render, screen } from '@testing-library/react';
import ViewActions from '../src/components/ViewActions';

describe('ViewActions', () => {
  it('labels the presenter action as exit when presenter mode is active', () => {
    const onTogglePresenter = jest.fn();
    const onToggleTheme = jest.fn();

    render(<ViewActions presenterMode theme="light" onTogglePresenter={onTogglePresenter} onToggleTheme={onToggleTheme} />);

    fireEvent.click(screen.getByRole('button', { name: /view options/i }));
    expect(screen.getByRole('menuitem', { name: /switch to dark mode/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /exit presenter/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /exit presenter/i }));
    expect(onTogglePresenter).toHaveBeenCalledTimes(1);
  });

  it('closes the view menu from outside pointer events and Escape', () => {
    render(<ViewActions presenterMode={false} theme="dark" />);

    fireEvent.click(screen.getByRole('button', { name: /view options/i }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu', { name: /view options/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /view options/i }));
    fireEvent.pointerDown(screen.getByRole('button', { name: /view options/i }));
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: /view options/i })).not.toBeInTheDocument();
  });
});
