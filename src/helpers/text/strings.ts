/**
 * String helpers
 *
 * Provides small utilities used across the REPL router and commands.
 *
 * Features
 * - escapeRegex: Safely escapes a string for use inside a RegExp.
 * - normalizeName: Normalizes command names for case-insensitive matching and optional dot prefix.
 *
 * Examples
 * ```ts
 * escapeRegex("hello.*"); // => "hello\.\*"
 * normalizeName(".Exit"); // => "exit"
 * ```
 */

/** Escapes special regex characters in a string so it can be used literally in a RegExp. */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalizes a command name by removing a single optional leading dot and lowercasing it.
 *
 * This allows matching commands like ".exit", "exit", or "EXIT" in a unified way.
 */
export function normalizeName(name: string): string {
  return name.replace(/^\./, "").toLowerCase();
}
