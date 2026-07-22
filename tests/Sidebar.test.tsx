import { fireEvent, render, screen } from '@testing-library/react';
import Sidebar from '../src/components/Sidebar';
import type { Frame } from '../src/types';

const renderSidebar = (onScenarioTitleChange = jest.fn(), frames: Frame[] = [], isOpen = true) => render(
  <Sidebar
    currentFrameIndex={0}
    frames={frames}
    scenarioTitle="Mark Room"
    onScenarioTitleChange={onScenarioTitleChange}
    onFixTransition={jest.fn()}
    isOpen={isOpen}
    onAddFrame={jest.fn()}
    onDeleteFrame={jest.fn()}
    onDuplicateFrame={jest.fn()}
    onRenameFrame={jest.fn()}
    onSelectFrame={jest.fn()}
    onToggle={jest.fn()}
    onClose={jest.fn()}
    onOpenInspector={jest.fn()}
    selectedId={null}
    selectedType={null}
  />,
);

describe('Sidebar', () => {
  it('renders and updates the scenario title before the frames controls', () => {
    const onScenarioTitleChange = jest.fn();

    renderSidebar(onScenarioTitleChange);

    const titleInput = screen.getByRole('textbox', { name: /scenario title/i });
    expect(titleInput).toHaveValue('Mark Room');
    expect(screen.getByRole('heading', { name: /frames/i })).toBeInTheDocument();
    expect(titleInput.compareDocumentPosition(screen.getByRole('heading', { name: /frames/i }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    fireEvent.change(titleInput, { target: { value: 'Upwind Crossing' } });

    expect(onScenarioTitleChange).toHaveBeenCalledWith('Upwind Crossing');
  });

  it('resets to Frames when the drawer is reopened after showing Layers', () => {
    const frames: Frame[] = [
      { id: 'frame-1', name: 'Frame 1', windAngle: 0, windSpeed: 12, boats: [], marks: [] },
    ];
    const { rerender } = renderSidebar(jest.fn(), frames);

    fireEvent.click(screen.getByRole('button', { name: 'Show layers for frame 1' }));
    expect(screen.getByRole('heading', { name: /layers/i })).toBeInTheDocument();

    rerender(<Sidebar
      currentFrameIndex={0}
      frames={frames}
      scenarioTitle="Mark Room"
      onScenarioTitleChange={jest.fn()}
      onFixTransition={jest.fn()}
      isOpen={false}
      onAddFrame={jest.fn()}
      onDeleteFrame={jest.fn()}
      onDuplicateFrame={jest.fn()}
      onRenameFrame={jest.fn()}
      onSelectFrame={jest.fn()}
      onToggle={jest.fn()}
      onClose={jest.fn()}
      onOpenInspector={jest.fn()}
      selectedId={null}
      selectedType={null}
    />);
    rerender(<Sidebar
      currentFrameIndex={0}
      frames={frames}
      scenarioTitle="Mark Room"
      onScenarioTitleChange={jest.fn()}
      onFixTransition={jest.fn()}
      isOpen
      onAddFrame={jest.fn()}
      onDeleteFrame={jest.fn()}
      onDuplicateFrame={jest.fn()}
      onRenameFrame={jest.fn()}
      onSelectFrame={jest.fn()}
      onToggle={jest.fn()}
      onClose={jest.fn()}
      onOpenInspector={jest.fn()}
      selectedId={null}
      selectedType={null}
    />);

    expect(screen.getByRole('heading', { name: /frames/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /layers/i })).not.toBeInTheDocument();
  });
});
