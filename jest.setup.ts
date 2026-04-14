import '@testing-library/jest-dom';

// Radix UI components (Select, etc.) use ResizeObserver internally
global.ResizeObserver = class ResizeObserver {
  // eslint-disable-next-line class-methods-use-this
  observe() {}

  // eslint-disable-next-line class-methods-use-this
  unobserve() {}

  // eslint-disable-next-line class-methods-use-this
  disconnect() {}
};
