import { fireEvent, render, screen } from '@testing-library/react';
import LayerList from '../src/components/LayerList';
import type { Frame } from '../src/types';

const frame: Frame = {
  id: 'frame-1',
  name: 'Preparation',
  windAngle: 0,
  windSpeed: 12,
  boats: [{
    id: 'boat-1',
    name: 'Alpha',
    color: '#38bdf8',
    x: 200,
    y: 350,
    heading: 45,
    sailAngle: 0,
  }],
  marks: [],
};

describe('LayerList', () => {
  it('opens the inspector when a layer is tapped or clicked', () => {
    const onOpenInspector = jest.fn();

    render(
      <LayerList
        activeFrame={frame}
        onOpenInspector={onOpenInspector}
        selectedId={null}
        selectedType={null}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /alpha/i }));
    fireEvent.click(screen.getByRole('button', { name: /wind/i }));

    expect(onOpenInspector).toHaveBeenNthCalledWith(1, 'boat-1', 'boat');
    expect(onOpenInspector).toHaveBeenNthCalledWith(2, 'wind', 'wind');
  });

  it('marks the selected layer and keeps the wind modifier on its icon', () => {
    render(
      <LayerList
        activeFrame={frame}
        onOpenInspector={jest.fn()}
        selectedId="boat-1"
        selectedType="boat"
      />,
    );

    expect(screen.getByRole('button', { name: /alpha/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /wind/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /wind/i }).querySelector('svg')).toBeInTheDocument();
  });
});
