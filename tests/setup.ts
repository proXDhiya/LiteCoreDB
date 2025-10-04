/**
 * Test setup for Bun's Jest-compatible runner (bun test).
 *
 * - Forces NODE_ENV to "test" for predictable behavior.
 * - Hook for adding global mocks/polyfills in the future.
 */

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "test";
}

// Example global marker (optional)
(globalThis as any).__TEST_ENV__ = "test";
