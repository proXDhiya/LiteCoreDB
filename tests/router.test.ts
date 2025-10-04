import { describe, it, expect, beforeEach, afterEach } from "bun:test";
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

describe("Router", () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  it("prints global help with available commands including .exit", () => {
    const cap = captureConsole();
    try {
      router.command("help");
      const out = cap.logs.join("\n");
      expect(out).toContain("Available commands:");
      expect(out).toContain(".exit - Exit the current REPL session");
    } finally {
      cap.restore();
    }
  });

  it("requires leading dot for .exit and treats 'exit' as unknown", () => {
    const cap = captureConsole();
    try {
      router.command("exit");
      const out = cap.logs.join("\n");
      expect(out).toContain("Unknown command: exit");
      expect(out).toContain("Did you mean: .exit ?");
    } finally {
      cap.restore();
    }
  });

  it("shows per-command help via 'help .exit' without executing the command", () => {
    const cap = captureConsole();
    try {
      router.command("help .exit");
      const out = cap.logs.join("\n");
      expect(out).toContain("Exit the current REPL session");
      expect(out.length).toBeGreaterThan(0);
    } finally {
      cap.restore();
    }
  });
});
