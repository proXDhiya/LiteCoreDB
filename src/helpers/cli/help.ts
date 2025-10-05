/**
 * Help token utilities
 *
 * Recognizes tokens that ask for help, such as "help", "--help", "-h", or "?".
 * Matching is case-insensitive.
 *
 * Examples
 * ```ts
 * isHelpToken("help");   // true
 * isHelpToken("--HELP"); // true
 * isHelpToken("?");      // true
 * isHelpToken("exit");   // false
 * ```
 */

/** Returns true if the token represents a request for help (case-insensitive). */
export function isHelpToken(t: string): boolean {
  return /^(help|--help|-h|\?)$/i.test(t);
}
