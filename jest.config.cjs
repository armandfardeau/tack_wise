module.exports = {
  testEnvironment: 'jsdom',
  watchman: false,
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  coverageThreshold: {
    global: {
      statements: 96,
      branches: 96,
      functions: 96,
      lines: 96,
    },
  },
};
