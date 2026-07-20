import { fireEvent, render, screen } from '@testing-library/react';
import Inspector from '../src/components/Inspector';
import type { Boat, CommentNote, DiagramImage, Frame, Mark, MarkConnection, RuleComment, TacticalArrow } from '../src/types';

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

const ruleComment: RuleComment = {
  id: 'rule-comment-1',
  name: 'RRS 10 breach',
  type: 'rule',
  rules: [{ id: 'rrs-10', label: 'RRS 10', description: 'Keep clear.' }],
  offenseTargets: [],
  color: '#facc15',
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

describe('inspector deletion control', () => {
  it('places object deletion in the inspector header as an icon button', () => {
    renderMarkInspector();

    const deleteButton = screen.getByRole('button', { name: /delete mark/i });

    expect(deleteButton).toHaveClass('inspector-delete-btn');
    expect(deleteButton.closest('h3')).toHaveClass('section-title');
    expect(screen.queryByText('Delete Mark')).not.toBeInTheDocument();
  });

  it('places object duplication next to deletion in the inspector header', () => {
    const onDuplicate = jest.fn();
    render(
      <Inspector
        activeFrame={{ ...frame, marks: [mark] }}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onDuplicate={onDuplicate}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedMark={mark}
        selectedType="mark"
        showGrid
        updateBoat={jest.fn()}
        updateActiveFrame={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    const duplicateButton = screen.getByRole('button', { name: /duplicate mark/i });

    expect(duplicateButton).toHaveClass('inspector-duplicate-btn');
    expect(duplicateButton.nextElementSibling).toHaveClass('inspector-delete-btn');
    fireEvent.click(duplicateButton);
    expect(onDuplicate).toHaveBeenCalledTimes(1);
  });
});

describe('inspector tabs', () => {
  it('groups boat controls into heading, settings, and display tabs', () => {
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
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Heading' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText(/heading \(0°\)/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Alpha');
    expect(screen.queryByLabelText(/heading \(0°\)/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Display' }));
    expect(screen.getByRole('checkbox', { name: /show dotted path line/i })).toBeInTheDocument();
  });
});

describe('rule comment controls', () => {
  it('edits the rule reference and associates offense targets', () => {
    const updateRuleComment = jest.fn();

    render(
      <Inspector
        activeFrame={{ ...frame, boats: [boat] }}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedMark={undefined}
        selectedComment={ruleComment}
        selectedType="comment"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
        updateRuleComment={updateRuleComment}
      />,
    );

    fireEvent.change(screen.getByLabelText('Search rule references'), { target: { value: '18' } });
    expect(screen.getByRole('option', { name: 'RRS 18' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'RRS 11' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Search rule references'), { target: { value: '' } });

    const ruleSelect = screen.getByLabelText('Rule references') as HTMLSelectElement;
    Array.from(ruleSelect.options).forEach((option) => {
      option.selected = option.value === 'rrs-10' || option.value === 'rrs-18';
    });
    fireEvent.change(ruleSelect);
    fireEvent.change(screen.getByLabelText('Add offending object'), { target: { value: 'boat:boat-1' } });


    expect(updateRuleComment).toHaveBeenCalledWith('rule-comment-1', {
      rules: [{ id: 'rrs-10', label: 'RRS 10', description: 'Keep clear.' }, { id: 'rrs-18', label: 'RRS 18' }],
    });
    expect(updateRuleComment).toHaveBeenCalledWith('rule-comment-1', {
      offenseTargets: [{ id: 'boat-1', type: 'boat', color: '#ef4444' }],
    });
  });

  it('edits an offense row color and removes the row', () => {
    const updateRuleComment = jest.fn();
    const selectedComment: RuleComment = {
      ...ruleComment,
      offenseTargets: [{ id: 'boat-1', type: 'boat', color: '#ef4444' }],
    };

    render(
      <Inspector
        activeFrame={{ ...frame, boats: [boat] }}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedMark={undefined}
        selectedComment={selectedComment}
        selectedType="comment"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
        updateRuleComment={updateRuleComment}
      />,
    );

    fireEvent.change(screen.getByLabelText('Color for Alpha'), { target: { value: '#00ff00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove offending object Alpha' }));

    expect(updateRuleComment).toHaveBeenCalledWith('rule-comment-1', {
      offenseTargets: [{ id: 'boat-1', type: 'boat', color: '#00ff00' }],
    });
    expect(updateRuleComment).toHaveBeenCalledWith('rule-comment-1', { offenseTargets: [] });
  });
});

describe('mark rotation controls', () => {
  it('keeps rotation arrows hidden by default and allows showing them', () => {
    const updateMark = renderMarkInspector();
    fireEvent.click(screen.getByRole('tab', { name: 'Rotation' }));
    const checkbox = screen.getByRole('checkbox', { name: /show rotation arrow/i });

    expect(checkbox).not.toBeChecked();
    expect(screen.queryByRole('button', { name: /reverse direction/i })).not.toBeInTheDocument();

    fireEvent.click(checkbox);

    expect(updateMark).toHaveBeenCalledWith('mark-1', { showRotationArrow: true });
  });

  it('reverses and displays the current rounding direction', () => {
    const updateMark = renderMarkInspector(jest.fn(), { ...mark, showRotationArrow: true });
    fireEvent.click(screen.getByRole('tab', { name: 'Rotation' }));
    const reverseButton = screen.getByRole('button', { name: /reverse direction \(counterclockwise\)/i });

    fireEvent.click(reverseButton);

    expect(updateMark).toHaveBeenCalledWith('mark-1', { rotationDirection: 'clockwise' });
  });

  it('reverses a clockwise arrow and exposes connection style defaults', () => {
    const updateMark = jest.fn();
    const updateConnection = jest.fn();
    const clockwiseMark = { ...mark, showRotationArrow: true, rotationDirection: 'clockwise' as const };
    const connectedMark = { ...mark };
    const otherMark = { ...mark, id: 'mark-2', name: 'Other mark' };
    const connection: MarkConnection = {
      id: 'connection-1',
      start: { markId: 'mark-1', anchor: { x: 0, y: 0 } },
      end: { markId: 'mark-2', anchor: { x: 0, y: 0 } },
    };

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

    fireEvent.click(screen.getByRole('tab', { name: 'Rotation' }));
    fireEvent.click(screen.getByRole('button', { name: /reverse direction \(clockwise\)/i }));
    expect(updateMark).toHaveBeenCalledWith('mark-1', { rotationDirection: 'counterclockwise' });

    // Connection styling belongs to the selected connection, so it can be
    // edited independently from the source mark.
    render(
      <Inspector
        activeFrame={{ ...frame, marks: [connectedMark, otherMark], connections: [connection] }}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedMark={undefined}
        selectedConnection={connection}
        selectedType="connection"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
        updateConnection={updateConnection}
      />,
    );

    expect(screen.getByLabelText('Line Color')).toHaveValue('#ef4444');
    expect(screen.getByLabelText('Line Style')).toHaveValue('dotted');
    expect(screen.getByRole('checkbox', { name: /show arrowhead/i })).not.toBeChecked();
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

    fireEvent.click(screen.getByRole('tab', { name: 'Display' }));
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
    fireEvent.click(screen.getByRole('tab', { name: 'Display' }));
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

    fireEvent.click(screen.getByRole('tab', { name: 'Display' }));
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

  it('offers quick heading angle selections', () => {
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

    const quickAngles = ['0°', '+45°', '+90°', '+135°', '180°', '-135°', '-90°', '-45°'];

    quickAngles.forEach((angle) => {
      expect(screen.getByRole('button', { name: angle })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '+135°' }));

    expect(updateBoat).toHaveBeenCalledWith('boat-1', { heading: 135 });
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

    fireEvent.click(screen.getByRole('tab', { name: 'Ghost Display' }));
    expect(screen.getByRole('radio', { name: /previous frame only/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /all previous frames/i })).not.toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: /all previous frames/i }));

    expect(onSetDisplayMode).toHaveBeenCalledWith('cumulative');
  });

  it('toggles frame title and number visibility from the canvas settings', () => {
    const onSetShowFrameTitle = jest.fn();
    const onSetShowFrameNumber = jest.fn();

    render(
      <Inspector
        activeFrame={frame}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowFrameTitle={onSetShowFrameTitle}
        onSetShowFrameNumber={onSetShowFrameNumber}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedMark={undefined}
        selectedType="grid"
        showFrameTitle
        showFrameNumber
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Frame Header' }));
    const titleToggle = screen.getByRole('checkbox', { name: /show frame title/i });
    const numberToggle = screen.getByRole('checkbox', { name: /show frame number/i });
    expect(titleToggle).toBeChecked();
    expect(numberToggle).toBeChecked();

    fireEvent.click(titleToggle);
    fireEvent.click(numberToggle);

    expect(onSetShowFrameTitle).toHaveBeenCalledWith(false);
    expect(onSetShowFrameNumber).toHaveBeenCalledWith(false);
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

    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Bravo' } });
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#ffffff' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /auto sail trim/i }));
    fireEvent.change(screen.getByLabelText(/sail angle \(0°\)/i), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Display' }));
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
    const thirdMark: Mark = { ...mark, id: 'mark-3', name: 'Finish Mark', x: 600, y: 450 };
    const connectedMark = { ...mark };
    const connection: MarkConnection = {
      id: 'connection-1',
      start: { markId: 'mark-1', anchor: { x: 0, y: 0 } },
      end: { markId: 'mark-2', anchor: { x: 0, y: 0 } },
      color: '#111111',
      style: 'dashed',
      arrowhead: true,
    };
    const onConnectMarks = jest.fn();
    const onRemoveMarkConnection = jest.fn();
    const onReplaceMarkConnection = jest.fn();

    const renderedMarkInspector = render(
      <Inspector
        activeFrame={{ ...frame, marks: [connectedMark, secondMark, thirdMark], connections: [connection] }}
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
        onConnectMarks={onConnectMarks}
        onRemoveMarkConnection={onRemoveMarkConnection}
        onReplaceMarkConnection={onReplaceMarkConnection}
      />,
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Windward' } });
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#00ff00' } });
    fireEvent.change(screen.getByLabelText('Shape'), { target: { value: 'gate' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Connection' }));
    fireEvent.click(screen.getByRole('button', { name: /edit connection to leeward mark/i }));
    fireEvent.change(screen.getByRole('combobox', { name: /edit connection to leeward mark/i }), { target: { value: 'mark-3' } });
    fireEvent.click(screen.getByRole('button', { name: /add connection/i }));
    fireEvent.change(screen.getByRole('combobox', { name: /new connection target/i }), { target: { value: 'mark-3' } });
    fireEvent.click(screen.getByRole('button', { name: /delete connection to leeward mark/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete mark/i }));

    expect(updateMark).toHaveBeenCalledWith('mark-1', { name: 'Windward' });
    expect(updateMark).toHaveBeenCalledWith('mark-1', { color: '#00ff00' });
    expect(updateMark).toHaveBeenCalledWith('mark-1', { shape: 'gate' });
    expect(onReplaceMarkConnection).toHaveBeenCalledWith('connection-1', 'mark-3');
    expect(onConnectMarks).toHaveBeenCalledWith('mark-1', 'mark-3');
    expect(onRemoveMarkConnection).toHaveBeenCalledWith('connection-1');
    expect(onDelete).toHaveBeenCalledTimes(1);

    renderedMarkInspector.unmount();
    const updateConnection = jest.fn();
    render(
      <Inspector
        activeFrame={{ ...frame, marks: [connectedMark, secondMark, thirdMark], connections: [connection] }}
        autoSailTrim
        gridSnapEnabled
        onDelete={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetShowGrid={jest.fn()}
        selectedBoat={undefined}
        selectedConnection={connection}
        selectedMark={undefined}
        selectedType="connection"
        showGrid
        updateActiveFrame={jest.fn()}
        updateBoat={jest.fn()}
        updateMark={jest.fn()}
        updateConnection={updateConnection}
      />,
    );

    fireEvent.change(screen.getByLabelText('Line Color'), { target: { value: '#222222' } });
    fireEvent.change(screen.getByLabelText('Line Style'), { target: { value: 'solid' } });
    expect(updateConnection).toHaveBeenCalledWith('connection-1', { color: '#222222' });
    expect(updateConnection).toHaveBeenCalledWith('connection-1', { style: 'solid' });
  });

  it('connects an unconnected mark to the first other mark', () => {
    const onConnectMarks = jest.fn();
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
        updateMark={jest.fn()}
        onConnectMarks={onConnectMarks}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Connection' }));
    fireEvent.click(screen.getByRole('button', { name: /add connection/i }));
    fireEvent.change(screen.getByRole('combobox', { name: /new connection target/i }), { target: { value: 'mark-2' } });

    expect(onConnectMarks).toHaveBeenCalledWith('mark-1', 'mark-2');
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
    fireEvent.click(screen.getByRole('tab', { name: 'Display' }));
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
    fireEvent.click(screen.getByRole('tab', { name: 'Display' }));
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
