import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import Sidebar from '../src/components/Sidebar';
import type { Frame } from '../src/types';

const frame: Frame = {
  id: 'frame-1',
  name: 'Mark Room',
  windAngle: 0,
  windSpeed: 12,
  boats: [{ id: 'boat-1', name: 'Alpha', color: '#38bdf8', x: 100, y: 100, heading: 0, sailAngle: 0 }],
  marks: [],
};

const baseProps: ComponentProps<typeof Sidebar> = {
  currentFrameIndex: 0,
  frames: [frame],
  scenarioTitle: 'Mark Room',
  onScenarioTitleChange: jest.fn(),
  presenterMode: false,
  isExporting: false,
  theme: 'dark',
  exportQuality: 'standard',
  onExportQualityChange: jest.fn(),
  onNewScenario: jest.fn(),
  onExport: jest.fn(),
  onImportJson: jest.fn(),
  onShareScenario: jest.fn(),
  onFixTransition: jest.fn(),
  isOpen: true,
  onAddFrame: jest.fn(),
  onDeleteFrame: jest.fn(),
  onDuplicateFrame: jest.fn(),
  onRenameFrame: jest.fn(),
  onSelectFrame: jest.fn(),
  onToggle: jest.fn(),
  onClose: jest.fn(),
  onOpenInspector: jest.fn(),
  selectedId: null,
  selectedType: null,
  activeFrame: frame,
  autoSailTrim: true,
  displayMode: 'single',
  gridSnapEnabled: true,
  showGrid: true,
  showFrameTitle: true,
  showFrameNumber: true,
  onSetGridSnapEnabled: jest.fn(),
  onSetAutoSailTrim: jest.fn(),
  onSetDisplayMode: jest.fn(),
  onSetShowFrameTitle: jest.fn(),
  onSetShowFrameNumber: jest.fn(),
  onSetShowGrid: jest.fn(),
  isPlaying: false,
  onTogglePlaying: jest.fn(),
  onStepBackward: jest.fn(),
  onStepForward: jest.fn(),
  onReplayFromStart: jest.fn(),
  playSpeed: 2000,
  onSetPlaySpeed: jest.fn(),
  onAddBoat: jest.fn(),
  onAddMark: jest.fn(),
  onAddArrow: jest.fn(),
  onAddComment: jest.fn(),
  onAddRuleComment: jest.fn(),
  onAddImage: jest.fn(),
  updateActiveFrame: jest.fn(),
};

describe('Sidebar control panel', () => {
  it('renders and updates the scenario title in Scene', () => {
    const onScenarioTitleChange = jest.fn();

    render(<Sidebar {...baseProps} onScenarioTitleChange={onScenarioTitleChange} />);

    const titleInput = screen.getByRole('textbox', { name: /scenario title/i });
    expect(titleInput).toHaveValue('Mark Room');
    fireEvent.change(titleInput, { target: { value: 'Upwind Crossing' } });

    expect(onScenarioTitleChange).toHaveBeenCalledWith('Upwind Crossing');
  });

  it('groups environment, canvas, layers, and add actions in Scene', () => {
    const onOpenInspector = jest.fn();
    const onAddBoat = jest.fn();

    render(<Sidebar {...baseProps} onOpenInspector={onOpenInspector} onAddBoat={onAddBoat} />);

    expect(screen.getByRole('tab', { name: /scene/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText(/direction \(0°\)/i)).toBeInTheDocument();
    expect(screen.getByText('Canvas settings')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /alpha/i }));
    fireEvent.click(screen.getByRole('button', { name: /add boat/i }));

    expect(onOpenInspector).toHaveBeenCalledWith('boat-1', 'boat');
    expect(onAddBoat).toHaveBeenCalledTimes(1);
  });

  it('groups playback and frame editing in Sequence', () => {
    const onTogglePlaying = jest.fn();
    const onSelectFrame = jest.fn();

    render(<Sidebar {...baseProps} onTogglePlaying={onTogglePlaying} onSelectFrame={onSelectFrame} />);

    fireEvent.click(screen.getByRole('tab', { name: /sequence/i }));
    expect(screen.getByRole('tabpanel', { name: /sequence/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /playback/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /play scenario/i }));
    fireEvent.click(screen.getByRole('button', { name: /mark room/i }));

    expect(onTogglePlaying).toHaveBeenCalledTimes(1);
    expect(onSelectFrame).toHaveBeenCalledWith(0);
  });

  it('groups link, file, export, and template actions in Share', () => {
    const onShareScenario = jest.fn();

    render(<Sidebar {...baseProps} onShareScenario={onShareScenario} templates={[{ id: 'one', title: 'One', frames: [] }]} />);

    fireEvent.click(screen.getByRole('tab', { name: /share/i }));
    expect(screen.getByText('Share this situation')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));
    fireEvent.click(screen.getByRole('button', { name: /^export$/i }));

    expect(onShareScenario).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog', { name: /export/i })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /search templates/i })).toBeInTheDocument();
  });

  it('supports the mobile drawer trigger and scrim close action', () => {
    const onToggle = jest.fn();
    const onClose = jest.fn();

    render(<Sidebar {...baseProps} onToggle={onToggle} onClose={onClose} />);

    const closeControlsButtons = screen.getAllByRole('button', { name: /close controls panel/i });
    fireEvent.click(closeControlsButtons[0]);
    fireEvent.click(closeControlsButtons[1]);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
