/**
 * LiteCoreDB REPL entrypoint.
 *
 * Starts a readline-based REPL, displays a welcome banner, and delegates input
 * handling to the Router. Prompt rendering and history persistence are handled
 * via helpers under src/helpers/cli.
 */
import { appendHistory, historyOptions } from '~/helpers/cli/history.ts';
import { printWelcome } from "~/helpers/cli/welcome.ts";
import { computePrompt } from '~/helpers/cli/prompt.ts';
import * as readline from 'node:readline';
import { Router } from './router';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\nLiteCore> ',
    ...historyOptions,
});

const router = new Router();

printWelcome();
rl.setPrompt(computePrompt());
rl.prompt();

rl.on('line', (line) => {
    appendHistory(line);

    const input = line.trim();
    router.command(input);
    rl.setPrompt(computePrompt());
    rl.prompt();
});
