import { fireEvent, render, screen } from '@testing-library/react';
import Inspector from '../src/components/Inspector';
import type { Boat, CommentNote, DiagramImage, Frame, Mark, TacticalArrow } from '../src/types';

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

const comment: CommentNote = {
  id: 'comment-1',
  name: 'Tack here',
  text: 'Explain the overlap',
  color: '#f8fafc',
  x: 180,
  y: 100,
};

const image: DiagramImage = {
  id: 'image-1',
  name: 'Course diagram',
  src: 'data:image/png;base64,AA==',
  x: 100,
  y: 120,
  width: 180,
  height: 120,
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

  it('reverses a clockwise arrow and falls back for optional connection styles', () => {
    const updateMark = jest.fn();
    const clockwiseMark = { ...mark, showRotationArrow: true, rotationDirection: 'clockwise' as const };
    const connectedMark = { ...mark, connectedToMarkId: 'mark-2' };
    const otherMark = { ...mark, id: 'mark-2', name: 'Other mark' };

    render(
      <Inspector
        activeFrame={{ ...frame, marks: [connectedMark, otherMark] }}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedMark={clockwiseMark}
        selectedType="mark"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={updateMark}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /reverse direction \(clockwise\)/i }));
    expect(updateMark).toHaveBeenCalledWith('mark-1', { rotationDirection: 'counterclockwise' });

    // Render the connected mark without saved style fields to exercise the
    // color and dotted-line defaults in the editor.
    render(
      <Inspector
        activeFrame={{ ...frame, marks: [connectedMark, otherMark] }}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedMark={connectedMark}
        selectedType="mark"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Line Color')).toHaveValue('#ef4444');
    expect(screen.getByLabelText('Line Style')).toHaveValue('dotted');
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

  it('edits arrow styling, restores legacy curvature, toggles the arrowhead, and deletes', () => {
    const updateArrow = jest.fn();
    const onDelete = jest.fn();
    const arrow: TacticalArrow = {
      id: 'arrow-2',
      name: 'Layline',
      color: '#f97316',
      points: [{ x: 10, y: 20 }, { x: 100, y: 120 }],
      curved: false,
    };

    render(
      <Inspector
        activeFrame={frame}
        autoSailTrim
        gridSnapEnabled
        onDelete={onDelete}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedArrow={arrow}
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

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New arrow' } });
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#00ff00' } });
    fireEvent.change(screen.getByLabelText(/line width \(3px\)/i), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('Line style'), { target: { value: 'dotted' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /curved arrow/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /show arrowhead/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete arrow/i }));

    expect(updateArrow).toHaveBeenCalledWith('arrow-2', { name: 'New arrow' });
    expect(updateArrow).toHaveBeenCalledWith('arrow-2', { color: '#00ff00' });
    expect(updateArrow).toHaveBeenCalledWith('arrow-2', { lineWidth: 6 });
    expect(updateArrow).toHaveBeenCalledWith('arrow-2', { lineStyle: 'dotted' });
    expect(updateArrow).toHaveBeenCalledWith('arrow-2', expect.objectContaining({ curved: true, points: expect.any(Array) }));
    expect(updateArrow).toHaveBeenCalledWith('arrow-2', { showArrowhead: false });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('reduces a two-point curved arrow without changing its endpoints', () => {
    const updateArrow = jest.fn();
    const arrow: TacticalArrow = { ...curvedArrow, id: 'arrow-legacy', points: [{ x: 1, y: 2 }, { x: 3, y: 4 }], curved: true };

    render(
      <Inspector
        activeFrame={frame}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedArrow={arrow}
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
    expect(updateArrow).toHaveBeenCalledWith('arrow-legacy', { curved: false, points: arrow.points });
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
    fireEvent.change(screen.getByLabelText(/playback speed/i), { target: { value: '2000' } });
    fireEvent.click(screen.getByRole('button', { name: /play scenario/i }));

    expect(onSetPlaySpeed).toHaveBeenCalledWith(500);
    expect(onTogglePlaying).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('checkbox', { name: /smooth movement/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/transition to next frame/i)).not.toBeInTheDocument();
  });

  it('uses the paused state and default optional callbacks', () => {
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
        selectedType="playback"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /play scenario/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /play scenario/i }));
  });
});

describe('boat editor', () => {
  it('edits boat identity, color, manual sail trim, heading line, and deletion', () => {
    const updateBoat = jest.fn();
    const onSetAutoSailTrim = jest.fn();
    const onDelete = jest.fn();

    render(
      <Inspector
        activeFrame={{ ...frame, boats: [boat] }}
        autoSailTrim={false}
        gridSnapEnabled
        onDelete={onDelete}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={onSetAutoSailTrim}
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

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Bravo' } });
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#ffffff' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /auto sail trim/i }));
    fireEvent.change(screen.getByLabelText(/sail angle \(0°\)/i), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /show dotted path line/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete boat/i }));

    expect(updateBoat).toHaveBeenNthCalledWith(1, 'boat-1', { name: 'Bravo' });
    expect(updateBoat).toHaveBeenNthCalledWith(2, 'boat-1', { color: '#ffffff' });
    expect(onSetAutoSailTrim).toHaveBeenCalledWith(true);
    expect(updateBoat).toHaveBeenNthCalledWith(3, 'boat-1', { sailAngle: 30 });
    expect(updateBoat).toHaveBeenNthCalledWith(4, 'boat-1', { showHeadingLine: true });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe('mark editor', () => {
  it('edits mark fields, connections, styles, and deletion', () => {
    const updateMark = jest.fn();
    const onDelete = jest.fn();
    const secondMark: Mark = { ...mark, id: 'mark-2', name: 'Leeward Mark', x: 500, y: 400 };
    const connectedMark = { ...mark, connectedToMarkId: 'mark-2', connectionLineColor: '#111111', connectionLineStyle: 'dashed' as const };

    render(
      <Inspector
        activeFrame={{ ...frame, marks: [connectedMark, secondMark] }}
        autoSailTrim
        gridSnapEnabled
        onDelete={onDelete}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedMark={connectedMark}
        selectedType="mark"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={updateMark}
      />,
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Windward' } });
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#00ff00' } });
    fireEvent.change(screen.getByLabelText('Shape'), { target: { value: 'gate' } });
    fireEvent.change(screen.getByLabelText('Connect to'), { target: { value: 'mark-2' } });
    fireEvent.change(screen.getByLabelText('Line Color'), { target: { value: '#222222' } });
    fireEvent.change(screen.getByLabelText('Line Style'), { target: { value: 'solid' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /show dotted line/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete mark/i }));

    expect(updateMark).toHaveBeenCalledWith('mark-1', { name: 'Windward' });
    expect(updateMark).toHaveBeenCalledWith('mark-1', { color: '#00ff00' });
    expect(updateMark).toHaveBeenCalledWith('mark-1', { shape: 'gate' });
    expect(updateMark).toHaveBeenCalledWith('mark-1', { connectedToMarkId: 'mark-2' });
    expect(updateMark).toHaveBeenCalledWith('mark-1', { connectionLineColor: '#222222' });
    expect(updateMark).toHaveBeenCalledWith('mark-1', { connectionLineStyle: 'solid' });
    expect(updateMark).toHaveBeenCalledWith('mark-1', { connectedToMarkId: null });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('connects an unconnected mark to the first other mark using fallback styles', () => {
    const updateMark = jest.fn();
    const secondMark: Mark = { ...mark, id: 'mark-2', name: 'Leeward Mark' };

    render(
      <Inspector
        activeFrame={{ ...frame, marks: [mark, secondMark] }}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedMark={mark}
        selectedType="mark"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={updateMark}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /show dotted line/i }));

    expect(updateMark).toHaveBeenCalledWith('mark-1', {
      connectedToMarkId: 'mark-2',
      connectionLineColor: '#ef4444',
      connectionLineStyle: 'dotted',
    });
  });
});

describe('comment and image editors', () => {
  it('edits and deletes comments', () => {
    const updateComment = jest.fn();
    const onDelete = jest.fn();

    render(
      <Inspector
        activeFrame={frame}
        autoSailTrim
        gridSnapEnabled
        onDelete={onDelete}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedComment={comment}
        selectedMark={undefined}
        selectedType="comment"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateComment={updateComment}
        updateMark={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Tack note' } });
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'New explanation' } });
    fireEvent.change(screen.getByLabelText('Text color'), { target: { value: '#ff0000' } });
    fireEvent.change(screen.getByLabelText(/font size \(14px\)/i), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /delete comment/i }));

    expect(updateComment).toHaveBeenCalledWith('comment-1', { name: 'Tack note' });
    expect(updateComment).toHaveBeenCalledWith('comment-1', { text: 'New explanation' });
    expect(updateComment).toHaveBeenCalledWith('comment-1', { color: '#ff0000' });
    expect(updateComment).toHaveBeenCalledWith('comment-1', { fontSize: 20 });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('edits and deletes diagram images with default rotation', () => {
    const updateImage = jest.fn();
    const onDelete = jest.fn();

    render(
      <Inspector
        activeFrame={frame}
        autoSailTrim
        gridSnapEnabled
        onDelete={onDelete}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedImage={image}
        selectedMark={undefined}
        selectedType="image"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateImage={updateImage}
        updateMark={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Background' } });
    fireEvent.change(screen.getByLabelText(/width \(180px\)/i), { target: { value: '240' } });
    fireEvent.change(screen.getByLabelText(/rotation \(0°\)/i), { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: /delete image/i }));

    expect(updateImage).toHaveBeenCalledWith('image-1', { name: 'Background' });
    expect(updateImage).toHaveBeenCalledWith('image-1', { width: 240 });
    expect(updateImage).toHaveBeenCalledWith('image-1', { rotation: 45 });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe('inspector fallback', () => {
  it('explains when a selection has no editable object', () => {
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
        selectedType={null}
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    expect(screen.getByText(/click an object or the wind indicator/i)).toBeInTheDocument();
  });
});
