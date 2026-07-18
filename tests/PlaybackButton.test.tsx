import { fireEvent, render, screen } from '@testing-library/react';
import PlaybackButton from '../src/components/PlaybackButton';

describe('PlaybackButton', () => {
  it('toggles playback and opens playback options', () => {
    const onTogglePlaying = jest.fn();
    const onOpenInspector = jest.fn();

    render(
      <PlaybackButton
        isPlaying={false}
        onTogglePlaying={onTogglePlaying}
        onOpenInspector={onOpenInspector}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    fireEvent.click(screen.getByRole('button', { name: /open playback options/i }));

    expect(onTogglePlaying).toHaveBeenCalledTimes(1);
    expect(onOpenInspector).toHaveBeenCalledTimes(1);
  });
});
