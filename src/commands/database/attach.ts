import type {Command} from "@Interfaces/command";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * AttachCommand
 *
 * Database command to attach to a database for the current session.
 *
 * Behavior
 * - Opens an existing database file, or creates a new one if it doesn’t exist.
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
     * - Opens the file with flag "a+" to create it if missing; then immediately closes it.
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
            // For now, treat input as a local filesystem path (URLs not supported yet)
            const abs = path.resolve(url);
            const dir = path.dirname(abs);
            // Ensure directory exists
            fs.mkdirSync(dir, { recursive: true });
            // Open or create the file, then close immediately
            const fd = fs.openSync(abs, "a+");
            fs.closeSync(fd);

            // In a future iteration, we will establish a real connection/session here.
            console.log(`Attached database: ${url}`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`Failed to attach database: ${msg}`);
        }
    }
}
