/**
 * Jest Test Setup
 * Configure global test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Suppress console logs during tests (optional)
// global.console.log = jest.fn();
// global.console.error = jest.fn();
