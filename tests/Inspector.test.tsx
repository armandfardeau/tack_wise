import { fireEvent, render, screen } from '@testing-library/react';
import Inspector from '../src/components/Inspector';
import type { Boat, Frame, Mark, TacticalArrow } from '../src/types';

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

const boat: Boat = {
  id: 'boat-1',
  name: 'Alpha',
  color: '#38bdf8',
  x: 200,
  y: 350,
  heading: 0,
  sailAngle: 0,
};

const curvedArrow: TacticalArrow = {
  id: 'arrow-1',
  name: 'Turn',
  color: '#f97316',
  points: [{ x: 100, y: 200 }, { x: 180, y: 120 }, { x: 260, y: 200 }],
  curved: true,
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

describe('curved arrow controls', () => {
  it('removes the curvature point when curvature is turned off', () => {
    const updateArrow = jest.fn();

    render(
      <Inspector
        activeFrame={frame}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedArrow={curvedArrow}
        selectedBoat={undefined}
        selectedMark={undefined}
        selectedType="arrow"
        showGrid
        updateActiveFrame={jest.fn()}
        updateArrow={updateArrow}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /curved arrow/i }));

    expect(updateArrow).toHaveBeenCalledWith('arrow-1', {
      curved: false,
      points: [{ x: 100, y: 200 }, { x: 260, y: 200 }],
    });
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

describe('boat controls', () => {
  it('allows selecting a heading from -360° to +360°', () => {
    const updateBoat = jest.fn();

    render(
      <Inspector
        activeFrame={{ ...frame, boats: [boat] }}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={boat}
        selectedMark={undefined}
        selectedType="boat"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={updateBoat}
        updateMark={jest.fn()}
      />,
    );

    const heading = screen.getByLabelText(/heading \(0°\)/i);
    expect(heading).toHaveAttribute('min', '-360');
    expect(heading).toHaveAttribute('max', '360');

    fireEvent.change(heading, { target: { value: '-180' } });

    expect(updateBoat).toHaveBeenCalledWith('boat-1', { heading: -180 });
  });
});

describe('magnetic grid controls', () => {
  it('updates snap and placement-grid settings from the inspector', () => {
    const onSetGridSnapEnabled = jest.fn();
    const onSetShowGrid = jest.fn();
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
        selectedBoat={undefined}
        selectedMark={undefined}
        selectedType="grid"
        showGrid
        updateActiveFrame={updateActiveFrame}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    expect(onSetGridSnapEnabled).toHaveBeenCalledWith(false);
    expect(onSetShowGrid).toHaveBeenCalledWith(false);
    expect(screen.queryByLabelText(/direction \(0°\)/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/velocity \(12 kts\)/i)).not.toBeInTheDocument();
    expect(updateActiveFrame).not.toHaveBeenCalled();

    expect(screen.queryByRole('button', { name: /switch to light mode/i })).not.toBeInTheDocument();
  });

  it('updates ghost display mode from the canvas settings', () => {
    const onSetDisplayMode = jest.fn();

    render(
      <Inspector
        activeFrame={frame}
        autoSailTrim
        displayMode="single"
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetDisplayMode={onSetDisplayMode}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedMark={undefined}
        selectedType="grid"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: /previous frame only/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /all previous frames/i })).not.toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: /all previous frames/i }));

    expect(onSetDisplayMode).toHaveBeenCalledWith('cumulative');
  });
});

describe('playback controls', () => {
  it('updates playback speed and toggles playback from the inspector', () => {
    const onSetPlaySpeed = jest.fn();
    const onTogglePlaying = jest.fn();

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
        onTogglePlaying={onTogglePlaying}
        playSpeed={1000}
        selectedBoat={undefined}
        selectedMark={undefined}
        selectedType="playback"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/playback speed/i), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: /play scenario/i }));

    expect(onSetPlaySpeed).toHaveBeenCalledWith(500);
    expect(onTogglePlaying).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('checkbox', { name: /smooth movement/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/transition to next frame/i)).not.toBeInTheDocument();
  });
});
