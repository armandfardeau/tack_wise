import { fireEvent, render, screen } from '@testing-library/react';
import PlaybackButton from '../src/components/PlaybackButton';

describe('PlaybackButton', () => {
  it('toggles playback and opens playback options', () => {
    const onTogglePlaying = jest.fn();
    const onStepBackward = jest.fn();
    const onStepForward = jest.fn();
    const onReplayFromStart = jest.fn();
    const onOpenInspector = jest.fn();

    render(
      <PlaybackButton
        isPlaying={false}
        currentFrameIndex={1}
        frameCount={3}
        onTogglePlaying={onTogglePlaying}
        onStepBackward={onStepBackward}
        onStepForward={onStepForward}
        onReplayFromStart={onReplayFromStart}
        onOpenInspector={onOpenInspector}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    fireEvent.click(screen.getByRole('button', { name: /step backward/i }));
    fireEvent.click(screen.getByRole('button', { name: /step forward/i }));
    fireEvent.click(screen.getByRole('button', { name: /replay from start/i }));
    fireEvent.click(screen.getByRole('button', { name: /open playback options/i }));

    expect(onTogglePlaying).toHaveBeenCalledTimes(1);
    expect(onStepBackward).toHaveBeenCalledTimes(1);
    expect(onStepForward).toHaveBeenCalledTimes(1);
    expect(onReplayFromStart).toHaveBeenCalledTimes(1);
    expect(onOpenInspector).toHaveBeenCalledTimes(1);
  });

  it('disables stepping beyond the first and last frames', () => {
    const { rerender } = render(
      <PlaybackButton
        isPlaying={false}
        currentFrameIndex={0}
        frameCount={3}
        onTogglePlaying={jest.fn()}
        onOpenInspector={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /step backward/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /step forward/i })).not.toBeDisabled();

    rerender(
      <PlaybackButton
        isPlaying={false}
        currentFrameIndex={2}
        frameCount={3}
        onTogglePlaying={jest.fn()}
        onOpenInspector={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /step backward/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /step forward/i })).toBeDisabled();
  });

  it('uses safe no-op callbacks when optional controls are omitted', () => {
    render(
      <PlaybackButton
        isPlaying
        currentFrameIndex={1}
        frameCount={3}
        onTogglePlaying={jest.fn()}
        onOpenInspector={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: /step backward/i }));
      fireEvent.click(screen.getByRole('button', { name: /step forward/i }));
      fireEvent.click(screen.getByRole('button', { name: /replay from start/i }));
    }).not.toThrow();
  });

  it('uses a one-frame default when frame bounds are omitted', () => {
    render(
      <PlaybackButton
        isPlaying={false}
        onTogglePlaying={jest.fn()}
        onOpenInspector={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /step backward/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /step forward/i })).toBeDisabled();
  });
});
