import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import TemplateContributionDialog from '../src/components/TemplateContributionDialog';
import type { Frame } from '../src/types';

const frames: Frame[] = [{
  id: 'frame-1',
  name: 'Frame 1',
  windAngle: 0,
  windSpeed: 12,
  boats: [],
  marks: [],
}];

const baseProps = {
  frames,
  initialTitle: 'Mark Room',
  existingTemplateIds: ['r18'],
  onClose: jest.fn(),
};

function FocusHarness() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setIsOpen(true)}>Open template dialog</button>
      {isOpen && <TemplateContributionDialog
        {...baseProps}
        mode="create"
        returnFocusRef={triggerRef}
        onClose={() => setIsOpen(false)}
      />}
    </>
  );
}

describe('TemplateContributionDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn(() => Promise.resolve()) },
    });
  });

  it('prepares a new template, copies JSON, and opens GitHub', async () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);

    render(<TemplateContributionDialog {...baseProps} mode="create" />);

    expect(screen.getByRole('dialog', { name: /submit a template pull request/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/template filename/i)).toHaveValue('mark-room.json');
    expect((screen.getByLabelText(/template json preview/i) as HTMLTextAreaElement).value).toContain('"title": "Mark Room"');

    fireEvent.click(screen.getByRole('button', { name: /copy json/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('template JSON copied'));

    fireEvent.click(screen.getByRole('button', { name: /open github editor/i }));
    await waitFor(() => expect(open).toHaveBeenCalledWith(
      'https://github.com/armandfardeau/tack_wise/new/main?filename=src%2Fdata%2Fsituations%2Fmark-room.json',
      '_blank',
      'noopener,noreferrer',
    ));

    open.mockRestore();
  });

  it('shows validation errors and disables contribution until the filename is safe', () => {
    render(<TemplateContributionDialog {...baseProps} mode="create" />);

    fireEvent.change(screen.getByLabelText(/template title/i), { target: { value: 'Updated Title' } });
    fireEvent.change(screen.getByLabelText(/template filename/i), { target: { value: '../unsafe.json' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Use a lowercase kebab-case filename');
    expect(screen.getByRole('button', { name: /open github editor/i })).toBeDisabled();
  });

  it('closes from the cancel button and backdrop', () => {
    const onClose = jest.fn();
    const { rerender } = render(<TemplateContributionDialog {...baseProps} mode="create" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<TemplateContributionDialog {...baseProps} mode="create" onClose={onClose} />);
    const backdrop = screen.getByRole('dialog').parentElement;
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('locks the filename for an update and exposes pull request metadata', async () => {
    render(<TemplateContributionDialog {...baseProps} mode="update" templateId="r18" />);

    expect(screen.getByRole('dialog', { name: /update template pull request/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/template filename/i)).toHaveValue('r18.json');
    expect(screen.getByLabelText(/template filename/i)).toBeDisabled();
    expect(screen.getByLabelText(/suggested commit message/i)).toHaveValue('Update template: Mark Room');
    expect(screen.getByLabelText(/suggested pull request title/i)).toHaveValue('Update template: Mark Room');

    fireEvent.click(screen.getByRole('button', { name: /copy pr details/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('pull request details copied'));
  });

  it('provides a manual copy fallback and closes on Escape', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    const onClose = jest.fn();

    render(<TemplateContributionDialog {...baseProps} mode="create" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /copy json/i }));
    await waitFor(() => expect(screen.getByLabelText(/template json fallback/i)).toBeInTheDocument());
    fireEvent.focus(screen.getByLabelText(/template json fallback/i));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('enters, traps, and returns focus', () => {
    render(<FocusHarness />);

    const trigger = screen.getByRole('button', { name: /open template dialog/i });
    fireEvent.click(trigger);

    const closeButton = screen.getByRole('button', { name: /close template contribution dialog/i });
    const titleInput = screen.getByLabelText(/template title/i);
    const githubButton = screen.getByRole('button', { name: /open github editor/i });

    expect(titleInput).toHaveFocus();

    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    expect(githubButton).toHaveFocus();

    fireEvent.keyDown(githubButton, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(trigger).toHaveFocus();
  });
});
