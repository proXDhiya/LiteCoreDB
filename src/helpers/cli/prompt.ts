/**
 * Prompt utilities for the LiteCoreDB REPL.
 *
 * Computes the interactive prompt string based on the current session state.
 */
import { session } from '~/session.ts';

/**
 * Compute the prompt string, including the database name when attached.
 *
 * @returns The prompt to display in the REPL (prefixed with a newline for spacing).
 */
export function computePrompt(): string {
  return session.dbName ? `\nLiteCore - ${session.dbName}> ` : '\nLiteCore> ';
}
