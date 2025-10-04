# LiteCoreDB
LiteCodeDB — A minimal SQL database clone powered by Bun.js and TypeScript, designed to explore SQLite internals and modern runtime performance.


## Testing

This project uses Bun’s built-in, Jest‑compatible test runner.

- Write tests in tests/*.test.ts using describe/it/expect from "bun:test".
- A separate test environment is configured via .env.test and a preloader at tests/setup.ts which forces NODE_ENV=test.

Commands:
- bun run test — run the test suite (loads .env.test and preloads tests/setup.ts)
- bun run test:watch — watch mode
- bun run test:cov — coverage
- bun run test:ci — coverage in CI

Example:

```ts
import { describe, it, expect } from "bun:test";

describe("math", () => {
  it("adds", () => {
    expect(1 + 1).toBe(2);
  });
});
```
