import * as fs from "node:fs";
import { createHeader, isValidHeader } from "~/helpers/db/header.ts";
import { HEADER_SIZE, MIN_HEADER_VALID_BYTES, DEFAULT_PAGE_SIZE } from "~/constants/header.ts";

/**
 * Database file helpers
 *
 * Utilities to initialize or validate a LiteCoreDB database file on disk.
 */

/**
 * Ensures a LiteCoreDB database exists at the absolute path.
 * - If the file is missing, creates it and writes an initial header.
 * - If the file exists, validates its header. Throws an Error if invalid.
 */
export function ensureDatabaseFile(absPath: string): void {
  const existed = fs.existsSync(absPath);
  if (!existed) {
    const header = createHeader(DEFAULT_PAGE_SIZE);
    fs.writeFileSync(absPath, header, { flag: "w" });
    return;
  }

  const fd = fs.openSync(absPath, "r");
  try {
    const buf = Buffer.alloc(HEADER_SIZE);
    const bytesRead = fs.readSync(fd, buf, 0, HEADER_SIZE, 0);
    if (bytesRead < MIN_HEADER_VALID_BYTES) {
      throw new Error("Invalid database header: file too small");
    }
    if (!isValidHeader(buf)) {
      throw new Error("Invalid database header: magic string mismatch or bad page size");
    }
  } finally {
    fs.closeSync(fd);
  }
}
