import {ClearCommand} from "./clear.ts";
import {ExitCommand} from './exit';

/**
 * SystemCommandRegistry
 *
 * Central place to register built-in system-level commands.
 * Add new system commands here as properties to make them discoverable by the Router.
 */
export class SystemCommandRegistry {
    public exit = new ExitCommand();
    public clear = new ClearCommand();
}

/**
 * Singleton instance consumed by the Router to dynamically discover commands.
 */
export const SystemCommands = new SystemCommandRegistry();
