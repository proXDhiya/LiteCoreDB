/**
 * Command interface
 *
 * Represents an executable instruction handled by the Router.
 * Implementations should be stateless or side-effect free except for execute().
 *
 * Contract
 * - name: The primary name of the command (e.g., ".exit"). Can include a leading dot for system commands.
 * - description: A short, one-line summary used in global help.
 * - help: Prints extended usage information and examples.
 * - execute: Performs the command's action.
 *
 * Arguments
 * - Commands may accept arguments parsed from the user input. The router will pass the
 *   remaining tokens (after the matched command name) as a string array, preserving order.
 *   For example, "ATTACH DATABASE ./db.db" will call execute(["./db.db"]).
 */
export interface Command {
    /** Primary name of the command (e.g., ".exit"). */
    name(): string;
    /** Short, one-line description for global help listings. */
    description(): string;
    /** Prints usage details and examples to the console. */
    help(): void;
    /** Runs the command with optional arguments. May exit the process (e.g., ExitCommand). */
    execute(args?: string[]): void;
}
