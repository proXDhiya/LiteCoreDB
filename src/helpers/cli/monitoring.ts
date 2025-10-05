/**
 * Monitoring utilities for the LiteCoreDB REPL.
 *
 * Provides an opt-in performance/metrics collection for each executed input line.
 * Metrics are printed inline when enabled and also appended to a log file under
 * the user's home directory.
 */
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {session} from '~/session.ts';
import {MONITOR_BASENAME, DEFAULT_MONITORING_ENABLED} from '~/constants/monitoring.ts';

/**
 * Compute the absolute path to the monitoring log file.
 */
export function getMonitoringFilePath(): string {
    const home = os.homedir?.() || process.env.HOME || '.';
    return path.join(home, MONITOR_BASENAME);
}

/** Ensure the monitoring log file exists (touch-like); ignore errors. */
export function ensureMonitoringFile(): string {
    const file = session.monitorLogPath || getMonitoringFilePath();
    try {
        fs.appendFileSync(file, '');
    } catch {
        // ignore
    }
    return file;
}

/** Enable monitoring for the current session. */
export function enableMonitoring(): string {
    session.monitoringEnabled = true;
    session.monitorLogPath = session.monitorLogPath || getMonitoringFilePath();
    return ensureMonitoringFile();
}

/** Disable monitoring for the current session. */
export function disableMonitoring(): void {
    session.monitoringEnabled = false;
}

/** Whether monitoring is enabled this session. */
export function isMonitoringEnabled(): boolean {
    return !!session.monitoringEnabled;
}

export interface MetricEntry {
    /** ISO timestamp when the command started. */
    ts: string;
    /** Raw input text entered by the user. */
    input: string;
    /** Execution duration in milliseconds. */
    ms: number;
}

/**
 * Append a metric entry to the log file. Errors are ignored.
 */
export function logMetrics(entry: MetricEntry): void {
    const file = session.monitorLogPath || getMonitoringFilePath();
    try {
        const line = JSON.stringify(entry) + '\n';
        fs.appendFile(file, line, () => {
        });
    } catch {
        // ignore write errors
    }
}

/**
 * Print the log path to the console if monitoring was initialized.
 */
export function printMonitoringLogPathIfAny(): void {
    const file = session.monitorLogPath || getMonitoringFilePath();
    // Only print the monitoring log path when monitoring is currently enabled.
    // If monitoring is off, do not print anything on exit.
    if (session.monitoringEnabled) {
        console.log(`Monitoring log: ${file}`);
    }
}

// Initialize defaults for clarity when the module is loaded
if (session.monitoringEnabled === undefined) {
    session.monitoringEnabled = DEFAULT_MONITORING_ENABLED;
}
if (!session.monitorLogPath) {
    session.monitorLogPath = getMonitoringFilePath();
}
