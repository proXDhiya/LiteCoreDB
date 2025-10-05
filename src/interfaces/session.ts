/**
 * Session interfaces.
 *
 * Centralizes the shape of the interactive REPL session state. The session
 * object is stored in src/session.ts and referenced by helpers (prompt,
 * monitoring) and commands (e.g., ATTACH DATABASE).
 */

/**
 * Public shape for the REPL session state.
 */
export interface Session {
  /** Absolute path to the currently attached database file, if any. */
  dbPath?: string;
  /** Derived database name (basename without extension), if any. */
  dbName?: string;
  /** Whether per-command monitoring is enabled for this session. */
  monitoringEnabled?: boolean;
  /** Absolute path to the monitoring CSV log file. */
  monitorLogPath?: string;
}
