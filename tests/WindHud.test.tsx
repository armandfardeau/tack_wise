import { fireEvent, render, screen } from '@testing-library/react';
import WindHud from '../src/components/WindHud';

describe('WindHud', () => {
  it('selects the wind indicator when clicked', () => {
    const onSelect = jest.fn();

    render(<WindHud windAngle={45} windSpeed={12} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /select wind indicator/i }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
