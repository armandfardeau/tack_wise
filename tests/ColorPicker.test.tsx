import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import ColorPicker from '../src/components/ColorPicker';

function ControlledColorPicker() {
  const [color, setColor] = useState('#38bdf8');

  return <ColorPicker value={color} onChange={setColor} />;
}

describe('ColorPicker', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('opens a speed dial and applies a quick color', () => {
    const onChange = jest.fn();

    render(<ColorPicker value="#38bdf8" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open color picker' }));
    expect(screen.getByRole('group', { name: 'Quick color presets' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Use color #f87171' }));
    expect(onChange).toHaveBeenCalledWith('#f87171');
  });

  it('saves a custom color and makes it available after reopening', () => {
    render(<ControlledColorPicker />);

    fireEvent.click(screen.getByRole('button', { name: 'Open color picker' }));
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save current color' }));

    expect(screen.getByText('Color saved as a preset.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use saved color #123456' })).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('tack-wise-color-presets') ?? '[]')).toEqual(['#123456']);

    fireEvent.click(screen.getByRole('button', { name: 'Open color picker' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open color picker' }));
    expect(screen.getByRole('button', { name: 'Use saved color #123456' })).toBeInTheDocument();
  });

  it('removes a saved preset', () => {
    window.localStorage.setItem('tack-wise-color-presets', JSON.stringify(['#123456']));
    render(<ColorPicker value="#123456" onChange={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open color picker' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove saved color #123456' }));

    expect(screen.queryByRole('button', { name: 'Use saved color #123456' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem('tack-wise-color-presets')).toBe('[]');
  });

  it('dismisses only the menu when Escape is pressed', () => {
    render(<ColorPicker value="#38bdf8" onChange={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open color picker' }));
    expect(screen.getByRole('dialog', { name: 'Color picker' })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Use color #38bdf8' }), { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Color picker' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open color picker' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('merges presets saved by other mounted pickers', () => {
    function MountedPickers() {
      const [firstColor, setFirstColor] = useState('#38bdf8');
      const [secondColor, setSecondColor] = useState('#38bdf8');

      return (
        <>
          <ColorPicker label="First color" value={firstColor} onChange={setFirstColor} />
          <ColorPicker label="Second color" value={secondColor} onChange={setSecondColor} />
        </>
      );
    }

    render(<MountedPickers />);

    fireEvent.click(screen.getByRole('button', { name: 'Open first color picker' }));
    fireEvent.change(screen.getByLabelText('First color'), { target: { value: '#123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save current color' }));

    fireEvent.click(screen.getByRole('button', { name: 'Open second color picker' }));
    fireEvent.change(screen.getByLabelText('Second color'), { target: { value: '#654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save current color' }));

    expect(JSON.parse(window.localStorage.getItem('tack-wise-color-presets') ?? '[]')).toEqual(['#654321', '#123456']);
  });
});
