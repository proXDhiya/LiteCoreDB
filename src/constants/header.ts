/**
 * Database file header constants
 *
 * Defines the layout and defaults for LiteCoreDB database file headers.
 * The header size is fixed at 100 bytes.
 *
 * Layout
 * - [0..15]  (16 bytes): ASCII magic string identifying the DB name/version, NUL-padded.
 * - [16..17] (2 bytes):  Page size stored as uint16 little-endian.
 * - [18..99] (82 bytes): Reserved for future metadata (zeroed for now).
 */

/** Total header bytes to allocate for every database file. */
export const HEADER_SIZE = 100;
/** Number of bytes reserved for the magic string. */
export const MAGIC_LEN = 16;
/** Offset where the page size (uint16 LE) is stored. */
export const PAGE_SIZE_OFFSET = 16;
/** Length of the page size field in bytes. */
export const PAGE_SIZE_LEN = 2;
/** Default database page size used for new files. */
export const DEFAULT_PAGE_SIZE = 4096;
/** Magic string used to identify LiteCoreDB database files. */
export const MAGIC_STRING = "LiteCoreDB v1";
/** Minimum bytes required to consider a header readable/parsable. */
export const MIN_HEADER_VALID_BYTES = PAGE_SIZE_OFFSET + PAGE_SIZE_LEN; // 18 bytes
