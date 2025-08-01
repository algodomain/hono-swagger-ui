// Test setup file

// Global test utilities
global.console = {
  ...console,
  // Suppress console.warn during tests unless explicitly needed
  warn: jest.fn(),
  // Suppress console.error during tests unless explicitly needed
  error: jest.fn(),
};

// Mock fetch for tests
global.fetch = jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Test timeout
jest.setTimeout(10000); 