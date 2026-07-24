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

  it('displays both the stored from bearing and visible toward bearing', () => {
    render(<WindHud windAngle={240} windSpeed={12} onSelect={jest.fn()} />);

    expect(screen.getByText('TOWARD 060°')).toBeInTheDocument();
    expect(screen.getByText('FROM 240° · 12 KTS')).toBeInTheDocument();
    expect(screen.getByLabelText('Wind blowing toward 60 degrees')).toBeInTheDocument();
  });

  it('rotates the vane to match the blowing direction', () => {
    render(<WindHud windAngle={0} windSpeed={12} onSelect={jest.fn()} />);

    expect(screen.getByLabelText('Wind blowing toward 180 degrees')).toHaveStyle({ transform: 'rotate(180deg)' });
    expect(screen.getByText('TOWARD 180°')).toBeInTheDocument();
    expect(screen.getByText('FROM 000° · 12 KTS')).toBeInTheDocument();
  });

  it('normalizes negative and wrapped bearings into the compass range', () => {
    render(<WindHud windAngle={-200} windSpeed={12} onSelect={jest.fn()} />);

    expect(screen.getByLabelText('Wind blowing toward 340 degrees')).toBeInTheDocument();
    expect(screen.getByText('TOWARD 340°')).toBeInTheDocument();
    expect(screen.getByText('FROM 160° · 12 KTS')).toBeInTheDocument();
  });
});
