import { ExitCommand } from './exit';

/**
 * SystemCommandRegistry
 *
 * Central place to register built-in system-level commands.
 * Add new system commands here as properties to make them discoverable by the Router.
 */
export class SystemCommandRegistry {
    /** Exit the REPL session. */
    public exit = new ExitCommand();
}

/**
 * Singleton instance consumed by the Router to dynamically discover commands.
 */
export const SystemCommands = new SystemCommandRegistry();
