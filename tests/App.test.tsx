import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import type { Frame, ScenarioExportPayload } from '../src/types';

const mockFitCanvasToContent = jest.fn();
const mockImportScenario = jest.fn();
const mockParseScenarioFromJson = jest.fn();
const mockParseScenarioShareUrlAsync = jest.fn();
const mockScenarioPayloadFromTemplate = jest.fn();
const mockTemplate = {
  id: 'template-one',
  title: 'Template One',
  frames: [],
};

const createFrame = (id: string, x: number, y: number, comment?: boolean): Frame => ({
  id,
  name: id,
  windAngle: 0,
  windSpeed: 12,
  boats: [],
  marks: [{ id: `${id}-mark`, name: 'Mark', color: '#fff', x, y, shape: 'circle', size: 20 }],
  comments: comment
    ? [{ id: `${id}-note`, name: 'Note', text: 'Loaded note', color: '#fff', x: x + 200, y: y + 20, width: 240 }]
    : [],
});

const baseFrame = createFrame('base', 100, 100);
const initialScenarioPayload: ScenarioExportPayload = {
  version: 2,
  currentFrameIndex: 0,
  settings: { displayMode: 'single', presenterMode: false },
  frames: [baseFrame],
};
const loadedScenarioPayload: ScenarioExportPayload = {
  version: 2,
  currentFrameIndex: 1,
  settings: { displayMode: 'single', presenterMode: false },
  frames: [
    createFrame('previous', 100, 100),
    createFrame('current', 300, 200, true),
    createFrame('hidden', 2000, 2000, true),
  ],
};

const mockScenario = {
  activeFrame: baseFrame,
  autoSailTrim: true,
  canRedo: false,
  canUndo: false,
  currentFrameIndex: 0,
  displayFrame: baseFrame,
  frames: [baseFrame],
  hasAutosave: false,
  hasUnsavedChanges: false,
  importScenario: mockImportScenario,
  isPlaying: false,
  libraryItems: [],
  playbackProgress: 0,
  playbackWarning: null,
  playSpeed: 2000,
  selectedArrow: undefined,
  selectedBoat: undefined,
  selectedComment: undefined,
  selectedConnection: undefined,
  selectedId: null,
  selectedImage: undefined,
  selectedMark: undefined,
  selectedType: null,
  settings: initialScenarioPayload.settings!,
  unanimatableTransitionIndices: [],
  addArrow: jest.fn(),
  addBoat: jest.fn(),
  addComment: jest.fn(),
  addFrame: jest.fn(),
  addImage: jest.fn(),
  addMark: jest.fn(),
  addRuleComment: jest.fn(),
  clearSelection: jest.fn(),
  connectMarks: jest.fn(),
  createNewScenario: jest.fn(),
  deleteFrame: jest.fn(),
  deleteSelected: jest.fn(),
  duplicateFrame: jest.fn(),
  duplicateSelected: jest.fn(),
  fixTransition: jest.fn(),
  loadFromLibrary: jest.fn(),
  moveArrow: jest.fn(),
  moveBoat: jest.fn(),
  moveComment: jest.fn(),
  moveImage: jest.fn(),
  moveMark: jest.fn(),
  onSetDisplayMode: jest.fn(),
  redo: jest.fn(),
  removeMarkConnection: jest.fn(),
  renameFrame: jest.fn(),
  replaceMarkConnection: jest.fn(),
  restoreAutosave: jest.fn(),
  selectFrame: jest.fn(),
  selectObject: jest.fn(),
  setAutoSailTrim: jest.fn(),
  setCurrentFrameIndex: jest.fn(),
  setIsPlaybackSampling: jest.fn(),
  setIsPlaying: jest.fn(),
  setPlaySpeed: jest.fn(),
  setPlaybackProgress: jest.fn(),
  stepBackward: jest.fn(),
  stepForward: jest.fn(),
  undo: jest.fn(),
  updateActiveFrame: jest.fn(),
  updateArrow: jest.fn(),
  updateBoat: jest.fn(),
  updateComment: jest.fn(),
  updateConnection: jest.fn(),
  updateImage: jest.fn(),
  updateMark: jest.fn(),
  updateRuleComment: jest.fn(),
  updateSettings: jest.fn(),
};

const mockViewport = {
  canvasPosition: { x: 0, y: 0 },
  canvasWrapRef: { current: null },
  canvasZoom: 1,
  constrainPosition: (position: { x: number; y: number }) => position,
  fitCanvasToContent: mockFitCanvasToContent,
  handleCanvasDragEnd: jest.fn(),
  handleCanvasTouchEnd: jest.fn(),
  handleCanvasTouchMove: jest.fn(),
  handleCanvasTouchStart: jest.fn(),
  handleCanvasWheel: jest.fn(),
  maxZoom: 3,
  minZoom: 0.5,
  panCanvasBy: jest.fn(),
  resetCanvasZoom: jest.fn(),
  setCanvasViewport: jest.fn(),
  stageRef: { current: null },
  stageSize: { width: 360, height: 640 },
  zoomCanvasFromCenter: jest.fn(),
};

jest.mock('../src/hooks/useScenario', () => {
  const { useState } = require('react') as typeof import('react');

  return {
    useScenario: () => {
      const [importedScenario, setImportedScenario] = useState<ScenarioExportPayload | null>(null);
      const activeFrame = importedScenario?.frames[importedScenario.currentFrameIndex]
        ?? importedScenario?.frames[0]
        ?? mockScenario.activeFrame;

      return {
        ...mockScenario,
        activeFrame,
        currentFrameIndex: importedScenario?.currentFrameIndex ?? mockScenario.currentFrameIndex,
        displayFrame: activeFrame,
        frames: importedScenario?.frames ?? mockScenario.frames,
        importScenario: (payload: ScenarioExportPayload) => {
          mockImportScenario(payload);
          setImportedScenario(payload);
        },
        settings: importedScenario?.settings ?? mockScenario.settings,
      };
    },
  };
});

jest.mock('../src/hooks/useCanvasViewport', () => ({
  useCanvasViewport: () => mockViewport,
}));

jest.mock('../src/hooks/useGridSnap', () => ({
  useGridSnap: () => ({
    getSnappedPosition: (_objectId: string, position: { x: number; y: number }) => position,
    setSnapPreview: jest.fn(),
    snapTarget: null,
  }),
}));

jest.mock('../src/hooks/useScenarioExport', () => ({
  useScenarioExport: () => ({
    exportProgress: 0,
    exportType: null,
    isExporting: false,
    triggerExport: jest.fn(),
    triggerImageExport: jest.fn(),
    triggerJsonExport: jest.fn(),
  }),
}));

jest.mock('../src/data/situationTemplates', () => ({
  situationTemplates: [mockTemplate],
  scenarioPayloadFromTemplate: mockScenarioPayloadFromTemplate,
}));

jest.mock('../src/utils/exporter', () => ({
  createScenarioShareUrlAsync: jest.fn(),
  parseScenarioFromJson: (...args: unknown[]) => mockParseScenarioFromJson(...args),
  parseScenarioShareUrlAsync: (...args: unknown[]) => mockParseScenarioShareUrlAsync(...args),
}));

jest.mock('../src/utils/templateContribution', () => ({
  parseTemplateRepository: jest.fn(() => undefined),
}));

jest.mock('../src/utils/appConfig', () => ({
  sponsorshipLinks: {},
  templateRepository: undefined,
}));

jest.mock('../src/components/AppHeader', () => ({
  __esModule: true,
  default: ({ onImportJson, onLoadTemplate }: {
    onImportJson: (file: File) => void;
    onLoadTemplate?: (template: typeof mockTemplate) => void;
  }) => (
    <header>
      <button type="button" onClick={() => onLoadTemplate?.(mockTemplate)}>Load template</button>
      <input
        aria-label="Import JSON"
        type="file"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) onImportJson(file);
        }}
      />
    </header>
  ),
}));

jest.mock('../src/components/AboutPage', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/components/CanvasWorkspace', () => ({ __esModule: true, default: () => <div data-testid="canvas-workspace" /> }));
jest.mock('../src/components/ExportOverlay', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/components/NewScenarioDialog', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/components/Sidebar', () => ({ __esModule: true, default: () => <aside data-testid="scenario-sidebar" /> }));
jest.mock('../src/components/TemplateContributionDialog', () => ({ __esModule: true, default: () => null }));

const App = require('../src/App').default;

describe('App loaded scenario viewport fitting', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockFitCanvasToContent.mockReset();
    jest.spyOn(window, 'alert').mockImplementation(() => undefined);
    mockParseScenarioShareUrlAsync.mockResolvedValue(null);
    mockScenarioPayloadFromTemplate.mockReturnValue(loadedScenarioPayload);
    mockParseScenarioFromJson.mockReturnValue(loadedScenarioPayload);
    mockScenario.settings = { ...initialScenarioPayload.settings! };
  });

  it('fits the visible template content, including notes', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Load template' }));

    expect(mockImportScenario).toHaveBeenCalledWith(loadedScenarioPayload);
    expect(mockFitCanvasToContent).toHaveBeenCalledTimes(1);
    expect(mockFitCanvasToContent.mock.calls[0][0]).toMatchObject({
      maxX: 740,
      maxY: 284,
    });
  });

  it('fits after a presenter-mode import has rendered the sidebar', () => {
    mockScenario.settings = { ...initialScenarioPayload.settings!, presenterMode: true };
    let sawSidebarWhenFitting = false;
    mockFitCanvasToContent.mockImplementation(() => {
      sawSidebarWhenFitting = Boolean(screen.queryByTestId('scenario-sidebar'));
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Load template' }));

    expect(sawSidebarWhenFitting).toBe(true);
  });

  it('fits imported JSON content and leaves the viewport unchanged for invalid JSON', async () => {
    render(<App />);
    const file = new File(['scenario'], 'scenario.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: jest.fn().mockResolvedValue('scenario') });

    fireEvent.change(screen.getByLabelText('Import JSON'), { target: { files: [file] } });
    await waitFor(() => expect(mockImportScenario).toHaveBeenCalledWith(loadedScenarioPayload));
    expect(mockFitCanvasToContent).toHaveBeenCalledTimes(1);

    mockParseScenarioFromJson.mockImplementation(() => {
      throw new Error('Invalid scenario');
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const invalidFile = new File(['invalid'], 'invalid.json', { type: 'application/json' });
    Object.defineProperty(invalidFile, 'text', { value: jest.fn().mockResolvedValue('invalid') });
    fireEvent.change(screen.getByLabelText('Import JSON'), { target: { files: [invalidFile] } });

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Could not import scenario. Please select a valid Tack Wise JSON file.'));
    expect(mockFitCanvasToContent).toHaveBeenCalledTimes(1);
  });

  it('fits a share-linked scenario after it resolves', async () => {
    mockParseScenarioShareUrlAsync.mockResolvedValue(loadedScenarioPayload);

    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    await waitFor(() => expect(mockImportScenario).toHaveBeenCalledWith(loadedScenarioPayload));
    expect(mockFitCanvasToContent).toHaveBeenCalledTimes(1);
    expect(mockFitCanvasToContent.mock.calls[0][0]).toMatchObject({
      maxX: 740,
      maxY: 284,
    });
  });
});
