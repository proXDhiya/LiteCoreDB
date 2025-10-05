# LiteCoreDB

A minimal SQL database learning project powered by Bun.js and TypeScript. LiteCoreDB provides a small REPL ("LiteCore>") with a regex‑driven command router, a pluggable command system (System and Database categories), and an on‑disk database file with a simple 100‑byte header inspired by SQLite.

Goals:
- Explore how a small DB engine could be structured.
- Practice command routing, argument parsing, and discoverability via help/suggestions.
- Build and validate a tiny database file format with a fixed header.


## Quick start

Prerequisites:
- Bun (latest). Install from https://bun.sh

Install dependencies and start the REPL:

```
bun install
bun run start
```

You’ll see the prompt:

```
LiteCore> 
```

Basic usage inside the REPL:
- help — show all commands grouped by category
- help `<command>` — show per‑command help (also supports "--help", "-h", and "?")
- .exit — exit the REPL
- .clear — clear the console
- ATTACH DATABASE <path> — open or create a database file and attach it to the session

When a database is attached, the prompt changes to include its name:

```
LiteCore - mydb> 
```


## Architecture overview

Top‑level components:

- REPL entrypoint (src/app.ts)
  - Starts a readline loop, sets/updates the prompt, wires persistent history and optional monitoring, and delegates each input line to the Router.
- Router (src/router.ts)
  - Discovers and routes commands; supports global help, per‑command help, unknown‑input suggestions, and dot‑prefixed system commands.
- Session (src/session.ts)
  - Holds per‑session state: dbPath, dbName, monitoringEnabled, monitorLogPath.
- Commands (src/commands)
  - System: .exit, .clear, .monitoring
  - Database: ATTACH DATABASE
- Helpers (src/helpers/cli)
  - prompt.ts — computePrompt based on session
  - welcome.ts — printWelcome banner
  - history.ts — load/append history and provide readline options
  - monitoring.ts — enable/disable monitoring and append JSONL metrics
- Constants (src/constants)
  - header.ts — header sizes/offsets/defaults
  - repl.ts — history config
  - monitoring.ts — monitoring config

Data flow (simplified):

```
stdin → src/app.ts (readline) → Router.command(input)
                           ↳ resolves command (regex)
                           ↳ parses args / help flags
                           ↳ Command.execute(args)
``` 


## Command system

Command interface (src/interfaces/command.ts):
- name(): string — canonical command name (e.g., ".exit" or "ATTACH DATABASE").
- description(): string — short summary for global help.
- help(): void — prints usage and examples.
- execute(args?: string[]): void — performs the action; args are whitespace‑split tokens after the matched command name.

Registries:
- SystemCommands (src/commands/system/_index.ts)
- DatabaseCommands (src/commands/database/_index.ts)

Adding a new command:
1) Create a class that implements Command.
2) Add a property with an instance of that class to the appropriate registry.
3) The Router will auto‑discover it and include it in help.


## Router behavior and UX

- Case‑insensitive matching. Multi‑word command names are supported (e.g., "ATTACH DATABASE").
- Some commands are dot‑prefixed and must be typed exactly (e.g., ".exit" — typing "exit" is not recognized).
- Arguments: everything after the matched command name is split by whitespace and passed to execute(args).
- Help:
  - help — global help grouped by category (System commands, Database commands)
  - help `<command>` — per‑command help
  - `<command>` --help | -h | ? — per‑command help
- Suggestions: If the input is unknown, the router prints a suggestion based on:
  - Levenshtein distance (typo correction, including hints like clear → .clear)
  - Prefix heuristic for multi‑word commands (attach → ATTACH DATABASE)


## Database file format (header)

When creating a new database file, LiteCoreDB writes a 100‑byte header. When opening an existing file, the header is validated. If invalid, an error is printed and the DB is not attached.

Layout:
- Bytes 0..15 (16 bytes): Magic string "LiteCoreDB v1" (ASCII, NUL‑padded)
- Bytes 16..17 (2 bytes): Page size (uint16 LE); default 4096
- Bytes 18..99 (82 bytes): Reserved for future metadata (currently zeroed)

Implementation:
- Constants in src/constants/header.ts
- Header creation and validation inside src/commands/database/attach.ts

### ATTACH DATABASE path handling

ATTACH DATABASE accepts a filesystem path and follows it exactly, supporting:
- Tilde expansion: `~` and `~/...` resolve to your home directory.
- Relative paths: `./...` and `../...` are resolved against the current working directory.
- Absolute paths: `/...` are used as-is.

Behavior:
- Ensures the parent directory exists (mkdir -p) before creating a new file.
- If the file doesn’t exist, creates it and writes a 100-byte header.
- If the file exists, validates the header (magic string and non-zero page size). If invalid, prints an error and does not attach.

Examples:
- `ATTACH DATABASE ./dbs/my.db`
- `ATTACH DATABASE ../data/project.db`
- `ATTACH DATABASE ~/Database/mysql.db`
- `ATTACH DATABASE /var/lib/litecore/example.db`


## Session and prompt

The current session state lives in src/session.ts. When ATTACH DATABASE succeeds, it updates:
- session.dbPath — absolute path to the database file
- session.dbName — derived name (file basename without extension)

The prompt uses this to display either:
- "LiteCore> " when no database is attached
- "LiteCore - <db_name> >" when a database is attached (e.g., "LiteCore - mydb> ")


## Project structure

```
.
├─ src
│  ├─ app.ts                # REPL entrypoint
│  ├─ router.ts             # Regex‑powered command router
│  ├─ session.ts            # Session state for prompt/monitoring
│  ├─ interfaces
│  │  └─ command.ts         # Command interface
│  ├─ commands
│  │  ├─ system
│  │  │  ├─ clear.ts        # .clear
│  │  │  ├─ exit.ts         # .exit
│  │  │  └─ monitoring.ts   # .monitoring
│  │  └─ database
│  │     └─ attach.ts       # ATTACH DATABASE
│  ├─ helpers
│  │  └─ cli
│  │     ├─ history.ts      # REPL history utilities
│  │     ├─ monitoring.ts   # Metrics utilities (enable/disable/log)
│  │     ├─ prompt.ts       # computePrompt()
│  │     └─ welcome.ts      # printWelcome()
│  └─ constants
│     ├─ header.ts          # header constants (sizes, offsets)
│     ├─ monitoring.ts      # monitoring constants
│     └─ repl.ts            # REPL constants (history)
├─ tests
│  ├─ attach_command.test.ts
│  ├─ database_commands.test.ts
│  ├─ router.test.ts
│  └─ setup.ts
├─ package.json             # scripts: start, test, etc.
├─ tsconfig.json
└─ README.md
```


## Testing

This project uses Bun’s built‑in, Jest‑compatible test runner.

- Write tests in tests/*.test.ts using describe/it/expect from "bun:test".
- A separate test environment is configured via .env.test and a preloader at tests/setup.ts which forces NODE_ENV=test.

Commands:
- bun run test — run the test suite (loads .env.test and preloads tests/setup.ts)
- bun run test:watch — watch mode
- bun run test:cov — coverage
- bun run test:ci — coverage in CI (used by GitHub Actions)


## Continuous Integration

You can add a GitHub Actions workflow to run the test suite on push/PR. An example workflow may be added later.


## Roadmap (ideas)

- Additional database commands (e.g., DETACH, CREATE TABLE, INSERT, etc.).
- Page management and basic B‑tree or heap structures.
- Real SQL parsing for a useful subset.
- Better error messages and structured output.
- Configuration for page size and other header fields.


## License

MIT — see LICENSE (to be added if licensing is required for distribution).


---

## REPL history (persistent command history)

LiteCoreDB persists your REPL input history across sessions in a shell-like format.

- Location: ~/.litecore_history (config constant: src/constants/repl.ts → HISTORY_BASENAME)
- In-memory size: last 1000 entries by default (config constant: DEFAULT_HISTORY_SIZE)
- How it works:
  - On startup, the REPL loads the history file and feeds it to readline so you can navigate with Up/Down arrows.
  - Each non-empty line you enter is appended to the history file.
  - Lines starting with a leading space are ignored (matching common shells behavior).
  - Empty lines are ignored. Values are trimmed before being saved.
  - Readline expects the newest entry first; the on-disk file stores oldest-first. The helper adjusts ordering automatically.
- Implementation:
  - src/helpers/cli/history.ts (getHistoryFilePath, loadHistory, appendHistory, historyOptions)
  - src/constants/repl.ts (HISTORY_BASENAME, DEFAULT_HISTORY_SIZE)

Example
- Type a few commands, then exit and restart the REPL — your previous commands will be accessible with Up/Down arrows.


## Monitoring and performance metrics (.monitoring)

You can optionally collect per-command timing and write results to a JSONL log. Monitoring is disabled by default.

- Default: OFF (src/constants/monitoring.ts → DEFAULT_MONITORING_ENABLED)
- Log file: ~/.litecore_monitoring.log (src/constants/monitoring.ts → MONITOR_BASENAME)
- Toggle/status command: .monitoring
  - .monitoring — print current status and the target log file
  - .monitoring status — same as above
  - .monitoring true | on | enable — enable monitoring and print the log path
  - .monitoring false | off | disable — disable monitoring and print the log path
- Inline output: When ON, after each command the REPL prints a short summary like: [monitor] 12.34 ms
- JSONL schema: Each executed input line (non-empty) appends one JSON object per line to the log file:
  - ts: ISO timestamp when execution started
  - input: the raw input the user entered
  - ms: execution duration in milliseconds

Example JSONL entry
```
{"ts":"2025-10-05T13:20:00.000Z","input":"ATTACH DATABASE ./data.db","ms":12.34}
```

Exit behavior
- On .monitoring false and on .exit, the REPL prints the monitoring log path for discoverability.

Implementation
- src/helpers/cli/monitoring.ts (enableMonitoring, disableMonitoring, isMonitoringEnabled, logMetrics, printMonitoringLogPathIfAny)
- src/commands/system/monitoring.ts (.monitoring command)
- src/app.ts (integrates timing + logMetrics and prints inline summary when monitoring is ON)
- src/constants/monitoring.ts (MONITOR_BASENAME, DEFAULT_MONITORING_ENABLED)


## Updated project structure highlights

Newly relevant files for REPL UX and metrics:
- src/helpers/cli/history.ts — persistent history utilities
- src/helpers/cli/prompt.ts — computes dynamic prompt based on session
- src/helpers/cli/monitoring.ts — monitoring utilities and JSONL logging
- src/constants/repl.ts — REPL constants (history)
- src/constants/monitoring.ts — Monitoring constants


## Tests and covered scenarios

Run tests:
- bun run test

Covered scenarios include:
- Router
  - prints global help with available commands including .exit
  - requires leading dot for .exit and suggests .exit when 'exit' is typed
  - shows per-command help via 'help .exit'
  - groups global help by System and Database categories
- Database command suggestions
  - suggests 'ATTACH DATABASE' when user types 'attach' or 'ATTACH'
- ATTACH DATABASE
  - creates the database file with a valid 100-byte header when it does not exist
  - opens an existing database file with a valid header
  - prints an error when the existing file has an invalid header
  - prints usage when the path is missing
  - expands '~' to the home directory and avoids creating a literal '~' folder
  - resolves '../' and './' paths correctly

Note: Filesystem-dependent tests use temporary directories and perform clean-up after each test.
