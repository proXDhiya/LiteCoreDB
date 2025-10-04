import type {Command} from "@Interfaces/command";
import * as path from "node:path";
import * as fs from "node:fs";
import { createHeader, isValidHeader } from "~/helpers/header.ts";
import { HEADER_SIZE, MIN_HEADER_VALID_BYTES, DEFAULT_PAGE_SIZE } from "~/constants/header.ts";
import { session } from "~/session.ts";

/**
 * AttachCommand
 *
 * Database command to attach to a database for the current session.
 *
 * Behavior
 * - Opens an existing database file or creates a new one if it doesn’t exist.
 * - When creating a new database file, writes a 100-byte header:
 *   - [0..15] (16 bytes): Magic string for database name/version (ASCII, NUL-padded).
 *   - [16..17] (2 bytes): Page size (uint16 LE).
 *   - [18..99] (82 bytes): Reserved for metadata (zeroed for now).
 * - When opening an existing file, validates the header (magic and non-zero page size); if invalid, prints an error.
 * - Accepts a filesystem path (relative or absolute). URL schemes are not yet supported.
 *
 * Usage
 * - ATTACH DATABASE <path>
 * - help ATTACH DATABASE
 * - ATTACH DATABASE --help
 */
export class AttachCommand implements Command {
    /** The canonical command name used by the router */
    public name(): string {
        return "ATTACH DATABASE"
    }

    /** Short description shown in global help listings */
    public description(): string {
        return "Attach to a database for the current session using the provided path"
    }

    /** Prints usage details and notes */
    public help(): void {
        console.log("ATTACH DATABASE <path>")
        console.log("\nExamples:")
        console.log("  ATTACH DATABASE ./db.db")
        console.log("  help ATTACH DATABASE")
        console.log("  ATTACH DATABASE --help")
    }

    /**
     * Attach to a database for the current session using the provided path.
     *
     * Implementation notes
     * - Ensures the parent directory exists (mkdir -p).
     * - Initializes a new database header for brand-new files; validates header for existing ones.
     * - Prints a confirmation message on success, preserving the previous output format.
     */
    public execute(args?: string[]): void {
        const url = (args && args[0]) ? String(args[0]) : "";
        if (!url || url.startsWith("--") || url === "-h" || url === "?") {
            console.log("Usage: ATTACH DATABASE <path|url>");
            console.log("Example: ATTACH DATABASE ./db.db");
            return;
        }

        try {
            const abs = path.resolve(url);
            const dir = path.dirname(abs);
            fs.mkdirSync(dir, {recursive: true});

            const existed = fs.existsSync(abs);
            if (!existed) {
                // Create and write initial header (100 bytes)
                const header = createHeader(DEFAULT_PAGE_SIZE);
                fs.writeFileSync(abs, header, {flag: "w"});
            } else {
                // Open and validate header
                const fd = fs.openSync(abs, "r");
                try {
                    const buf = Buffer.alloc(HEADER_SIZE);
                    const bytesRead = fs.readSync(fd, buf, 0, HEADER_SIZE, 0);
                    if (bytesRead < MIN_HEADER_VALID_BYTES) {
                        console.error("Invalid database header: file too small");
                        return;
                    }
                    if (!isValidHeader(buf)) {
                        console.error("Invalid database header: magic string mismatch or bad page size");
                        return;
                    }
                } finally {
                    fs.closeSync(fd);
                }
            }

            // Update session state for prompt display
            const base = path.basename(abs);
            const dbName = base.replace(/\.[^.]+$/, "");
            session.dbPath = abs;
            session.dbName = dbName;

            console.log(`Attached database: ${url}`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`Failed to attach database: ${msg}`);
        }
    }
}

