/**
 * Database header helpers
 *
 * Provides utilities to create and validate LiteCoreDB database file headers.
 */
import {
  HEADER_SIZE,
  MAGIC_LEN,
  PAGE_SIZE_OFFSET,
  DEFAULT_PAGE_SIZE,
  MAGIC_STRING,
  MIN_HEADER_VALID_BYTES,
} from "~/constants/header.ts";

/** Creates a zero-filled 100-byte header buffer with magic and page size populated. */
export function createHeader(pageSize: number = DEFAULT_PAGE_SIZE): Buffer {
  const header = Buffer.alloc(HEADER_SIZE, 0);
  // Write magic, NUL-padded to 16 bytes
  const magicBuf = Buffer.alloc(MAGIC_LEN, 0);
  magicBuf.write(MAGIC_STRING, 0, "ascii");
  magicBuf.copy(header, 0);
  // Write page size (uint16 LE)
  header.writeUInt16LE(pageSize & 0xffff, PAGE_SIZE_OFFSET);
  return header;
}

/** Validates the header of an existing LiteCoreDB database file. */
export function isValidHeader(buf: Buffer): boolean {
  if (buf.length < MIN_HEADER_VALID_BYTES) return false;
  const magicRead = buf.subarray(0, MAGIC_LEN).toString("ascii").replace(/\0+$/, "");
  if (magicRead !== MAGIC_STRING) return false;
  const pageSize = buf.readUInt16LE(PAGE_SIZE_OFFSET);
  return pageSize > 0;
}
