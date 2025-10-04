import { describe, it, expect } from "bun:test";
import { Router } from "~/router.ts";

function captureConsole() {
  const original = console.log;
  const logs: string[] = [];
  console.log = (...args: any[]) => {
    logs.push(args.map((a) => String(a)).join(" "));
  };
  return {
    get logs() {
      return logs.slice();
    },
    restore() {
      console.log = original;
    },
  };
}

describe("Database command suggestions", () => {
  it("suggests 'ATTACH DATABASE' when user types 'attach'", () => {
    const router = new Router();
    const cap = captureConsole();
    try {
      router.command("attach");
      const out = cap.logs.join("\n");
      expect(out).toContain("Unknown command: attach");
      expect(out).toContain("Did you mean: ATTACH DATABASE ?");
    } finally {
      cap.restore();
    }
  });

  it("suggests 'ATTACH DATABASE' when user types 'ATTACH'", () => {
    const router = new Router();
    const cap = captureConsole();
    try {
      router.command("ATTACH");
      const out = cap.logs.join("\n");
      expect(out).toContain("Unknown command: ATTACH");
      expect(out).toContain("Did you mean: ATTACH DATABASE ?");
    } finally {
      cap.restore();
    }
  });
});
