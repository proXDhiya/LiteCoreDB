import { resolveUserPath, ensureParentDir } from "~/helpers/fs/paths.ts";
import { ensureDatabaseFile } from "~/helpers/db/database_file.ts";
import type {Command} from "@Interfaces/command";
import {session} from "~/session.ts";
import * as path from "node:path";

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
     * Execute the ATTACH DATABASE command.
     *
     * Resolves the provided path (supports ~, ./, ../ and absolute paths),
     * ensures its parent directory exists, then initializes a new database
     * file or validates the header of an existing one. On success, updates
     * the session state (dbPath, dbName) and prints a confirmation.
     *
     * Parameters
     * - args[0]: string - The filesystem path to the database file.
     *
     * Output
     * - On success: logs `Attached database: <original input>`
     * - On invalid usage: logs usage instructions
     * - On failure: logs `Failed to attach database: <reason>`
     */
    public execute(args?: string[]): void {
        const url = (args && args[0]) ? String(args[0]) : "";
        if (!url || url.startsWith("--") || url === "-h" || url === "?") {
            console.log("Usage: ATTACH DATABASE <path|url>");
            console.log("Example: ATTACH DATABASE ./db.db");
            return;
        }

        try {
            const abs = resolveUserPath(url);
            ensureParentDir(abs);
            ensureDatabaseFile(abs);

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
