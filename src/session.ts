/**
 * Session state for the interactive REPL.
 *
 * Holds information about the currently attached database so the prompt can be
 * updated accordingly. Commands can update this state when they succeed.
 */
export const session: {
    dbPath?: string;
    dbName?: string;
    monitoringEnabled?: boolean;
    monitorLogPath?: string;
} = {};
