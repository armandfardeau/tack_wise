import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import NewScenarioDialog from '../src/components/NewScenarioDialog';

function FocusHarness() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setIsOpen(true)}>Open new diagram dialog</button>
      {isOpen && <NewScenarioDialog
        returnFocusRef={triggerRef}
        onCancel={() => setIsOpen(false)}
        onExportAndContinue={() => setIsOpen(false)}
        onDiscard={() => setIsOpen(false)}
      />}
    </>
  );
}

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

  it('enters, traps, and returns focus', () => {
    render(<FocusHarness />);

    const trigger = screen.getByRole('button', { name: /open new diagram dialog/i });
    fireEvent.click(trigger);

    const closeButton = screen.getByRole('button', { name: /close new diagram dialog/i });
    const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
    const discardButton = screen.getByRole('button', { name: /discard changes/i });

    expect(cancelButton).toHaveFocus();

    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    expect(discardButton).toHaveFocus();

    fireEvent.keyDown(discardButton, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.click(cancelButton);
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: /discard changes/i }));
    expect(trigger).toHaveFocus();
  });
});
