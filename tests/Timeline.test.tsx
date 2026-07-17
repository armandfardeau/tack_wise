import { fireEvent, render, screen } from '@testing-library/react';
import Timeline from '../src/components/Timeline';
import type { Frame } from '../src/types';

const frames: Frame[] = [
  { id: 'frame-1', name: '1. Preparation', windAngle: 0, windSpeed: 12, boats: [], marks: [] },
  { id: 'frame-2', name: '2. Upwind Tack', windAngle: 0, windSpeed: 12, boats: [], marks: [] },
];

describe('Timeline', () => {
  it('renders playback controls and delegates user actions', () => {
    const onAddFrame = jest.fn();
    const onDeleteFrame = jest.fn();
    const onDuplicateFrame = jest.fn();
    const onSelectFrame = jest.fn();
    const onTogglePlaying = jest.fn();
    const onSetPlaySpeed = jest.fn();

    render(
      <Timeline
        currentFrameIndex={0}
        frames={frames}
        isPlaying={false}
        onAddFrame={onAddFrame}
        onDeleteFrame={onDeleteFrame}
        onDuplicateFrame={onDuplicateFrame}
        onSelectFrame={onSelectFrame}
        onTogglePlaying={onTogglePlaying}
        playSpeed={1000}
        onSetPlaySpeed={onSetPlaySpeed}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    fireEvent.click(screen.getByRole('button', { name: /add frame/i }));
    fireEvent.click(screen.getByRole('button', { name: /duplicate/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /2\. Upwind Tack/i }));
    fireEvent.change(screen.getByRole('combobox', { name: /playback speed/i }), { target: { value: '500' } });

    expect(onTogglePlaying).toHaveBeenCalledTimes(1);
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
        onSelectFrame={jest.fn()}
        onTogglePlaying={jest.fn()}
        playSpeed={1000}
        onSetPlaySpeed={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });
});
