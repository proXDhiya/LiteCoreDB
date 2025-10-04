import {escapeRegex, normalizeName} from './helpers/strings';
import {SystemCommands} from './commands/system/_index';
import {DatabaseCommands} from './commands/database/_index.ts';
import type {Command} from '@Interfaces/command';
import {levenshtein} from './helpers/distance';
import {isHelpToken} from './helpers/help';

/**
 * Router
 *
 * A small, regex-powered command router for the LiteCoreDB REPL.
 *
 * What it does
 * - Parses user input and supports multi-word command names (e.g., "ATTACH DATABASE").
 * - Routes to a matching command by name, case-insensitive.
 * - Commands are matched by their exact canonical name (case-insensitive). For example, system commands like exit are available only as ".exit".
 * - Supports arguments: the text after the matched command name is split by whitespace and passed to execute(args).
 * - Provides global help ("help") and per-command help ("help <cmd>", "<cmd> --help", "-h", "?").
 * - Suggests the closest command using Levenshtein distance when unknown commands are entered.
 *
 * Extensibility
 * - Commands live in registries (e.g., SystemCommands, DatabaseCommands). Add new commands by adding new instances to a registry.
 * - Commands implement the Command interface (name, description, help, execute).
 */

export class Router {
    private readonly commands: Command[];
    private readonly systemCommands: Command[];
    private readonly databaseCommands: Command[];

    constructor() {
        const sysValues = Object.values(SystemCommands) as unknown[];
        const dbValues = Object.values(DatabaseCommands) as unknown[];

        const sys: Command[] = [];
        const db: Command[] = [];

        const isCommandLike = (maybe: unknown): maybe is Command => {
            return !!maybe &&
                typeof maybe === 'object' &&
                typeof (maybe as any).name === 'function' &&
                typeof (maybe as any).description === 'function' &&
                typeof (maybe as any).help === 'function' &&
                typeof (maybe as any).execute === 'function';
        };

        for (const maybe of sysValues) {
            if (isCommandLike(maybe)) sys.push(maybe);
        }
        for (const maybe of dbValues) {
            if (isCommandLike(maybe)) db.push(maybe);
        }

        this.systemCommands = sys;
        this.databaseCommands = db;
        this.commands = [...sys, ...db];
    }

    /**
     * Routes a single line of user input.
     *
     * Behavior
     * - Empty input is ignored.
     * - If the first token is a help token (help, --help, -h,), prints global help or per-command help.
     * - Otherwise, finds a matching command (case-insensitive) and executes it.
     */
    public command(input: string): void {
        const raw = input.trim();
        if (!raw) return;

        // Tokenize by whitespace for quick checks
        const tokens = raw.split(/\s+/);
        const [first = ""] = tokens;
        const rest = tokens.slice(1);

        // Global help handlers
        if (isHelpToken(first)) {
            if (rest.length === 0) {
                this.printGlobalHelp();
                return;
            }
            // help <command name possibly multi-word>
            const targetRaw = rest.join(" ").trim();
            const cmd = this.findCommandByExactName(targetRaw);
            if (cmd) {
                cmd.help();
            } else {
                console.log(`Unknown command for help: ${targetRaw}`);
                // Suggest based on the first token after help
                const needle = rest[0] ?? targetRaw;
                if (needle) this.suggestClosest(needle);
            }
            return;
        }

        // Find a command whose name matches at the start of the input (case-insensitive)
        const match = this.findCommandAtStart(raw);
        if (!match) {
            console.log(`Unknown command: ${first}`);
            this.suggestClosest(first);
            return;
        }
        const { cmd, matchedLen } = match;

        // Remaining after the command name are arguments
        const argStr = raw.slice(matchedLen).trim();
        const args = argStr ? argStr.split(/\s+/) : [];

        // If a user asked for help about this command via flags in args
        if (args.some(isHelpToken)) {
            cmd.help();
            return;
        }

        // Execute command
        try {
            cmd.execute(args);
        } catch (e) {
            console.error('Command failed:', e);
        }
    }

    /** Finds a command by exact name (case-insensitive). Useful for "help <command>". */
    private findCommandByExactName(token: string): Command | undefined {
        const query = token.trim();
        for (const c of this.commands) {
            const name = c.name();
            const reExact = new RegExp(`^${escapeRegex(name)}$`, 'i');
            if (reExact.test(query)) return c;
        }
        return undefined;
    }

    /**
     * Finds the command that matches at the very start of the input.
     * Returns the command and the matched length so the caller can slice out args.
     */
    private findCommandAtStart(input: string): { cmd: Command; matchedLen: number } | undefined {
        let best: { cmd: Command; matchedLen: number } | undefined;
        for (const c of this.commands) {
            const name = c.name();
            const re = new RegExp(`^${escapeRegex(name)}(?=\\s|$)`, 'i');
            const m = input.match(re);
            if (m && m[0]) {
                const len = m[0].length;
                if (!best || len > best.matchedLen) {
                    best = { cmd: c, matchedLen: len };
                }
            }
        }
        return best;
    }


    /** Prints the global help, listing all available commands grouped by category with a short description. */
    private printGlobalHelp(): void {
        console.log('Available commands:');

        if (this.systemCommands.length) {
            console.log('\nSystem commands:');
            for (const c of this.systemCommands) {
                console.log(`  ${c.name()} - ${c.description()}`);
            }
        }

        if (this.databaseCommands.length) {
            console.log('\nDatabase commands:');
            for (const c of this.databaseCommands) {
                console.log(`  ${c.name()} - ${c.description()}`);
            }
        }

        console.log('\nTips:');
        console.log('  Type "help <command>" or "<command> --help" to learn more.');
    }

    /**
     * Suggests the closest command name using Levenshtein distance, if within a small threshold.
     *
     * This helps users discover the intended command when a typo is entered.
     */
    private suggestClosest(input: string): void {
        const needle = normalizeName(input);

        // 1) Try Levenshtein suggestion first (helps with typos and dot-less variants)
        const scores = this.commands.map(c => ({ c, score: levenshtein(needle, normalizeName(c.name())) }));
        scores.sort((a, b) => a.score - b.score);
        const best = scores[0];
        if (best && best.score <= 3) {
            console.log(`Did you mean: ${best.c.name()} ?`);
            return;
        }

        // 2) If no close typo match, try a word-prefix suggestion for multi-word commands.
        //    Example: input "attach" => suggest "ATTACH DATABASE".
        if (needle.length >= 3) {
            const prefixCandidate = this.commands.find(c => {
                const n = normalizeName(c.name());
                return n.startsWith(needle + " ");
            });
            if (prefixCandidate) {
                console.log(`Did you mean: ${prefixCandidate.name()} ?`);
                return;
            }
        }

        console.log('Type "help" to see available commands.');
    }

}
