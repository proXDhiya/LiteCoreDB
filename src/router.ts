import {escapeRegex, normalizeName} from './helpers/strings';
import {SystemCommands} from './commands/system/_index';
import type {Command} from '@Interfaces/command';
import {levenshtein} from './helpers/distance';
import {isHelpToken} from './helpers/help';

/**
 * Router
 *
 * A small, regex-powered command router for the LiteCoreDB REPL.
 *
 * What it does
 * - Parse user input into tokens.
 * - Routes to a matching command by name, case-insensitive.
 * - Commands are matched by the exact name (case-insensitive). For example, exit is available only as ".exit".
 * - Provides global help ("help") and per-command help ("help <cmd>", "<cmd> --help", "-h", "?").
 * - Suggests the closest command using Levenshtein distance when unknown commands are entered.
 *
 * Extensibility
 * - Commands live in registries (e.g., SystemCommands). Add new commands by adding new instances to a registry.
 * - Commands implement the Command interface (name, description, help, execute).
 */

export class Router {
    private readonly commands: Command[];

    constructor() {
        const systemList = Object.values(SystemCommands) as unknown[];
        const cmd: Command[] = [];
        for (const maybe of systemList) {
            if (
                maybe &&
                typeof maybe === 'object' &&
                typeof (maybe as any).name === 'function' &&
                typeof (maybe as any).description === 'function' &&
                typeof (maybe as any).help === 'function' &&
                typeof (maybe as any).execute === 'function'
            ) {
                cmd.push(maybe as Command);
            }
        }
        this.commands = cmd;
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

        // Tokenize by whitespace
        const tokens = raw.split(/\s+/);
        const [first = ''] = tokens;
        const rest = tokens.slice(1);

        // Global help handlers
        if (isHelpToken(first)) {
            if (rest.length === 0) {
                this.printGlobalHelp();
                return;
            }
            // help <command>
            const target = rest[0]!;
            const cmd = this.findCommandByToken(target);
            if (cmd) {
                cmd.help();
            } else {
                console.log(`Unknown command for help: ${target}`);
                this.suggestClosest(target);
            }
            return;
        }

        // Match command by regex (case-insensitive, optional leading dot)
        const cmd = this.findCommandByToken(first);
        if (!cmd) {
            console.log(`Unknown command: ${first}`);
            this.suggestClosest(first);
            return;
        }

        // If a user asked for help about this command via flags in rest
        if (rest.some(isHelpToken)) {
            cmd.help();
            return;
        }

        // Execute command (args ignored for now; interface has no args)
        try {
            cmd.execute();
        } catch (e) {
            console.error('Command failed:', e);
        }
    }

    /** Finds the command that matches a token (case-insensitive; requires exact name, including any leading dot). */
    private findCommandByToken(token: string): Command | undefined {
        for (const c of this.commands) {
            const name = c.name();
            // Match only the exact command name (case-insensitive). No optional leading dot handling.
            const reExact = new RegExp(`^${escapeRegex(name)}$`, 'i');
            if (reExact.test(token)) return c;
        }
        return undefined;
    }


    /** Prints the global help, listing all available commands with a short description. */
    private printGlobalHelp(): void {
        console.log('Available commands:');
        for (const c of this.commands) {
            const n = c.name();
            console.log(`  ${n} - ${c.description()}`);
        }
        console.log('Tips:');
        console.log('  Type "help <command>" or "<command> --help" to learn more.');
        console.log('  Command matching is case-insensitive. Some commands require a leading "." (e.g., .exit).');
    }

    /**
     * Suggests the closest command name using Levenshtein distance, if within a small threshold.
     *
     * This helps users discover the intended command when a typo is entered.
     */
    private suggestClosest(input: string): void {
        const needle = normalizeName(input);
        const scores = this.commands.map(c => ({c, score: levenshtein(needle, normalizeName(c.name()))}));
        scores.sort((a, b) => a.score - b.score);
        const best = scores[0];
        if (best && best.score <= 3) {
            console.log(`Did you mean: ${best.c.name()} ?`);
        } else {
            console.log('Type "help" to see available commands.');
        }
    }

}
