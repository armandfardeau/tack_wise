import '@testing-library/jest-dom';

// jsdom does not provide a native canvas implementation. Keep canvas-backed
// components testable without pulling in the native `canvas` package.
const createCanvasContextMock = () => {
  const context: Record<string, unknown> = {
    canvas: document.createElement('canvas'),
    measureText: jest.fn(() => ({ width: 0 })),
    getImageData: jest.fn(() => ({ data: new Uint8ClampedArray() })),
    createImageData: jest.fn((width = 0, height = 0) => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    })),
    getLineDash: jest.fn(() => []),
    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
  };

  return new Proxy(context, {
    get(target, property) {
      if (!(property in target)) target[property as string] = jest.fn();
      return target[property as string];
    },
  });
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: jest.fn((contextId: string) => (contextId === '2d' ? createCanvasContextMock() : null)),
});
