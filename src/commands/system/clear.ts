import type {Command} from "@Interfaces/command.ts";

/**
 * ClearCommand
 *
 * System command to clear the console.
 *
 * Usage
 * - .clear
 * - help .clear
 * - .clear --help
 */
export class ClearCommand implements Command {
    /** The canonical command name used by the router. */
    public name(): string {
        return ".clear"
    }

    /** Short description shown in global help listings. */
    public description(): string {
        return "Clear the console"
    }

    /** Prints usage details and notes. */
    public help(): void {
        console.log("Clear the console")
        console.log("\nExamples:")
        console.log("  .clear")
        console.log("  help .clear")
        console.log("  .clear --help")
    }

    /** Clears the console. */
    public execute(): void {
        console.clear()
    }
}
