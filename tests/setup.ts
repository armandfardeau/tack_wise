import '@testing-library/jest-dom';

// gifshot probes canvas at module load, which jsdom does not implement.
jest.mock('gifshot', () => ({
  __esModule: true,
  default: { createGIF: jest.fn() },
}));
