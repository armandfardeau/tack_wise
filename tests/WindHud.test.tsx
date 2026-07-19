import { fireEvent, render, screen } from '@testing-library/react';
import WindHud from '../src/components/WindHud';

describe('WindHud', () => {
  it('selects the wind indicator when clicked', () => {
    const onSelect = jest.fn();

    render(<WindHud windAngle={45} windSpeed={12} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /edit wind direction and velocity/i }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByTitle(/click to edit wind direction and velocity/i)).toBeInTheDocument();
  });

  it('displays the direction the wind is blowing toward', () => {
    render(<WindHud windAngle={240} windSpeed={12} onSelect={jest.fn()} />);

    expect(screen.getByText('60°')).toBeInTheDocument();
  });

  it('rotates the vane to match the blowing direction', () => {
    render(<WindHud windAngle={0} windSpeed={12} onSelect={jest.fn()} />);

    expect(screen.getByLabelText('Wind direction 180 degrees')).toHaveStyle({ transform: 'rotate(180deg)' });
  });
});
