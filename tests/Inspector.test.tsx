import { fireEvent, render, screen } from '@testing-library/react';
import Inspector from '../src/components/Inspector';
import type { Frame, Mark } from '../src/types';

const mark: Mark = {
  id: 'mark-1',
  name: 'Windward Mark',
  color: '#ef4444',
  x: 300,
  y: 120,
  shape: 'triangle',
};

const frame: Frame = {
  id: 'frame-1',
  name: 'Preparation',
  windAngle: 0,
  windSpeed: 12,
  boats: [],
  marks: [mark],
};

function renderMarkInspector(updateMark = jest.fn(), selectedMark = mark) {
  const selectedFrame = { ...frame, marks: [selectedMark] };

  render(
    <Inspector
      activeFrame={selectedFrame}
      autoSailTrim
      onDelete={jest.fn()}
      onSetAutoSailTrim={jest.fn()}
      selectedBoat={undefined}
      selectedMark={selectedMark}
      selectedType="mark"
      updateBoat={jest.fn()}
      updateMark={updateMark}
    />,
  );

  return updateMark;
}

describe('mark rotation controls', () => {
  it('keeps rotation arrows hidden by default and allows showing them', () => {
    const updateMark = renderMarkInspector();
    const checkbox = screen.getByRole('checkbox', { name: /show rotation arrow/i });

    expect(checkbox).not.toBeChecked();
    expect(screen.queryByRole('button', { name: /reverse direction/i })).not.toBeInTheDocument();

    fireEvent.click(checkbox);

    expect(updateMark).toHaveBeenCalledWith('mark-1', { showRotationArrow: true });
  });

  it('reverses and displays the current rounding direction', () => {
    const updateMark = renderMarkInspector(jest.fn(), { ...mark, showRotationArrow: true });
    const reverseButton = screen.getByRole('button', { name: /reverse direction \(counterclockwise\)/i });

    fireEvent.click(reverseButton);

    expect(updateMark).toHaveBeenCalledWith('mark-1', { rotationDirection: 'clockwise' });
  });
});
