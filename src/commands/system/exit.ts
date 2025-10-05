import {printMonitoringLogPathIfAny} from "~/helpers/cli/monitoring.ts";
import type {Command} from "@Interfaces/command";

/**
 * ExitCommand
 *
 * System command to terminate the current REPL session.
 *
 * Usage
 * - .exit
 * - help .exit
 * - .exit --help
 */
export class ExitCommand implements Command {
    /** The canonical command name used by the router. */
    public name(): string {
        return ".exit"
    }

    /** Short description shown in global help listings. */
    public description(): string {
        return "Exit the current REPL session"
    }

    /** Prints usage details and notes. */
    public help(): void {
        console.log("Exit the current REPL session")
        console.log("\nExamples:")
        console.log("  .exit")
        console.log("  help .exit")
        console.log("  .exit --help")
    }

    /** Terminates the Node/Bun process with exit code 0. */
    public execute(_args?: string[]): void {
        try {
            // Always print the monitoring log path if available/exists for discoverability
            printMonitoringLogPathIfAny();
        } finally {
            process.exit(0)
        }
    }
}
