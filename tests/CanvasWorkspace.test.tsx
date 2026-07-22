import { createRef, type ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CanvasWorkspace from '../src/components/CanvasWorkspace';
import type { Frame } from '../src/types';

jest.mock('react-rnd', () => ({
  Rnd: ({ children }: { children: ReactNode }) => <div data-testid="floating-inspector">{children}</div>,
}));

jest.mock('../src/components/SimulationCanvas', () => ({
  __esModule: true,
  default: () => <div data-testid="simulation-canvas" />,
}));

const boat = {
  id: 'boat-1',
  name: 'Alpha',
  color: '#38bdf8',
  x: 200,
  y: 350,
  heading: 0,
  sailAngle: 0,
};

const frame: Frame = {
  id: 'frame-1',
  name: 'Preparation',
  windAngle: 0,
  windSpeed: 12,
  boats: [boat],
  marks: [],
};

describe('CanvasWorkspace', () => {
  it('opens the contextual inspector without hiding the control panel', async () => {

    render(
      <CanvasWorkspace
        activeFrame={frame}
        inspectorFrame={frame}
        autoSailTrim
        canvasPosition={{ x: 0, y: 0 }}
        canvasZoom={1}
        constrainPosition={(position) => position}
        currentFrameIndex={0}
        displayMode="single"
        showFrameTitle
        showFrameNumber
        presenterMode={false}
        theme="dark"
        frames={[frame]}
        canRedo={false}
        canUndo={false}
        hasAutosave={false}
        getSnappedPosition={(_, position) => position}
        gridSnapEnabled
        isPlaying={false}
        isExporting={false}
        handleCanvasDragEnd={jest.fn()}
        handleCanvasTouchEnd={jest.fn()}
        handleCanvasTouchMove={jest.fn()}
        handleCanvasTouchStart={jest.fn()}
        handleCanvasWheel={jest.fn()}
        maxZoom={2}
        minZoom={0.5}
        onAddArrow={jest.fn()}
        onMoveBoat={jest.fn()}
        onRotateBoat={jest.fn()}
        onMoveMark={jest.fn()}
        onMoveArrow={jest.fn()}
        onMoveComment={jest.fn()}
        onMoveImage={jest.fn()}
        onDeleteSelected={jest.fn()}
        onDuplicateSelected={jest.fn()}
        onClearSelection={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetDisplayMode={jest.fn()}
        onSetShowFrameTitle={jest.fn()}
        onSetShowFrameNumber={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetShowGrid={jest.fn()}
        onRedo={jest.fn()}
        onRestoreAutosave={jest.fn()}
        onTogglePlaying={jest.fn()}
        onUndo={jest.fn()}
        onSetPlaySpeed={jest.fn()}
        playSpeed={1000}
        onPanCanvasBy={jest.fn()}
        onOpenControls={jest.fn()}
        onSelectObject={jest.fn()}
        inspectorRequest={{ id: 'boat-1', type: 'boat', requestId: 1 }}
        onSnapPreview={jest.fn()}
        onZoomIn={jest.fn()}
        onZoomOut={jest.fn()}
        onAutoZoom={jest.fn()}
        onResetZoom={jest.fn()}
        selectedId="boat-1"
        selectedType="boat"
        selectedBoat={boat}
        selectedMark={undefined}
        selectedArrow={undefined}
        selectedComment={undefined}
        selectedImage={undefined}
        updateBoat={jest.fn()}
        updateActiveFrame={jest.fn()}
        updateMark={jest.fn()}
        canvasWrapRef={createRef<HTMLDivElement>()}
        showGrid
        snapTarget={null}
        stageRef={createRef()}
        stageSize={{ width: 1000, height: 800 }}
      />,
    );

    await waitFor(() => expect(screen.getByTestId('floating-inspector')).toBeInTheDocument());
    expect(screen.getByTestId('floating-inspector')).toBeInTheDocument();
    expect(screen.getByText('Inspector')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open color picker' }));
    expect(screen.getByRole('dialog', { name: 'Color picker' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Color picker' })).not.toBeInTheDocument());
    expect(screen.getByTestId('floating-inspector')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByTestId('floating-inspector')).not.toBeInTheDocument());
  });

  it('allows the playback warning toast to be dismissed', () => {
    render(
      <CanvasWorkspace
        activeFrame={frame}
        inspectorFrame={frame}
        autoSailTrim
        canvasPosition={{ x: 0, y: 0 }}
        canvasZoom={1}
        constrainPosition={(position) => position}
        currentFrameIndex={0}
        displayMode="single"
        showFrameTitle
        showFrameNumber
        presenterMode={false}
        theme="dark"
        frames={[frame]}
        canRedo={false}
        canUndo={false}
        hasAutosave={false}
        getSnappedPosition={(_, position) => position}
        gridSnapEnabled
        isPlaying={false}
        playbackWarning="The boat cannot complete this manoeuvre."
        isExporting={false}
        handleCanvasDragEnd={jest.fn()}
        handleCanvasTouchEnd={jest.fn()}
        handleCanvasTouchMove={jest.fn()}
        handleCanvasTouchStart={jest.fn()}
        handleCanvasWheel={jest.fn()}
        maxZoom={2}
        minZoom={0.5}
        onAddArrow={jest.fn()}
        onMoveBoat={jest.fn()}
        onRotateBoat={jest.fn()}
        onMoveMark={jest.fn()}
        onMoveArrow={jest.fn()}
        onMoveComment={jest.fn()}
        onMoveImage={jest.fn()}
        onDeleteSelected={jest.fn()}
        onDuplicateSelected={jest.fn()}
        onClearSelection={jest.fn()}
        onSetAutoSailTrim={jest.fn()}
        onSetDisplayMode={jest.fn()}
        onSetShowFrameTitle={jest.fn()}
        onSetShowFrameNumber={jest.fn()}
        onSetGridSnapEnabled={jest.fn()}
        onSetShowGrid={jest.fn()}
        onRedo={jest.fn()}
        onRestoreAutosave={jest.fn()}
        onTogglePlaying={jest.fn()}
        onUndo={jest.fn()}
        onSetPlaySpeed={jest.fn()}
        playSpeed={1000}
        onPanCanvasBy={jest.fn()}
        onOpenControls={jest.fn()}
        onSelectObject={jest.fn()}
        onSnapPreview={jest.fn()}
        onZoomIn={jest.fn()}
        onZoomOut={jest.fn()}
        onAutoZoom={jest.fn()}
        onResetZoom={jest.fn()}
        selectedId={null}
        selectedType={null}
        selectedBoat={undefined}
        selectedMark={undefined}
        updateBoat={jest.fn()}
        updateActiveFrame={jest.fn()}
        updateMark={jest.fn()}
        canvasWrapRef={createRef<HTMLDivElement>()}
        showGrid
        snapTarget={null}
        stageRef={createRef()}
        stageSize={{ width: 1000, height: 800 }}
      />,
    );

    expect(screen.getByText('The boat cannot complete this manoeuvre.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss playback warning' }));
    expect(screen.queryByText('The boat cannot complete this manoeuvre.')).not.toBeInTheDocument();
  });
});
