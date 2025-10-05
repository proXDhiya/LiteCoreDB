/**
 * LiteCoreDB REPL entrypoint.
 *
 * Starts a readline-based REPL, displays a welcome banner, and delegates input
 * handling to the Router. Prompt rendering and history persistence are handled
 * via helpers under src/helpers/cli.
 */
import {isMonitoringEnabled, logMetrics} from '~/helpers/cli/monitoring.ts';
import {appendHistory, historyOptions} from '~/helpers/cli/history.ts';
import {printWelcome} from "~/helpers/cli/welcome.ts";
import {computePrompt} from '~/helpers/cli/prompt.ts';
import * as readline from 'node:readline';
import {Router} from './router';

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
    const start = (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') ? performance.now() : Date.now();

    // Capture baseline resource usage
    const memStart = typeof process.memoryUsage === 'function' ? process.memoryUsage() : undefined as unknown as NodeJS.MemoryUsage | undefined;
    const cpuStart = typeof process.cpuUsage === 'function' ? process.cpuUsage() : undefined as unknown as NodeJS.CpuUsage | undefined;

    router.command(input);

    const end = (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') ? performance.now() : Date.now();
    const ms = end - start;

    if (input && isMonitoringEnabled()) {
        const ts = new Date().toISOString();

        // Compute deltas after execution
        const memEnd = typeof process.memoryUsage === 'function' ? process.memoryUsage() : undefined as unknown as NodeJS.MemoryUsage | undefined;
        const cpuDiff = (typeof process.cpuUsage === 'function' && cpuStart)
            ? process.cpuUsage(cpuStart as NodeJS.CpuUsage)
            : undefined;

        const memory = (memStart && memEnd)
            ? {
                deltaHeapUsedBytes: memEnd.heapUsed - memStart.heapUsed,
                deltaRssBytes: memEnd.rss - memStart.rss,
                deltaExternalBytes: (memEnd as any).external !== undefined && (memStart as any).external !== undefined
                    ? (memEnd as any).external - (memStart as any).external
                    : undefined,
                deltaArrayBuffersBytes: (memEnd as any).arrayBuffers !== undefined && (memStart as any).arrayBuffers !== undefined
                    ? (memEnd as any).arrayBuffers - (memStart as any).arrayBuffers
                    : undefined,
            }
            : undefined;

        const cpu = cpuDiff
            ? { userMicros: cpuDiff.user, systemMicros: cpuDiff.system }
            : undefined;

        console.log(`[monitor] ${ms.toFixed(2)} ms`);
        logMetrics({ts, input, ms, memory, cpu});
    }

    rl.setPrompt(computePrompt());
    rl.prompt();
});
