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
      gridSnapEnabled
      onDelete={jest.fn()}
      onSetGridSnapEnabled={jest.fn()}
      onSetAutoSailTrim={jest.fn()}
      onSetShowGrid={jest.fn()}
      selectedBoat={undefined}
      selectedMark={selectedMark}
      selectedType="mark"
      showGrid
      updateBoat={jest.fn()}
      updateActiveFrame={jest.fn()}
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

describe('wind controls', () => {
  it('edits wind settings from the inspector', () => {
    const updateActiveFrame = jest.fn();

    render(
      <Inspector
        activeFrame={frame}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedMark={undefined}
        selectedType="wind"
        showGrid
        updateActiveFrame={updateActiveFrame}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/direction \(0°\)/i), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText(/velocity \(12 kts\)/i), { target: { value: '18' } });

    expect(updateActiveFrame).toHaveBeenNthCalledWith(1, { windAngle: 90 });
    expect(updateActiveFrame).toHaveBeenNthCalledWith(2, { windSpeed: 18 });
  });
});

describe('magnetic grid controls', () => {
  it('updates snap and placement-grid settings from the inspector', () => {
    const onSetGridSnapEnabled = jest.fn();
    const onSetShowGrid = jest.fn();
    const onToggleTheme = jest.fn();
    const updateActiveFrame = jest.fn();

    render(
      <Inspector
        activeFrame={frame}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={onSetGridSnapEnabled}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={onSetShowGrid}
        onToggleTheme={onToggleTheme}
        selectedBoat={undefined}
        selectedMark={undefined}
        selectedType="grid"
        showGrid
        theme="dark"
        updateActiveFrame={updateActiveFrame}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.change(screen.getByLabelText(/direction \(0°\)/i), { target: { value: '90' } });

    expect(onSetGridSnapEnabled).toHaveBeenCalledWith(false);
    expect(onSetShowGrid).toHaveBeenCalledWith(false);
    expect(updateActiveFrame).toHaveBeenCalledWith({ windAngle: 90 });

    fireEvent.click(screen.getByRole('button', { name: /switch to light mode/i }));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });
});

describe('playback controls', () => {
  it('updates playback speed and toggles playback from the inspector', () => {
    const onSetPlaySpeed = jest.fn();
    const onSetAnimationMode = jest.fn();
    const onTogglePlaying = jest.fn();
    const updateActiveFrame = jest.fn();

    render(
      <Inspector
        activeFrame={frame}
        autoSailTrim
        gridSnapEnabled
        isPlaying={false}
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        onSetPlaySpeed={onSetPlaySpeed}
        animationMode="step"
        onSetAnimationMode={onSetAnimationMode}
        onTogglePlaying={onTogglePlaying}
        playSpeed={1000}
        selectedBoat={undefined}
        selectedMark={undefined}
        selectedType="playback"
        showGrid
        updateActiveFrame={updateActiveFrame}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/playback speed/i), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /smooth movement/i }));
    fireEvent.change(screen.getByLabelText(/transition to next frame/i), { target: { value: '2000' } });
    fireEvent.click(screen.getByRole('button', { name: /play scenario/i }));

    expect(onSetPlaySpeed).toHaveBeenCalledWith(500);
    expect(onSetAnimationMode).toHaveBeenCalledWith('continuous');
    expect(updateActiveFrame).toHaveBeenCalledWith({
      transition: { animationMode: 'step', durationMs: 2000 },
    });
    expect(onTogglePlaying).toHaveBeenCalledTimes(1);
  });
});
