# LiteCoreDB

A minimal SQL database learning project powered by Bun.js and TypeScript. LiteCoreDB provides a small REPL ("LiteCode>") with a regex‑driven command router, a pluggable command system (System and Database categories), and an on‑disk database file with a simple 100‑byte header inspired by SQLite.

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
LiteCode - mydb> 
```


## Architecture overview

Top‑level components and their responsibilities:

- REPL entrypoint (src/app.ts)
  - Starts a readline loop and delegates each input line to the Router.
  - Dynamically computes the prompt based on session.dbName.
- Router (src/router.ts)
  - Discovers commands from registries.
  - Regex‑matches command names (case‑insensitive), including multi‑word names (e.g., "ATTACH DATABASE").
  - Parses arguments (tokens after the matched command name).
  - Supports global help and per‑command help tokens (help, --help, -h, ?).
  - Suggests the closest command for unknown input (Levenshtein + prefix heuristics).
  - Important: some system commands require a leading dot (e.g., ".exit").
- Commands (src/commands)
  - System commands (src/commands/system): .exit, .clear
  - Database commands (src/commands/database): ATTACH DATABASE
  - Each command implements the Command interface and is registered via a registry class (SystemCommands, DatabaseCommands).
- Helpers (src/helpers)
  - cli/
    - help.ts: isHelpToken
    - welcome.ts: printWelcome
  - db/
    - header.ts: createHeader, isValidHeader
    - database_file.ts: ensureDatabaseFile (create/validate DB file with header)
  - fs/
    - paths.ts: resolveUserPath (expands ~, resolves ./ and ../), ensureParentDir
  - text/
    - strings.ts: escapeRegex, normalizeName
    - distance.ts: levenshtein
- Constants (src/constants)
  - header.ts: constants for the on‑disk header (size, offsets, defaults).
- Session (src/session.ts)
  - Holds session state (dbPath, dbName) used by the REPL to render the prompt.
- Tests (tests/*)
  - Bun’s Jest‑compatible test runner with a test‑only environment.
- CI (/.github/workflows/ci.yml)
  - Simple GitHub Actions workflow that installs Bun and runs the test suite on push/PR.

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
- Helpers in src/helpers/db/header.ts
- Used by ATTACH DATABASE in src/commands/database/attach.ts

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
│  ├─ session.ts            # Session state for prompt
│  ├─ interfaces
│  │  └─ command.ts
│  ├─ commands
│  │  ├─ system
│  │  │  ├─ _index.ts       # SystemCommands registry
│  │  │  ├─ exit.ts         # .exit
│  │  │  └─ clear.ts        # .clear
│  │  └─ database
│  │     ├─ _index.ts       # DatabaseCommands registry
│  │     └─ attach.ts       # ATTACH DATABASE
│  ├─ helpers
│  │  ├─ cli
│  │  │  ├─ help.ts          # isHelpToken
│  │  │  └─ welcome.ts       # printWelcome
│  │  ├─ db
│  │  │  ├─ header.ts        # createHeader, isValidHeader
│  │  │  └─ database_file.ts # ensureDatabaseFile
│  │  ├─ fs
│  │  │  └─ paths.ts         # resolveUserPath, ensureParentDir
│  │  └─ text
│  │     ├─ strings.ts       # escapeRegex, normalizeName
│  │     └─ distance.ts      # levenshtein
│  └─ constants
│     └─ header.ts          # header constants (sizes, offsets)
├─ tests                    # Bun test files
├─ .github/workflows/ci.yml # GitHub Actions (Bun CI)
├─ package.json             # scripts: start, test, etc.
└─ tsconfig.json
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

GitHub Actions workflow: .github/workflows/ci.yml
- Checks out the repo, installs Bun and dependencies, ensures .env.test exists, then runs the test suite with coverage.


## Roadmap (ideas)

- Additional database commands (e.g., DETACH, CREATE TABLE, INSERT, etc.).
- Page management and basic B‑tree or heap structures.
- Real SQL parsing for a useful subset.
- Better error messages and structured output.
- Configuration for page size and other header fields.


## License

MIT — see LICENSE (to be added if licensing is required for distribution).
