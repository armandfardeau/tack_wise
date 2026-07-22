import { act, renderHook } from '@testing-library/react';
import { useCanvasViewport } from '../src/hooks/useCanvasViewport';

function createTouchEvent(touches: Array<{ clientX: number; clientY: number }>) {
  return {
    evt: {
      touches,
      preventDefault: jest.fn(),
    },
  } as unknown as { evt: TouchEvent };
}

describe('useCanvasViewport pinch zoom', () => {
  it('scales around the midpoint of two touches', () => {
    const { result } = renderHook(() => useCanvasViewport());
    const canvasWrap = document.createElement('div');
    canvasWrap.getBoundingClientRect = () => ({ left: 10, top: 20 } as DOMRect);
    result.current.canvasWrapRef.current = canvasWrap;

    act(() => {
      result.current.handleCanvasTouchStart(createTouchEvent([
        { clientX: 110, clientY: 120 },
        { clientX: 210, clientY: 120 },
      ]));
      result.current.handleCanvasTouchMove(createTouchEvent([
        { clientX: 60, clientY: 120 },
        { clientX: 260, clientY: 120 },
      ]));
    });

    expect(result.current.canvasZoom).toBe(2);
    expect(result.current.canvasPosition).toEqual({ x: -150, y: -100 });
  });

  it('moves the canvas with the midpoint while the pinch distance stays the same', () => {
    const { result } = renderHook(() => useCanvasViewport());
    const canvasWrap = document.createElement('div');
    canvasWrap.getBoundingClientRect = () => ({ left: 0, top: 0 } as DOMRect);
    result.current.canvasWrapRef.current = canvasWrap;

    act(() => {
      result.current.handleCanvasTouchStart(createTouchEvent([
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 },
      ]));
      result.current.handleCanvasTouchMove(createTouchEvent([
        { clientX: 150, clientY: 100 },
        { clientX: 250, clientY: 100 },
      ]));
    });

    expect(result.current.canvasZoom).toBe(1);
    expect(result.current.canvasPosition).toEqual({ x: 50, y: 0 });
  });
});

describe('useCanvasViewport fitting', () => {
  const originalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: class TestResizeObserver {
        constructor(_callback: () => void) {}
        observe() {}
        disconnect() {}
      },
    });
  });

  afterEach(() => {
    if (originalResizeObserver) {
      Object.defineProperty(globalThis, 'ResizeObserver', {
        configurable: true,
        value: originalResizeObserver,
      });
    } else {
      delete (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    }
  });

  it('uses the current wrapper size before the resize observer updates state', () => {
    let size = { width: 720, height: 500 };
    const canvasWrap = document.createElement('div');
    canvasWrap.getBoundingClientRect = () => size as DOMRect;

    const { result } = renderHook(() => {
      const viewport = useCanvasViewport();
      viewport.canvasWrapRef.current = canvasWrap;
      return viewport;
    });
    const fitFromInitialRender = result.current.fitCanvasToContent;

    size = { width: 360, height: 640 };

    act(() => {
      fitFromInitialRender({ minX: 0, minY: 0, maxX: 600, maxY: 200 });
    });

    expect(result.current.canvasZoom).toBe(0.5);
  });
});
