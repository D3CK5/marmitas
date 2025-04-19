import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Automatically clean up after each test
afterEach(() => {
  cleanup();
});

// Mock para imagens estáticas
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
}; 