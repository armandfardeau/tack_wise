import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Layer, Rect, Stage, Circle, Group, Line } from 'react-konva';
import type { Boat as BoatModel, Mark as MarkModel, Frame as FrameModel } from './types';
import Boat from './components/Boat';
import Mark from './components/Mark';
import WindIndicator from './components/WindIndicator';
import { exportToGif, downloadBlob } from './utils/exporter';
import './App.css';

// Preset colors for boats & marks
const BOAT_COLORS = ['#38bdf8', '#f87171', '#4ade80', '#fbbf24', '#c084fc', '#fb7185', '#2dd4bf'];
const MARK_COLORS = ['#ef4444', '#22c55e', '#f97316', '#eab308'];

// Helper to calculate realistic automatic sail angle based on wind direction and boat heading
function calculateAutoSailAngle(heading: number, windAngle: number): number {
  // windAngle is where wind is coming FROM.
  // relativeWind is the angle of wind relative to the boat (0 = wind on bow, 180 = wind on stern)
  let relativeWind = (windAngle - heading) % 360;
  if (relativeWind < 0) relativeWind += 360;

  // If wind is coming from starboard (0 to 180), sail should blow to port (negative angle)
  // If wind is coming from port (180 to 360), sail should blow to starboard (positive angle)
  const isStarboardTack = relativeWind > 180; 

  // How close is the boat to the wind?
  // 0 or 360 = directly into wind. 180 = dead downwind.
  const angleToWind = Math.min(relativeWind, 360 - relativeWind);

  let trimAngle = 0;
  if (angleToWind < 40) {
    // In irons / head to wind: sail flapping in the middle
    trimAngle = 2;
  } else if (angleToWind < 50) {
    // Close hauled
    trimAngle = 12;
  } else if (angleToWind < 90) {
    // Reaching
    trimAngle = 35;
  } else if (angleToWind < 135) {
    // Broad reaching
    trimAngle = 55;
  } else {
    // Running (downwind)
    trimAngle = 75;
  }

  return isStarboardTack ? -trimAngle : trimAngle;
}

const CONNECTION_LINE_DASH: Record<
  NonNullable<MarkModel['connectionLineStyle']>,
  number[] | undefined
> = {
  dotted: [4, 6],
  dashed: [12, 6],
  solid: undefined,
};

function getConnectionLineDash(style?: MarkModel['connectionLineStyle']) {
  return CONNECTION_LINE_DASH[style ?? 'dotted'];
}

const MIN_CANVAS_ZOOM = 0.5;
const MAX_CANVAS_ZOOM = 3;
const CANVAS_ZOOM_STEP = 1.2;
const GRID_SPACING = 40;
const GRID_SNAP_RADIUS = GRID_SPACING * 0.45;

function getGridSnap(position: { x: number; y: number }) {
  const x = Math.round(position.x / GRID_SPACING) * GRID_SPACING;
  const y = Math.round(position.y / GRID_SPACING) * GRID_SPACING;

  return {
    x,
    y,
    distance: Math.hypot(position.x - x, position.y - y),
  };
}

function renderPlacementGrid(stageSize: { width: number; height: number }) {
  const verticalLineCount = Math.ceil(stageSize.width / GRID_SPACING) + 1;
  const horizontalLineCount = Math.ceil(stageSize.height / GRID_SPACING) + 1;

  return (
    <>
      {Array.from({ length: verticalLineCount }, (_, index) => {
        const x = index * GRID_SPACING;
        const isMajorLine = index % 5 === 0;

        return (
          <Line
            key={`grid-v-${x}`}
            points={[x, 0, x, stageSize.height]}
            stroke={isMajorLine ? '#155e75' : '#1e3a4f'}
            strokeWidth={isMajorLine ? 1.5 : 1}
            opacity={isMajorLine ? 0.42 : 0.28}
            listening={false}
          />
        );
      })}
      {Array.from({ length: horizontalLineCount }, (_, index) => {
        const y = index * GRID_SPACING;
        const isMajorLine = index % 5 === 0;

        return (
          <Line
            key={`grid-h-${y}`}
            points={[0, y, stageSize.width, y]}
            stroke={isMajorLine ? '#155e75' : '#1e3a4f'}
            strokeWidth={isMajorLine ? 1.5 : 1}
            opacity={isMajorLine ? 0.42 : 0.28}
            listening={false}
          />
        );
      })}
    </>
  );
}

function clampCanvasZoom(zoom: number) {
  return Math.min(Math.max(zoom, MIN_CANVAS_ZOOM), MAX_CANVAS_ZOOM);
}

function constrainCanvasPosition(
  position: { x: number; y: number },
  zoom: number,
  stageSize: { width: number; height: number }
) {
  const horizontalRange = stageSize.width - stageSize.width * zoom;
  const verticalRange = stageSize.height - stageSize.height * zoom;

  return {
    x: Math.min(Math.max(position.x, Math.min(0, horizontalRange)), Math.max(0, horizontalRange)),
    y: Math.min(Math.max(position.y, Math.min(0, verticalRange)), Math.max(0, verticalRange)),
  };
}

function renderMarkConnections(
  marks: MarkModel[],
  options?: { isShadow?: boolean; highlightMarkId?: string | null }
) {
  const markById = new Map(marks.map((m) => [m.id, m]));

  return marks.flatMap((mark) => {
    if (!mark.connectedToMarkId) return [];

    const target = markById.get(mark.connectedToMarkId);
    if (!target) return [];

    const isHighlighted =
      !options?.isShadow &&
      (options?.highlightMarkId === mark.id || options?.highlightMarkId === target.id);
    const lineColor = mark.connectionLineColor ?? mark.color;

    return [
      <Line
        key={`conn-${mark.id}-${target.id}`}
        points={[mark.x, mark.y, target.x, target.y]}
        stroke={options?.isShadow ? '#94a3b8' : lineColor}
        strokeWidth={isHighlighted ? 2.5 : 1.5}
        dash={getConnectionLineDash(mark.connectionLineStyle)}
        opacity={options?.isShadow ? 0.22 : 1}
        listening={false}
      />,
    ];
  });
}

// Initial default scenario
const initialFrames: FrameModel[] = [
  {
    id: 'frame-1',
    name: '1. Preparation',
    windAngle: 0, // Wind from North
    windSpeed: 12,
    boats: [
      { id: 'boat-1', name: 'Alpha', color: '#38bdf8', x: 200, y: 350, heading: 45, sailAngle: -12 },
      { id: 'boat-2', name: 'Bravo', color: '#f87171', x: 400, y: 350, heading: 315, sailAngle: 12 },
    ],
    marks: [
      { id: 'mark-1', name: 'Windward Mark', color: '#ef4444', x: 300, y: 120, shape: 'triangle' },
      { id: 'mark-2', name: 'Pin End', color: '#22c55e', x: 450, y: 400, shape: 'circle' },
      { id: 'mark-3', name: 'Committee Boat', color: '#eab308', x: 150, y: 400, shape: 'square' },
    ],
  },
  {
    id: 'frame-2',
    name: '2. Upwind Tack',
    windAngle: 0,
    windSpeed: 12,
    boats: [
      { id: 'boat-1', name: 'Alpha', color: '#38bdf8', x: 260, y: 280, heading: 45, sailAngle: -12 },
      { id: 'boat-2', name: 'Bravo', color: '#f87171', x: 340, y: 280, heading: 315, sailAngle: 12 },
    ],
    marks: [
      { id: 'mark-1', name: 'Windward Mark', color: '#ef4444', x: 300, y: 120, shape: 'triangle' },
      { id: 'mark-2', name: 'Pin End', color: '#22c55e', x: 450, y: 400, shape: 'circle' },
      { id: 'mark-3', name: 'Committee Boat', color: '#eab308', x: 150, y: 400, shape: 'square' },
    ],
  },
  {
    id: 'frame-3',
    name: '3. Meeting at Mark',
    windAngle: 10, // Subtle wind shift
    windSpeed: 14,
    boats: [
      { id: 'boat-1', name: 'Alpha', color: '#38bdf8', x: 290, y: 160, heading: 45, sailAngle: -12 },
      { id: 'boat-2', name: 'Bravo', color: '#f87171', x: 310, y: 160, heading: 315, sailAngle: 12 },
    ],
    marks: [
      { id: 'mark-1', name: 'Windward Mark', color: '#ef4444', x: 300, y: 120, shape: 'triangle' },
      { id: 'mark-2', name: 'Pin End', color: '#22c55e', x: 450, y: 400, shape: 'circle' },
      { id: 'mark-3', name: 'Committee Boat', color: '#eab308', x: 150, y: 400, shape: 'square' },
    ],
  },
  {
    id: 'frame-4',
    name: '4. Rounding Mark',
    windAngle: 10,
    windSpeed: 14,
    boats: [
      { id: 'boat-1', name: 'Alpha', color: '#38bdf8', x: 300, y: 90, heading: 120, sailAngle: -60 },
      { id: 'boat-2', name: 'Bravo', color: '#f87171', x: 330, y: 120, heading: 90, sailAngle: -45 },
    ],
    marks: [
      { id: 'mark-1', name: 'Windward Mark', color: '#ef4444', x: 300, y: 120, shape: 'triangle' },
      { id: 'mark-2', name: 'Pin End', color: '#22c55e', x: 450, y: 400, shape: 'circle' },
      { id: 'mark-3', name: 'Committee Boat', color: '#eab308', x: 150, y: 400, shape: 'square' },
    ],
  },
];

export default function App() {
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<any>(null);

  // States
  const [stageSize, setStageSize] = useState({ width: 720, height: 500 });
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [frames, setFrames] = useState<FrameModel[]>(initialFrames);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>('boat-1');
  const [selectedType, setSelectedType] = useState<'boat' | 'mark' | null>('boat');
  
  // Simulation play state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // ms per frame
  const playIntervalRef = useRef<any>(null);

  // Exporter progress
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<'gif' | 'mp4' | null>(null);

  // Auto sail calculation flag
  const [autoSailTrim, setAutoSailTrim] = useState(true);

  // Placement grid controls
  const [showGrid, setShowGrid] = useState(true);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(true);

  // ── Magnetic-snap state ──────────────────────────────────────────────────
  // The preview is shared by boats and marks so either object type gets the
  // same visual feedback while it is being dragged.
  const [snapTarget, setSnapTarget] = useState<{
    objectId: string;
    x: number;
    y: number;
    active: boolean; // true when within snap radius
  } | null>(null);

  const setSnapPreview = (nextTarget: {
    objectId: string;
    x: number;
    y: number;
    active: boolean;
  } | null) => {
    setSnapTarget((previousTarget) => {
      if (!nextTarget && !previousTarget) return previousTarget;
      if (
        nextTarget &&
        previousTarget &&
        nextTarget.objectId === previousTarget.objectId &&
        nextTarget.x === previousTarget.x &&
        nextTarget.y === previousTarget.y &&
        nextTarget.active === previousTarget.active
      ) {
        return previousTarget;
      }
      return nextTarget;
    });
  };

  const getGridSnappedPosition = (objectId: string, rawPosition: { x: number; y: number }) => {
    if (!gridSnapEnabled) {
      setSnapPreview(null);
      return rawPosition;
    }

    const gridSnap = getGridSnap(rawPosition);
    if (gridSnap.distance <= GRID_SNAP_RADIUS) {
      setSnapPreview({
        objectId,
        x: gridSnap.x,
        y: gridSnap.y,
        active: true,
      });
      return { x: gridSnap.x, y: gridSnap.y };
    }

    setSnapPreview(null);
    return rawPosition;
  };

  const activeFrame = frames[currentFrameIndex] || frames[0];

  const zoomCanvasAtPoint = (requestedZoom: number, point: { x: number; y: number }) => {
    const nextZoom = clampCanvasZoom(requestedZoom);
    const worldPoint = {
      x: (point.x - canvasPosition.x) / canvasZoom,
      y: (point.y - canvasPosition.y) / canvasZoom,
    };

    setCanvasPosition(
      constrainCanvasPosition(
        {
          x: point.x - worldPoint.x * nextZoom,
          y: point.y - worldPoint.y * nextZoom,
        },
        nextZoom,
        stageSize
      )
    );
    setCanvasZoom(nextZoom);
  };

  const zoomCanvasFromCenter = (factor: number) => {
    zoomCanvasAtPoint(canvasZoom * factor, {
      x: stageSize.width / 2,
      y: stageSize.height / 2,
    });
  };

  const resetCanvasZoom = () => {
    setCanvasZoom(1);
    setCanvasPosition({ x: 0, y: 0 });
  };

  const handleCanvasWheel = (event: any) => {
    event.evt.preventDefault();
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;

    const factor = event.evt.deltaY > 0 ? 1 / CANVAS_ZOOM_STEP : CANVAS_ZOOM_STEP;
    zoomCanvasAtPoint(canvasZoom * factor, pointer);
  };

  // Resize listener
  useEffect(() => {
    const canvasWrap = canvasWrapRef.current;
    if (!canvasWrap) return;

    const updateStageSize = () => {
      const { width, height } = canvasWrap.getBoundingClientRect();
      setStageSize({
        width: Math.max(Math.round(width), 320),
        height: Math.max(Math.round(height), 240),
      });
    };

    updateStageSize();
    const observer = new ResizeObserver(updateStageSize);
    observer.observe(canvasWrap);
    return () => observer.disconnect();
  }, []);

  // Handle Playback Interval
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentFrameIndex((prevIndex) => {
          if (prevIndex >= frames.length - 1) {
            return 0; // Loop around
          }
          return prevIndex + 1;
        });
      }, playSpeed);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, playSpeed, frames.length]);

  // Object queries
  const selectedBoat = activeFrame.boats.find((b) => b.id === selectedId);
  const selectedMark = activeFrame.marks.find((m) => m.id === selectedId);

  // Auto sail calculation side-effect
  useEffect(() => {
    if (autoSailTrim) {
      setFrames((prevFrames) =>
        prevFrames.map((frame) => ({
          ...frame,
          boats: frame.boats.map((b) => ({
            ...b,
            sailAngle: calculateAutoSailAngle(b.heading, frame.windAngle),
          })),
        }))
      );
    }
  }, [autoSailTrim, activeFrame.windAngle]);

  // Frame manipulation helpers
  const selectFrame = (index: number) => {
    setIsPlaying(false);
    setCurrentFrameIndex(index);
  };

  const addFrame = () => {
    setIsPlaying(false);
    const newId = `frame-${Date.now()}`;
    const newFrame: FrameModel = {
      ...activeFrame,
      id: newId,
      name: `Frame ${frames.length + 1}`,
      boats: activeFrame.boats.map((b) => ({ ...b })),
      marks: activeFrame.marks.map((m) => ({ ...m })),
    };
    setFrames([...frames, newFrame]);
    setCurrentFrameIndex(frames.length);
  };

  const duplicateFrame = () => {
    setIsPlaying(false);
    const newId = `frame-${Date.now()}`;
    const newFrame: FrameModel = {
      ...activeFrame,
      id: newId,
      name: `${activeFrame.name} (Copy)`,
      boats: activeFrame.boats.map((b) => ({ ...b })),
      marks: activeFrame.marks.map((m) => ({ ...m })),
    };
    const nextFrames = [...frames];
    nextFrames.splice(currentFrameIndex + 1, 0, newFrame);
    setFrames(nextFrames);
    setCurrentFrameIndex(currentFrameIndex + 1);
  };

  const deleteFrame = (indexToDelete: number) => {
    if (frames.length <= 1) return;
    setIsPlaying(false);
    const nextFrames = frames.filter((_, i) => i !== indexToDelete);
    setFrames(nextFrames);
    setCurrentFrameIndex(Math.max(0, indexToDelete - 1));
  };

  const updateActiveFrame = (changes: Partial<FrameModel>) => {
    setFrames((prev) =>
      prev.map((f, idx) => (idx === currentFrameIndex ? { ...f, ...changes } : f))
    );
  };

  // Modify individual boat in the active frame
  const updateBoat = (boatId: string, changes: Partial<BoatModel>) => {
    setFrames((prev) =>
      prev.map((f, idx) => {
        if (idx !== currentFrameIndex) return f;
        return {
          ...f,
          boats: f.boats.map((b) => {
            if (b.id !== boatId) return b;
            const updated = { ...b, ...changes };
            // Auto compute sail if needed
            if (autoSailTrim && (changes.heading !== undefined || changes.sailAngle === undefined)) {
              updated.sailAngle = calculateAutoSailAngle(
                updated.heading,
                f.windAngle
              );
            }
            return updated;
          }),
        };
      })
    );
  };

  // Modify individual mark in the active frame
  const updateMark = (markId: string, changes: Partial<MarkModel>) => {
    setFrames((prev) =>
      prev.map((f, idx) => {
        if (idx !== currentFrameIndex) return f;
        return {
          ...f,
          marks: f.marks.map((m) => (m.id === markId ? { ...m, ...changes } : m)),
        };
      })
    );
  };

  // Add Boat to current scenario
  const handleAddBoat = () => {
    const nextColor = BOAT_COLORS[activeFrame.boats.length % BOAT_COLORS.length];
    const newBoat: BoatModel = {
      id: `boat-${Date.now()}`,
      name: `Boat ${activeFrame.boats.length + 1}`,
      color: nextColor,
      x: 100 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      heading: 0,
      sailAngle: 0,
    };
    
    // Add to all frames to keep object consistency across scenario
    setFrames((prev) =>
      prev.map((f) => ({
        ...f,
        boats: [...f.boats, { ...newBoat, sailAngle: calculateAutoSailAngle(newBoat.heading, f.windAngle) }],
      }))
    );
    setSelectedId(newBoat.id);
    setSelectedType('boat');
  };

  // Add Mark to current scenario
  const handleAddMark = () => {
    const nextColor = MARK_COLORS[activeFrame.marks.length % MARK_COLORS.length];
    const newMark: MarkModel = {
      id: `mark-${Date.now()}`,
      name: `Mark ${activeFrame.marks.length + 1}`,
      color: nextColor,
      x: 150 + Math.random() * 300,
      y: 150 + Math.random() * 200,
      shape: 'circle',
    };

    // Add to all frames
    setFrames((prev) =>
      prev.map((f) => ({
        ...f,
        marks: [...f.marks, { ...newMark }],
      }))
    );
    setSelectedId(newMark.id);
    setSelectedType('mark');
  };

  // Delete Object
  const handleDeleteSelected = () => {
    if (!selectedId) return;

    setFrames((prev) =>
      prev.map((f) => ({
        ...f,
        boats: f.boats.filter((b) => b.id !== selectedId),
        marks: f.marks
          .filter((m) => m.id !== selectedId)
          .map((m) =>
            m.connectedToMarkId === selectedId ? { ...m, connectedToMarkId: null } : m
          ),
      }))
    );
    setSelectedId(null);
    setSelectedType(null);
  };

  // Export Sequence
  const triggerExport = async (type: 'gif' | 'mp4') => {
    setIsPlaying(false);
    setIsExporting(true);
    setExportType(type);
    setExportProgress(0);

    const capturedImages: string[] = [];
    const originalFrame = currentFrameIndex;

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const waitForPaint = () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

    try {
      if (type === 'gif') {
        // Capture frames one by one
        for (let i = 0; i < frames.length; i++) {
          flushSync(() => {
            setCurrentFrameIndex(i);
            setExportProgress(Math.round((i / frames.length) * 50));
          });
          await waitForPaint();
          
          const stage = stageRef.current;
          if (!stage) throw new Error('Canvas stage not found.');
          stage.draw();
          capturedImages.push(stage.toDataURL({ pixelRatio: 1.5 }));
        }

        setExportProgress(60);
        // Compile to GIF
        const gifBlob = await exportToGif(
          capturedImages,
          playSpeed / 1000,
          stageSize.width,
          stageSize.height
        );
        
        setExportProgress(90);
        downloadBlob(gifBlob, `regatta-simulation-${Date.now()}.gif`);
      } else {
        // MP4 / WebM recording
        const canvas = document.querySelector('.canvas-wrap canvas') as HTMLCanvasElement;
        if (!canvas) throw new Error('Canvas element not found.');

        // Stream creation
        const stream = canvas.captureStream(20); // 20 fps stream
        let recordedChunks: BlobPart[] = [];
        
        // Find supported mimetype
        const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? { mimeType: 'video/webm;codecs=vp9' }
          : MediaRecorder.isTypeSupported('video/webm')
          ? { mimeType: 'video/webm' }
          : { mimeType: '' }; // fallback to default

        const recorder = new MediaRecorder(stream, options);
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: recorder.mimeType || 'video/webm' });
          downloadBlob(blob, `regatta-simulation-${Date.now()}.webm`);
        };

        // Play sequence while recording
        setCurrentFrameIndex(0);
        await delay(300); // warm up
        recorder.start();

        for (let i = 0; i < frames.length; i++) {
          setCurrentFrameIndex(i);
          setExportProgress(Math.round((i / frames.length) * 100));
          // Wait for the duration of the frame playSpeed
          await delay(playSpeed); 
        }

        recorder.stop();
      }
    } catch (err) {
      console.error('Export error: ', err);
      alert('Could not export canvas. Please try again.');
    } finally {
      setCurrentFrameIndex(originalFrame);
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <main className="app-shell dark-theme">
      {/* Header */}
      <header className="app-header">
        <div className="branding">
          <span className="eyebrow">Tactical Sailing Simulator</span>
          <h1>Tack Wise ⛵</h1>
        </div>
        <div className="export-actions">
          <button
            type="button"
            className="action-btn gif-btn"
            onClick={() => triggerExport('gif')}
            disabled={isExporting}
          >
            📥 Export GIF
          </button>
          <button
            type="button"
            className="action-btn mp4-btn"
            onClick={() => triggerExport('mp4')}
            disabled={isExporting}
          >
            📹 Export Video (WebM)
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <section className="workspace">
        {/* Left Side: Inspector & Scenarios controls */}
        <aside className="step-panel">
          {/* Wind Controller */}
          <div className="control-section">
            <h3 className="section-title">🌬️ Wind Settings</h3>
            <div className="control-row">
              <label>
                <span>Direction: {activeFrame.windAngle}°</span>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={activeFrame.windAngle}
                  onChange={(e) => updateActiveFrame({ windAngle: parseInt(e.target.value) })}
                />
              </label>
            </div>
            <div className="control-row">
              <label>
                <span>Velocity: {activeFrame.windSpeed} kts</span>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={activeFrame.windSpeed}
                  onChange={(e) => updateActiveFrame({ windSpeed: parseInt(e.target.value) })}
                />
              </label>
            </div>
          </div>

          {/* Add Elements Buttons */}
          <div className="control-section inline-buttons">
            <button type="button" className="add-btn add-boat" onClick={handleAddBoat}>
              ⛵ Add Boat
            </button>
            <button type="button" className="add-btn add-mark" onClick={handleAddMark}>
              📍 Add Mark
            </button>
          </div>

          {/* Placement Grid */}
          <div className="control-section">
            <h3 className="section-title">🧲 Magnetic Grid</h3>
            <div className="form-row flex-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={gridSnapEnabled}
                  onChange={(e) => setGridSnapEnabled(e.target.checked)}
                />
                <span>Snap boats &amp; marks</span>
              </label>
            </div>
            <div className="form-row flex-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                <span>Show placement grid</span>
              </label>
            </div>
            <p className="grid-hint">{GRID_SPACING}px spacing · drag near an intersection</p>
          </div>

          {/* Selected Item Editor */}
          <div className="control-section inspector">
            <h3 className="section-title">🔍 Inspector</h3>
            
            {selectedType === 'boat' && selectedBoat ? (
              <div className="editor-form">
                <div className="form-row">
                  <label>Name</label>
                  <input
                    type="text"
                    value={selectedBoat.name}
                    onChange={(e) => updateBoat(selectedBoat.id, { name: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>Color</label>
                  <input
                    type="color"
                    value={selectedBoat.color}
                    onChange={(e) => updateBoat(selectedBoat.id, { color: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>Heading ({selectedBoat.heading}°)</label>
                  <input
                    type="range"
                    min="0"
                    max="359"
                    value={selectedBoat.heading}
                    onChange={(e) => updateBoat(selectedBoat.id, { heading: parseInt(e.target.value) })}
                  />
                </div>

                <div className="form-row flex-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={autoSailTrim}
                      onChange={(e) => setAutoSailTrim(e.target.checked)}
                    />
                    <span>Auto Sail Trim</span>
                  </label>
                </div>

                {!autoSailTrim && (
                  <div className="form-row">
                    <label>Sail Angle ({selectedBoat.sailAngle}°)</label>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      value={selectedBoat.sailAngle}
                      onChange={(e) => updateBoat(selectedBoat.id, { sailAngle: parseInt(e.target.value) })}
                    />
                  </div>
                )}

                <div className="form-row flex-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!selectedBoat.showHeadingLine}
                      onChange={(e) => updateBoat(selectedBoat.id, { showHeadingLine: e.target.checked })}
                    />
                    <span>Show Dotted Path Line</span>
                  </label>
                </div>

                <button type="button" className="delete-btn" onClick={handleDeleteSelected}>
                  🗑️ Delete Boat
                </button>
              </div>
            ) : selectedType === 'mark' && selectedMark ? (
              <div className="editor-form">
                <div className="form-row">
                  <label>Name</label>
                  <input
                    type="text"
                    value={selectedMark.name}
                    onChange={(e) => updateMark(selectedMark.id, { name: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>Color</label>
                  <input
                    type="color"
                    value={selectedMark.color}
                    onChange={(e) => updateMark(selectedMark.id, { color: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>Shape</label>
                  <select
                    value={selectedMark.shape}
                    onChange={(e) => updateMark(selectedMark.id, { shape: e.target.value as any })}
                  >
                    <option value="circle">Conical (Circle)</option>
                    <option value="triangle">Triangle (Conical/Buoy)</option>
                    <option value="square">Spar (Square)</option>
                  </select>
                </div>

                <div className="form-row flex-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!selectedMark.connectedToMarkId}
                      disabled={activeFrame.marks.length <= 1}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          updateMark(selectedMark.id, { connectedToMarkId: null });
                          return;
                        }
                        const otherMark = activeFrame.marks.find((m) => m.id !== selectedMark.id);
                        updateMark(selectedMark.id, {
                          connectedToMarkId: otherMark?.id ?? null,
                          connectionLineColor: selectedMark.connectionLineColor ?? selectedMark.color,
                          connectionLineStyle: selectedMark.connectionLineStyle ?? 'dotted',
                        });
                      }}
                    />
                    <span>Show Dotted Line to Mark</span>
                  </label>
                </div>

                {!!selectedMark.connectedToMarkId && (
                  <>
                    <div className="form-row">
                      <label>Connect to</label>
                      <select
                        value={selectedMark.connectedToMarkId}
                        onChange={(e) =>
                          updateMark(selectedMark.id, { connectedToMarkId: e.target.value })
                        }
                      >
                        {activeFrame.marks
                          .filter((m) => m.id !== selectedMark.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="form-row">
                      <label>Line Color</label>
                      <input
                        type="color"
                        value={selectedMark.connectionLineColor ?? selectedMark.color}
                        onChange={(e) =>
                          updateMark(selectedMark.id, { connectionLineColor: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-row">
                      <label>Line Style</label>
                      <select
                        value={selectedMark.connectionLineStyle ?? 'dotted'}
                        onChange={(e) =>
                          updateMark(selectedMark.id, {
                            connectionLineStyle: e.target.value as MarkModel['connectionLineStyle'],
                          })
                        }
                      >
                        <option value="dotted">Dotted</option>
                        <option value="dashed">Dashed</option>
                        <option value="solid">Solid</option>
                      </select>
                    </div>
                  </>
                )}

                <button type="button" className="delete-btn" onClick={handleDeleteSelected}>
                  🗑️ Delete Mark
                </button>
              </div>
            ) : (
              <p className="no-selection">Click a boat or mark on the canvas to inspect and edit its properties.</p>
            )}
          </div>
        </aside>

        {/* Center: Canvas Area & Timeline bottom */}
        <section className="canvas-container">
          <div ref={canvasWrapRef} className="canvas-wrap">
            <Stage
              ref={stageRef}
              width={stageSize.width}
              height={stageSize.height}
              x={canvasPosition.x}
              y={canvasPosition.y}
              scaleX={canvasZoom}
              scaleY={canvasZoom}
              draggable
              dragBoundFunc={(position) =>
                constrainCanvasPosition(position, canvasZoom, stageSize)
              }
              onDragEnd={() => {
                const stage = stageRef.current;
                if (!stage) return;
                setCanvasPosition({ x: stage.x(), y: stage.y() });
              }}
              onWheel={handleCanvasWheel}
            >
              {/* Layer 1: Water & Wind */}
              <Layer>
                {/* Oceanic Blue Sea */}
                <Rect width={stageSize.width} height={stageSize.height} fill="#0f172a" />

                {showGrid && renderPlacementGrid(stageSize)}
                
                {/* Wind flow lines overlay */}
                <WindIndicator
                  windAngle={activeFrame.windAngle}
                  windSpeed={activeFrame.windSpeed}
                  stageSize={stageSize}
                />
              </Layer>

              {/* Layer 2: Marks & Boats */}
              <Layer>
                {/* Render Shadow View of previous frame (f-1) if it exists */}
                {currentFrameIndex > 0 && frames[currentFrameIndex - 1] && (
                  <>
                    {renderMarkConnections(frames[currentFrameIndex - 1].marks, { isShadow: true })}
                    {frames[currentFrameIndex - 1].marks.map((mark) => (
                      <Mark
                        key={`shadow-${mark.id}`}
                        mark={mark}
                        isSelected={false}
                        isShadow={true}
                      />
                    ))}
                    {frames[currentFrameIndex - 1].boats.map((boat) => (
                      <Boat
                        key={`shadow-${boat.id}`}
                        boat={boat}
                        isSelected={false}
                        isShadow={true}
                      />
                    ))}
                  </>
                )}

                {renderMarkConnections(activeFrame.marks, {
                  highlightMarkId: selectedType === 'mark' ? selectedId : null,
                })}

                {/* Render Marks */}
                {activeFrame.marks.map((mark) => (
                  <Mark
                    key={mark.id}
                    mark={mark}
                    isSelected={selectedId === mark.id}
                    snapFn={(pos) => getGridSnappedPosition(mark.id, pos)}
                    onSelect={(id) => {
                      setSelectedId(id);
                      setSelectedType('mark');
                      setSnapPreview(null);
                    }}
                    onMove={(id, pos) => {
                      setSnapPreview(null);
                      updateMark(id, pos);
                    }}
                  />
                ))}

                {/* Render Boats */}
                {activeFrame.boats.map((boat) => {
                  const snapFn = gridSnapEnabled
                    ? (rawPos: { x: number; y: number }) =>
                        getGridSnappedPosition(boat.id, rawPos)
                    : undefined;

                  return (
                    <Boat
                      key={boat.id}
                      boat={boat}
                      isSelected={selectedId === boat.id}
                      snapFn={snapFn}
                      onSelect={(id) => {
                        setSelectedId(id);
                        setSelectedType('boat');
                        setSnapPreview(null);
                      }}
                      onMove={(id, pos) => {
                        setSnapPreview(null);
                        updateBoat(id, pos); // pos is already snapped via dragBoundFunc
                      }}
                    />
                  );
                })}
              </Layer>

              {/* Layer 3: Snap Indicator */}
              <Layer listening={false}>
                {snapTarget && (
                  <Group x={snapTarget.x} y={snapTarget.y}>
                    {/* Outer pulsing ring */}
                    <Circle
                      radius={22}
                      fill="transparent"
                      stroke={snapTarget.active ? '#06b6d4' : '#475569'}
                      strokeWidth={2}
                      dash={[4, 4]}
                      opacity={snapTarget.active ? 0.9 : 0.4}
                    />
                    {/* Inner dot */}
                    <Circle
                      radius={5}
                      fill={snapTarget.active ? '#06b6d4' : '#475569'}
                      opacity={snapTarget.active ? 1 : 0.5}
                    />
                    {/* Magnet crosshair lines */}
                    <Line points={[-14, 0, 14, 0]} stroke={snapTarget.active ? '#06b6d4' : '#475569'} strokeWidth={1.5} opacity={0.6} />
                    <Line points={[0, -14, 0, 14]} stroke={snapTarget.active ? '#06b6d4' : '#475569'} strokeWidth={1.5} opacity={0.6} />
                  </Group>
                )}
              </Layer>
            </Stage>

            <div className="canvas-zoom-controls" aria-label="Canvas zoom controls">
              <button
                type="button"
                className="canvas-zoom-btn"
                onClick={() => zoomCanvasFromCenter(CANVAS_ZOOM_STEP)}
                disabled={canvasZoom >= MAX_CANVAS_ZOOM}
                aria-label="Zoom in"
                title="Zoom in"
              >
                +
              </button>
              <span className="canvas-zoom-level" aria-live="polite">
                {Math.round(canvasZoom * 100)}%
              </span>
              <button
                type="button"
                className="canvas-zoom-btn"
                onClick={() => zoomCanvasFromCenter(1 / CANVAS_ZOOM_STEP)}
                disabled={canvasZoom <= MIN_CANVAS_ZOOM}
                aria-label="Zoom out"
                title="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                className="canvas-zoom-reset"
                onClick={resetCanvasZoom}
                disabled={canvasZoom === 1 && canvasPosition.x === 0 && canvasPosition.y === 0}
                title="Reset zoom"
              >
                Reset
              </button>
            </div>

            {/* Windvane HUD Overlay at top center */}
            <div className="wind-vane-container">
              <div className="wind-vane-dial">
                {/* Windvane needle */}
                <svg
                  className="wind-vane-needle"
                  viewBox="0 0 100 100"
                  style={{ transform: `rotate(${activeFrame.windAngle}deg)` }}
                >
                  {/* Tail of the vane */}
                  <path d="M 50 80 L 50 50" stroke="#94a3b8" strokeWidth="4" />
                  <path d="M 42 80 L 50 70 L 58 80 Z" fill="#94a3b8" />
                  {/* Head of the vane (pointing into the wind) */}
                  <path d="M 50 20 L 50 50" stroke="#ef4444" strokeWidth="6" />
                  <polygon points="50,8 40,28 50,23 60,28" fill="#ef4444" />
                  <circle cx="50" cy="50" r="7" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
                </svg>
                {/* Compass markers */}
                <span className="compass-n">N</span>
                <span className="compass-s">S</span>
                <span className="compass-e">E</span>
                <span className="compass-w">W</span>
              </div>
              <div className="wind-vane-info">
                <span className="wind-vane-speed">{activeFrame.windSpeed} KTS</span>
                <span className="wind-vane-angle">{activeFrame.windAngle}°</span>
              </div>
            </div>
          </div>

          {/* Timeline & Playback Bar */}
          <footer className="timeline-bar">
            <div className="playback-controls">
              <button
                type="button"
                className={`play-pause-btn ${isPlaying ? 'playing' : ''}`}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </button>

              <select
                className="speed-selector"
                value={playSpeed}
                onChange={(e) => setPlaySpeed(parseInt(e.target.value))}
              >
                <option value="2000">Slow (2s)</option>
                <option value="1000">Normal (1s)</option>
                <option value="500">Fast (0.5s)</option>
              </select>

              <button type="button" className="timeline-action-btn" onClick={addFrame}>
                ➕ Add Frame
              </button>
              <button type="button" className="timeline-action-btn" onClick={duplicateFrame}>
                📋 Duplicate
              </button>
              <button
                type="button"
                className="timeline-action-btn delete-frame-btn"
                onClick={() => deleteFrame(currentFrameIndex)}
                disabled={frames.length <= 1}
              >
                🗑️ Delete
              </button>
            </div>

            {/* Frame List Scrubber */}
            <div className="frames-scrubber">
              {frames.map((frame, index) => (
                <div
                  key={frame.id}
                  className={`frame-thumbnail ${index === currentFrameIndex ? 'active' : ''}`}
                  onClick={() => selectFrame(index)}
                >
                  <div className="thumbnail-num">{index + 1}</div>
                  <span className="thumbnail-title">{frame.name}</span>
                </div>
              ))}
            </div>
          </footer>
        </section>
      </section>

      {/* Export Loader Overlay */}
      {isExporting && (
        <div className="export-overlay">
          <div className="export-spinner-box">
            <div className="spinner"></div>
            <h3>Exporting Scenario as {exportType === 'gif' ? 'GIF' : 'WebM Video'}...</h3>
            <p>Rendering frames... {exportProgress}%</p>
          </div>
        </div>
      )}
    </main>
  );
}
