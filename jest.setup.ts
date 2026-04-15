import '@testing-library/jest-dom';

// Fail tests on any console.error or console.warn — keeps tests clean and surfaces React warnings
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    throw new Error(`Unexpected console.error:\n${args.join(' ')}`);
  });
  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    throw new Error(`Unexpected console.warn:\n${args.join(' ')}`);
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Radix UI components (Select, etc.) use ResizeObserver internally
global.ResizeObserver = class ResizeObserver {
  // eslint-disable-next-line class-methods-use-this
  observe() {}

  // eslint-disable-next-line class-methods-use-this
  unobserve() {}

  // eslint-disable-next-line class-methods-use-this
  disconnect() {}
};
