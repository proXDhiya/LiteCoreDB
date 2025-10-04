/**
 * LiteCoreDB REPL entrypoint
 *
 * This module starts a simple readline-based REPL and delegates input handling to the Router.
 *
 * Flow
 * 1. Prompt the user for input ("LiteCode> ").
 * 2. On each line, pass the raw input to Router.command().
 * 3. Router resolves the command (case-insensitive; supports ".exit") and executes it or prints help.
 */
import * as readline from 'node:readline';
import { Router } from './router';
import { session } from './session.ts';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\nLiteCode> ',
});

const router = new Router();

function computePrompt(): string {
    return session.dbName ? `\nLiteCode - ${session.dbName}> ` : '\nLiteCode> ';
}

rl.setPrompt(computePrompt());
rl.prompt();

rl.on('line', (line) => {
    const input = line.trim();
    router.command(input);
    rl.setPrompt(computePrompt());
    rl.prompt();
});
