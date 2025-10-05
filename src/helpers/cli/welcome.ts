import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Prints a startup welcome banner with app name, version, and basic usage hints.
 * Reads from package.json when available; falls back to a generic banner otherwise.
 */
export function printWelcome(): void {
  try {
    const pkgPath = path.resolve("package.json");
    const pkgRaw = fs.readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(pkgRaw) as { name?: string; version?: string; homepage?: string };
    const name = pkg.name || "LiteCoreDB";
    const version = pkg.version ? `v${pkg.version}` : "";
    console.log(`${name} ${version}`.trim());
    console.log('Type "help" for help. Use .exit to quit, .clear to clear the screen.');
    if (pkg.homepage) {
      console.log(pkg.homepage);
    }
  } catch {
    // Fallback welcome if package.json cannot be read for any reason
    console.log("LiteCoreDB");
    console.log('Type "help" for help. Use .exit to quit, .clear to clear the screen.');
  }
}
