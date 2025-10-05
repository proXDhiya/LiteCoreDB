/**
 * REPL command history utilities.
 *
 * Provides functions to load and persist shell-like history for the LiteCoreDB REPL.
 * The history is stored in a plain text file under the user's home directory
 * ("~/.litecore_history"), one command per line. Newest entries are appended
 * to the end of the file. When loading into Node's readline, the array must be
 * reversed (newest first).
 */
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { DEFAULT_HISTORY_SIZE, HISTORY_BASENAME } from '~/constants/repl.ts';

/**
 * Compute the absolute path to the REPL history file.
 *
 * @returns Absolute path to the history file (e.g., "/home/user/.litecore_history").
 */
export function getHistoryFilePath(): string {
  const home = os.homedir?.() || process.env.HOME || '.';
  return path.join(home, HISTORY_BASENAME);
}

/**
 * Load history lines from disk, suitable for passing to readline.createInterface.
 *
 * Readlines expects the newest entry first in the array; the on-disk format is
 * oldest-first. This function handles reading, filtering empty lines, trimming
 * to max entries, and reversing the order for readline consumption.
 *
 * @param max Optional maximum number of entries to keep in memory.
 * @returns Array of history lines with newest entry first; empty array on error or if file missing.
 */
export function loadHistory(max: number = DEFAULT_HISTORY_SIZE): string[] {
  const file = getHistoryFilePath();
  try {
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    const lines = raw.split(/\r?\n/).filter(Boolean); // drop empty lines
    return lines.slice(-max).reverse();
  } catch {
    // On any error, fall back to no history
    return [];
  }
}

/**
 * Append a single input line to the history file if it should be recorded.
 *
 * Mimics bash behavior by ignoring empty lines and lines that start with a
 * leading space character.
 *
 * @param line Raw input line as typed by the user (before trimming is acceptable).
 */
export function appendHistory(line: string): void {
  const input = line.trim();
  if (input.length === 0) return;
  if (/^\s/.test(line)) return; // ignore lines starting with a space

  const file = getHistoryFilePath();
  try {
    fs.appendFile(file, input + '\n', () => {});
  } catch {
    // Silently ignore file write errors
  }
}

/**
 * Readline options to enable history behavior consistently across the app.
 * Can be spread into readline.createInterface options.
 */
export const historyOptions = {
  history: loadHistory(DEFAULT_HISTORY_SIZE),
  historySize: DEFAULT_HISTORY_SIZE,
  removeHistoryDuplicates: true,
} as const;
