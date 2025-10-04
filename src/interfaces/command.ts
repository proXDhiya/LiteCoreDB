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
 */
export interface Command {
    /** Primary name of the command (e.g., ".exit"). */
    name(): string;
    /** Short, one-line description for global help listings. */
    description(): string;
    /** Prints usage details and examples to the console. */
    help(): void;
    /** Runs the command. May exit the process (e.g., ExitCommand). */
    execute(): void;
}
