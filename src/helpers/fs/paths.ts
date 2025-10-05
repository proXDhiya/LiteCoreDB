import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

/**
 * Path helpers
 *
 * Utilities to safely resolve user-supplied filesystem paths while honoring
 * shell-like conventions such as '~', './', and '../'.
 */

/** Expands '~' to the user's home directory and resolves to an absolute path. */
export function resolveUserPath(input: string): string {
  let p = input || "";
  if (p === "~" || p.startsWith("~/")) {
    const envHome =
      process.env.HOME ||
      process.env.USERPROFILE ||
      (process.env.HOMEDRIVE && process.env.HOMEPATH
        ? path.join(process.env.HOMEDRIVE, process.env.HOMEPATH)
        : undefined);
    const homeDir = envHome || os.homedir();
    p = p === "~" ? homeDir : path.join(homeDir, p.slice(2));
  }
  return path.resolve(p);
}

/** Ensures the parent directory of the given file path exists (mkdir -p). */
export function ensureParentDir(filePath: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}
