import {AttachCommand} from "~/commands/database/attach.ts";

/**
 * DatabaseCommandRegistry
 *
 * Central place to register built-in database-level commands.
 * Add new database commands here as properties to make them discoverable by the Router.
 */
export class DatabaseCommandRegistry {
    public attach = new AttachCommand();
}

/**
 * Singleton instance consumed by the Router to dynamically discover commands.
 */
export const DatabaseCommands = new DatabaseCommandRegistry();
