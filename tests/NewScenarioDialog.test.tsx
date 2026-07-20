import { fireEvent, render, screen } from '@testing-library/react';
import NewScenarioDialog from '../src/components/NewScenarioDialog';

describe('NewScenarioDialog', () => {
  it('offers cancel, export, and discard actions', () => {
    const onCancel = jest.fn();
    const onExportAndContinue = jest.fn();
    const onDiscard = jest.fn();

    render(
      <NewScenarioDialog
        onCancel={onCancel}
        onExportAndContinue={onExportAndContinue}
        onDiscard={onDiscard}
      />,
    );

    expect(screen.getByRole('dialog', { name: /start a new diagram/i })).toHaveTextContent('Your current changes will be replaced');

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /export json & continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /discard changes/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onExportAndContinue).toHaveBeenCalledTimes(1);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('cancels when the close button or backdrop is clicked', () => {
    const onCancel = jest.fn();

    render(
      <NewScenarioDialog
        onCancel={onCancel}
        onExportAndContinue={jest.fn()}
        onDiscard={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /close new diagram dialog/i }));
    fireEvent.mouseDown(screen.getByRole('presentation'));

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('cancels when Escape is pressed', () => {
    const onCancel = jest.fn();

    render(
      <NewScenarioDialog
        onCancel={onCancel}
        onExportAndContinue={jest.fn()}
        onDiscard={jest.fn()}
      />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
