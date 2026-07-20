import { fireEvent, render, screen } from '@testing-library/react';
import Timeline from '../src/components/Timeline';
import type { Frame } from '../src/types';

const frames: Frame[] = [
  { id: 'frame-1', name: '1. Preparation', windAngle: 0, windSpeed: 12, boats: [], marks: [] },
  { id: 'frame-2', name: '2. Upwind Tack', windAngle: 0, windSpeed: 12, boats: [], marks: [] },
  { id: 'frame-3', name: '3. Finish', windAngle: 0, windSpeed: 12, boats: [], marks: [] },
];

describe('Timeline', () => {
  it('renders playback controls and delegates user actions', () => {
    const onAddFrame = jest.fn();
    const onDeleteFrame = jest.fn();
    const onDuplicateFrame = jest.fn();
    const onSelectFrame = jest.fn();
    const onTogglePlaying = jest.fn();
    const onStepBackward = jest.fn();
    const onStepForward = jest.fn();
    const onReplayFromStart = jest.fn();
    const onSetPlaySpeed = jest.fn();

    render(
      <Timeline
        currentFrameIndex={1}
        frames={frames}
        isPlaying={false}
        onAddFrame={onAddFrame}
        onDeleteFrame={onDeleteFrame}
        onDuplicateFrame={onDuplicateFrame}
        onRenameFrame={jest.fn()}
        onSelectFrame={onSelectFrame}
        onTogglePlaying={onTogglePlaying}
        onStepBackward={onStepBackward}
        onStepForward={onStepForward}
        onReplayFromStart={onReplayFromStart}
        playSpeed={1000}
        onSetPlaySpeed={onSetPlaySpeed}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Play$/i }));
    fireEvent.click(screen.getByRole('button', { name: /step backward/i }));
    fireEvent.click(screen.getByRole('button', { name: /step forward/i }));
    fireEvent.click(screen.getByRole('button', { name: /replay from start/i }));
    fireEvent.click(screen.getByRole('button', { name: /add frame/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Duplicate frame$/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Delete frame$/ }));
    fireEvent.click(screen.getByRole('button', { name: /2\. Upwind Tack/i }));
    fireEvent.change(screen.getByRole('combobox', { name: /playback speed/i }), { target: { value: '500' } });

    expect(onTogglePlaying).toHaveBeenCalledTimes(1);
    expect(onStepBackward).toHaveBeenCalledTimes(1);
    expect(onStepForward).toHaveBeenCalledTimes(1);
    expect(onReplayFromStart).toHaveBeenCalledTimes(1);
    expect(onAddFrame).toHaveBeenCalledTimes(1);
    expect(onDuplicateFrame).toHaveBeenCalledTimes(1);
    expect(onDeleteFrame).toHaveBeenCalledTimes(1);
    expect(onSelectFrame).toHaveBeenCalledWith(1);
    expect(onSetPlaySpeed).toHaveBeenCalledWith(500);
  });

  it('disables deleting the last remaining frame', () => {
    render(
      <Timeline
        currentFrameIndex={0}
        frames={[frames[0]]}
        isPlaying={false}
        onAddFrame={jest.fn()}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={jest.fn()}
        onRenameFrame={jest.fn()}
        onSelectFrame={jest.fn()}
        onTogglePlaying={jest.fn()}
        playSpeed={1000}
        onSetPlaySpeed={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /^Delete frame$/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Delete frame 1$/ })).toBeDisabled();
  });

  it('places Add Frame at the bottom of the frame list in the sidebar', () => {
    const onAddFrame = jest.fn();

    render(
      <Timeline
        variant="sidebar"
        currentFrameIndex={0}
        frames={frames}
        isPlaying={false}
        onAddFrame={onAddFrame}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={jest.fn()}
        onRenameFrame={jest.fn()}
        onSelectFrame={jest.fn()}
        onTogglePlaying={jest.fn()}
        playSpeed={1000}
        onSetPlaySpeed={jest.fn()}
      />,
    );

    const addFrameButton = screen.getByRole('button', { name: /^Add frame$/ });
    const frameList = screen.getByLabelText('Scenario frames');

    fireEvent.click(addFrameButton);

    expect(addFrameButton).toHaveClass('sidebar-add-frame-btn');
    expect(frameList.compareDocumentPosition(addFrameButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Play$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /playback speed/i })).not.toBeInTheDocument();
    expect(onAddFrame).toHaveBeenCalledTimes(1);
  });

  it('deletes the frame from its inline delete button', () => {
    const onDeleteFrame = jest.fn();

    render(
      <Timeline
        currentFrameIndex={0}
        frames={frames}
        isPlaying={false}
        onAddFrame={jest.fn()}
        onDeleteFrame={onDeleteFrame}
        onDuplicateFrame={jest.fn()}
        onRenameFrame={jest.fn()}
        onSelectFrame={jest.fn()}
        onTogglePlaying={jest.fn()}
        playSpeed={1000}
        onSetPlaySpeed={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Delete frame 2$/ }));

    expect(onDeleteFrame).toHaveBeenCalledWith(1);
  });

  it('shows an Edit button for the selected frame and starts title editing', () => {
    render(
      <Timeline
        currentFrameIndex={1}
        frames={frames}
        onAddFrame={jest.fn()}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={jest.fn()}
        onRenameFrame={jest.fn()}
        onSelectFrame={jest.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Edit frame 1' })).not.toBeInTheDocument();
    const editButton = screen.getByRole('button', { name: 'Edit frame 2' });
    fireEvent.click(editButton);

    expect(screen.getByRole('textbox', { name: 'Frame 2 title' })).toHaveFocus();
  });

  it('shows a contextual edit hint for a new empty scenario', () => {
    render(
      <Timeline
        currentFrameIndex={0}
        frames={[{ id: 'new-frame', name: 'Frame 1', windAngle: 0, windSpeed: 12, boats: [], marks: [] }]}
        onAddFrame={jest.fn()}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={jest.fn()}
        onRenameFrame={jest.fn()}
        onSelectFrame={jest.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Select a frame, then choose Edit to rename it.');
  });

  it('duplicates the frame from its inline duplicate button', () => {
    const onDuplicateFrame = jest.fn();

    render(
      <Timeline
        currentFrameIndex={0}
        frames={frames}
        isPlaying={false}
        onAddFrame={jest.fn()}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={onDuplicateFrame}
        onRenameFrame={jest.fn()}
        onSelectFrame={jest.fn()}
        onTogglePlaying={jest.fn()}
        playSpeed={1000}
        onSetPlaySpeed={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Duplicate frame 2$/ }));

    expect(onDuplicateFrame).toHaveBeenCalledWith(1);
  });

  it('renames a frame on Enter after double-clicking its title', () => {
    const onRenameFrame = jest.fn();

    render(
      <Timeline
        currentFrameIndex={0}
        frames={frames}
        isPlaying={false}
        onAddFrame={jest.fn()}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={jest.fn()}
        onRenameFrame={onRenameFrame}
        onSelectFrame={jest.fn()}
        onTogglePlaying={jest.fn()}
        playSpeed={1000}
        onSetPlaySpeed={jest.fn()}
      />,
    );

    fireEvent.doubleClick(screen.getByText('2. Upwind Tack'));
    const titleInput = screen.getByRole('textbox', { name: 'Frame 2 title' });
    fireEvent.change(titleInput, { target: { value: 'Mark approach' } });
    fireEvent.keyDown(titleInput, { key: 'Enter' });

    expect(onRenameFrame).toHaveBeenCalledWith(1, 'Mark approach');
    expect(screen.getByText('2. Upwind Tack')).toBeInTheDocument();
  });

  it('starts editing when a frame title is tapped on a touch device', () => {
    render(
      <Timeline
        currentFrameIndex={0}
        frames={frames}
        isPlaying={false}
        onAddFrame={jest.fn()}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={jest.fn()}
        onRenameFrame={jest.fn()}
        onSelectFrame={jest.fn()}
        onTogglePlaying={jest.fn()}
        playSpeed={1000}
        onSetPlaySpeed={jest.fn()}
      />,
    );

    const title = screen.getByText('2. Upwind Tack');
    fireEvent.touchStart(title);
    fireEvent.click(title);

    expect(screen.getByRole('textbox', { name: 'Frame 2 title' })).toHaveFocus();
  });

  it('renames a frame on blur and cancels on Escape', () => {
    const onRenameFrame = jest.fn();

    const { rerender } = render(
      <Timeline
        currentFrameIndex={0}
        frames={frames}
        isPlaying={false}
        onAddFrame={jest.fn()}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={jest.fn()}
        onRenameFrame={onRenameFrame}
        onSelectFrame={jest.fn()}
        onTogglePlaying={jest.fn()}
        playSpeed={1000}
        onSetPlaySpeed={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByText('1. Preparation'));
    fireEvent.doubleClick(screen.getByText('1. Preparation'));
    const firstTitleInput = screen.getByRole('textbox', { name: 'Frame 1 title' });
    fireEvent.change(firstTitleInput, { target: { value: 'Start line' } });
    fireEvent.blur(firstTitleInput);

    expect(onRenameFrame).toHaveBeenCalledWith(0, 'Start line');

    fireEvent.doubleClick(screen.getByText('2. Upwind Tack'));
    const secondTitleInput = screen.getByRole('textbox', { name: 'Frame 2 title' });
    fireEvent.change(secondTitleInput, { target: { value: 'Should not save' } });
    fireEvent.keyDown(secondTitleInput, { key: 'Escape' });

    expect(onRenameFrame).toHaveBeenCalledTimes(1);
    expect(screen.getByText('2. Upwind Tack')).toBeInTheDocument();

    rerender(
      <Timeline
        currentFrameIndex={0}
        frames={frames}
        isPlaying={false}
        onAddFrame={jest.fn()}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={jest.fn()}
        onRenameFrame={onRenameFrame}
        onSelectFrame={jest.fn()}
        onTogglePlaying={jest.fn()}
        playSpeed={1000}
        onSetPlaySpeed={jest.fn()}
      />,
    );

    expect(screen.getByText('1. Preparation')).toBeInTheDocument();
  });

  it('supports inline duplicate, delete, and layer actions while editing', () => {
    const onDeleteFrame = jest.fn();
    const onDuplicateFrame = jest.fn();
    const onOpenLayers = jest.fn();

    render(
      <Timeline
        variant="sidebar"
        currentFrameIndex={0}
        frames={frames}
        onAddFrame={jest.fn()}
        onDeleteFrame={onDeleteFrame}
        onDuplicateFrame={onDuplicateFrame}
        onOpenLayers={onOpenLayers}
        onRenameFrame={jest.fn()}
        onSelectFrame={jest.fn()}
      />,
    );

    fireEvent.doubleClick(screen.getByText('2. Upwind Tack'));
    fireEvent.click(screen.getByRole('button', { name: /duplicate frame 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /show layers for frame 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete frame 2/i }));

    expect(onDuplicateFrame).toHaveBeenCalledWith(1);
    expect(onOpenLayers).toHaveBeenCalledWith(1);
    expect(onDeleteFrame).toHaveBeenCalledWith(1);
  });

  it('does not rename a frame to a blank title and exits editing on frame removal', () => {
    const onRenameFrame = jest.fn();
    const { rerender } = render(
      <Timeline
        currentFrameIndex={0}
        frames={frames}
        onAddFrame={jest.fn()}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={jest.fn()}
        onRenameFrame={onRenameFrame}
        onSelectFrame={jest.fn()}
      />,
    );

    fireEvent.doubleClick(screen.getByText('1. Preparation'));
    const titleInput = screen.getByRole('textbox', { name: 'Frame 1 title' });
    fireEvent.change(titleInput, { target: { value: '   ' } });
    fireEvent.keyDown(titleInput, { key: 'Tab' });
    fireEvent.blur(titleInput);
    expect(onRenameFrame).not.toHaveBeenCalled();

    fireEvent.doubleClick(screen.getByText('2. Upwind Tack'));
    rerender(
      <Timeline
        currentFrameIndex={0}
        frames={[frames[0]]}
        onAddFrame={jest.fn()}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={jest.fn()}
        onRenameFrame={onRenameFrame}
        onSelectFrame={jest.fn()}
      />,
    );

    expect(screen.queryByRole('textbox', { name: 'Frame 2 title' })).not.toBeInTheDocument();
  });

  it('keeps the optional playback callbacks safe when the bottom controls omit handlers', () => {
    render(
      <Timeline
        currentFrameIndex={1}
        frames={frames}
        isPlaying
        onAddFrame={jest.fn()}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={jest.fn()}
        onRenameFrame={jest.fn()}
        onSelectFrame={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    fireEvent.click(screen.getByRole('button', { name: /step backward/i }));
    fireEvent.click(screen.getByRole('button', { name: /step forward/i }));
    fireEvent.click(screen.getByRole('button', { name: /replay from start/i }));
    fireEvent.change(screen.getByRole('combobox', { name: /playback speed/i }), { target: { value: '500' } });
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('opens layers from a normal sidebar frame row', () => {
    const onOpenLayers = jest.fn();
    render(
      <Timeline
        variant="sidebar"
        currentFrameIndex={0}
        frames={frames}
        onAddFrame={jest.fn()}
        onDeleteFrame={jest.fn()}
        onDuplicateFrame={jest.fn()}
        onOpenLayers={onOpenLayers}
        onRenameFrame={jest.fn()}
        onSelectFrame={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /show layers for frame 2/i }));

    expect(onOpenLayers).toHaveBeenCalledWith(1);
  });
});
