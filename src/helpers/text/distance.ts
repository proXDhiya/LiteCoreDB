/**
 * Distance utilities
 *
 * Contains the Levenshtein distance implementation used to suggest similar commands
 * when the user enters an unknown command.
 *
 * Levenshtein distance measures the minimum number of single-character edits
 * (insertions, deletions, substitutions) required to change one string into another.
 *
 * Examples
 * ```ts
 * levenshtein("exit", "exot"); // 1
 * levenshtein("help", "HELPP"); // 1
 * levenshtein("hello", "bye");  // 5
 * ```
 */

/** Computes the Levenshtein distance between two strings. */
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    const row = dp[i]!;
    const prevRow = dp[i - 1]!;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(
        prevRow[j]! + 1,    // deletion
        row[j - 1]! + 1,    // insertion
        prevRow[j - 1]! + cost // substitution
      );
    }
  }

  return dp[m]![n]!;
}
