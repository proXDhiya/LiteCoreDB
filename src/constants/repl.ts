/**
 * Constants for the LiteCoreDB REPL and CLI layer.
 *
 * Centralizes values used across helpers for prompt/history, keeping
 * implementation files free of hard-coded literals.
 */

/** Default maximum history size maintained in memory. */
export const DEFAULT_HISTORY_SIZE = 1000;

/** Name of the history file in the user's home directory. */
export const HISTORY_BASENAME = '.litecore_history';
