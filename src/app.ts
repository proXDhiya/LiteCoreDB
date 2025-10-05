/**
 * LiteCoreDB REPL entrypoint
 *
 * This module starts a simple readline-based REPL and delegates input handling to the Router.
 *
 * Flow
 * 1. Print a welcome banner with version and quick help.
 * 2. Prompt the user for input ("LiteCore> ").
 * 3. On each line, pass the raw input to Router.command().
 * 4. Router resolves the command (case-insensitive; supports ".exit") and executes it or prints help.
 */
import { printWelcome } from "~/helpers/cli/welcome.ts";
import * as readline from 'node:readline';
import { session } from './session.ts';
import { Router } from './router';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\nLiteCore> ',
});

const router = new Router();

function computePrompt(): string {
    return session.dbName ? `\nLiteCore - ${session.dbName}> ` : '\nLiteCore> ';
}

printWelcome();
rl.setPrompt(computePrompt());
rl.prompt();

rl.on('line', (line) => {
    const input = line.trim();
    router.command(input);
    rl.setPrompt(computePrompt());
    rl.prompt();
});
