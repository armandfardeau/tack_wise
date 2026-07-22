import { fireEvent, render, screen } from '@testing-library/react';
import Sidebar from '../src/components/Sidebar';

const renderSidebar = (onScenarioTitleChange = jest.fn()) => render(
  <Sidebar
    currentFrameIndex={0}
    frames={[]}
    scenarioTitle="Mark Room"
    onScenarioTitleChange={onScenarioTitleChange}
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
});
