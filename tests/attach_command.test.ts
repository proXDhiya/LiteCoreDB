import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Router } from "~/router.ts";
import * as fs from "node:fs";
import * as path from "node:path";

function captureConsole() {
  const originalLog = console.log;
  const originalErr = console.error;
  const logs: string[] = [];
  const errs: string[] = [];
  console.log = (...args: any[]) => {
    logs.push(args.map((a) => String(a)).join(" "));
  };
  console.error = (...args: any[]) => {
    errs.push(args.map((a) => String(a)).join(" "));
  };
  return {
    get logs() {
      return logs.slice();
    },
    get errs() {
      return errs.slice();
    },
    restore() {
      console.log = originalLog;
      console.error = originalErr;
    },
  };
}

const TMP_DIR = path.resolve("tests/tmp");
const DB_PATH = path.join(TMP_DIR, "attach_test.db");

describe("ATTACH DATABASE", () => {
  beforeEach(() => {
    // Ensure a clean tmp dir before each test
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
    fs.mkdirSync(TMP_DIR, { recursive: true });
  });

  afterEach(() => {
    // Cleanup tmp dir after each test
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("creates the database file if it does not exist", () => {
    const router = new Router();
    const cap = captureConsole();
    try {
      expect(fs.existsSync(DB_PATH)).toBe(false);

      router.command(`ATTACH DATABASE ${DB_PATH}`);

      expect(fs.existsSync(DB_PATH)).toBe(true);
      const out = cap.logs.join("\n");
      expect(out).toContain(`Attached database: ${DB_PATH}`);
    } finally {
      cap.restore();
    }
  });

  it("opens an existing database file without error", () => {
    const router = new Router();
    const cap = captureConsole();
    try {
      // Pre-create the file
      fs.writeFileSync(DB_PATH, "");
      expect(fs.existsSync(DB_PATH)).toBe(true);

      router.command(`ATTACH DATABASE ${DB_PATH}`);

      expect(fs.existsSync(DB_PATH)).toBe(true);
      const out = cap.logs.join("\n");
      expect(out).toContain(`Attached database: ${DB_PATH}`);
    } finally {
      cap.restore();
    }
  });

  it("prints usage when missing path", () => {
    const router = new Router();
    const cap = captureConsole();
    try {
      router.command("ATTACH DATABASE");
      const out = cap.logs.join("\n");
      expect(out).toContain("Usage: ATTACH DATABASE <path|url>");
    } finally {
      cap.restore();
    }
  });
});
