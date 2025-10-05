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

// Test helpers mirroring the header contract from the command implementation
const HEADER_SIZE = 100;
const MAGIC_LEN = 16;
const PAGE_SIZE_OFFSET = 16;
const DEFAULT_PAGE_SIZE = 4096;
const MAGIC_STRING = "LiteCoreDB v1";

function makeValidHeader(pageSize = DEFAULT_PAGE_SIZE): Buffer {
  const buf = Buffer.alloc(HEADER_SIZE, 0);
  const magic = Buffer.alloc(MAGIC_LEN, 0);
  magic.write(MAGIC_STRING, 0, "ascii");
  magic.copy(buf, 0);
  buf.writeUInt16LE(pageSize & 0xffff, PAGE_SIZE_OFFSET);
  return buf;
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

  it("creates the database file with a valid 100-byte header if it does not exist", () => {
    const router = new Router();
    const cap = captureConsole();
    try {
      expect(fs.existsSync(DB_PATH)).toBe(false);

      router.command(`ATTACH DATABASE ${DB_PATH}`);

      expect(fs.existsSync(DB_PATH)).toBe(true);
      // Verify header
      const data = fs.readFileSync(DB_PATH);
      expect(data.length).toBeGreaterThanOrEqual(HEADER_SIZE);
      const magicRead = data.subarray(0, MAGIC_LEN).toString("ascii").replace(/\0+$/, "");
      expect(magicRead).toBe(MAGIC_STRING);
      const pageSize = data.readUInt16LE(PAGE_SIZE_OFFSET);
      expect(pageSize).toBe(DEFAULT_PAGE_SIZE);

      const out = cap.logs.join("\n");
      expect(out).toContain(`Attached database: ${DB_PATH}`);
    } finally {
      cap.restore();
    }
  });

  it("opens an existing database file with a valid header without error", () => {
    const router = new Router();
    const cap = captureConsole();
    try {
      // Pre-create the file with a valid header
      fs.writeFileSync(DB_PATH, makeValidHeader());
      expect(fs.existsSync(DB_PATH)).toBe(true);

      router.command(`ATTACH DATABASE ${DB_PATH}`);

      expect(fs.existsSync(DB_PATH)).toBe(true);
      const out = cap.logs.join("\n");
      expect(out).toContain(`Attached database: ${DB_PATH}`);
      // Ensure no errors were printed
      expect(cap.errs.join("\n")).not.toContain("Invalid database header");
    } finally {
      cap.restore();
    }
  });

  it("prints an error when existing file has an invalid header", () => {
    const router = new Router();
    const cap = captureConsole();
    try {
      // Pre-create an invalid file (empty or wrong magic)
      fs.writeFileSync(DB_PATH, Buffer.from("NOTADB", "ascii"));

      router.command(`ATTACH DATABASE ${DB_PATH}`);

      const errs = cap.errs.join("\n");
      const logs = cap.logs.join("\n");
      expect(errs).toMatch(/Invalid database header/);
      expect(logs).not.toContain(`Attached database: ${DB_PATH}`);
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
  it("expands '~' to the home directory and does not create a literal '~' folder", () => {
    const router = new Router();
    const cap = captureConsole();
    const prevHome = process.env.HOME;
    try {
      // Point HOME to our temp dir so we don't write into the real home folder
      process.env.HOME = TMP_DIR;

      const tildePath = "~/tilde_attach.db";
      const expected = path.join(TMP_DIR, "tilde_attach.db");
      expect(fs.existsSync(expected)).toBe(false);

      router.command(`ATTACH DATABASE ${tildePath}`);

      // File should be created inside TMP_DIR (mocked HOME)
      expect(fs.existsSync(expected)).toBe(true);
      // And no literal '~' directory should be created in CWD
      expect(fs.existsSync(path.join(process.cwd(), "~"))).toBe(false);

      const out = cap.logs.join("\n");
      expect(out).toContain(`Attached database: ${tildePath}`);
    } finally {
      // Cleanup and restore
      process.env.HOME = prevHome;
      cap.restore();
    }
  });

  it("supports '../' and './' by resolving relative paths correctly", () => {
    const router = new Router();
    const cap = captureConsole();
    const relUp = path.join("tests", "tmp", "..", "tmp_rel_up.attach.db");
    const resolved = path.resolve(relUp);
    try {
      // Ensure clean state
      if (fs.existsSync(resolved)) fs.rmSync(resolved, { force: true });
      expect(fs.existsSync(resolved)).toBe(false);

      router.command(`ATTACH DATABASE ${relUp}`);

      expect(fs.existsSync(resolved)).toBe(true);
      const out = cap.logs.join("\n");
      expect(out).toContain(`Attached database: ${relUp}`);
    } finally {
      // Cleanup the created file outside TMP_DIR
      if (fs.existsSync(resolved)) fs.rmSync(resolved, { force: true });
      cap.restore();
    }
  });
});
