import { fireEvent, render, screen } from '@testing-library/react';
import CanvasHistoryControls from '../src/components/CanvasHistoryControls';

describe('CanvasHistoryControls', () => {
  it('renders history and autosave actions in the canvas control section', () => {
    const onRedo = jest.fn();
    const onRestoreAutosave = jest.fn();
    const onUndo = jest.fn();

    render(
      <CanvasHistoryControls
        canRedo
        canUndo
        hasAutosave
        onRedo={onRedo}
        onRestoreAutosave={onRestoreAutosave}
        onUndo={onUndo}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restore autosave' }));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
    expect(onRestoreAutosave).toHaveBeenCalledTimes(1);
  });

  it('disables unavailable history actions and hides restore without an autosave', () => {
    render(
      <CanvasHistoryControls
        canRedo={false}
        canUndo={false}
        hasAutosave={false}
        onRedo={jest.fn()}
        onRestoreAutosave={jest.fn()}
        onUndo={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Restore autosave' })).not.toBeInTheDocument();
  });
});
