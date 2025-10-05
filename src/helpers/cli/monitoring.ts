/**
 * Monitoring utilities for the LiteCoreDB REPL.
 *
 * Provides an opt-in performance/metrics collection for each executed input line.
 * Metrics are printed inline when enabled and also appended as CSV rows to a log
 * file under the user's home directory.
 */
import {MONITOR_BASENAME, DEFAULT_MONITORING_ENABLED} from '~/constants/monitoring.ts';
import type {MetricEntry} from '~/interfaces/monitoring.ts';
import {session} from '~/session.ts';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';

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

export type { MetricEntry } from '@Interfaces/monitoring.ts';

/** CSV header for the monitoring log file. */
const CSV_HEADER = 'ts,input,ms,deltaHeapUsedBytes,deltaRssBytes,deltaExternalBytes,deltaArrayBuffersBytes,userMicros,systemMicros';

/** Escape a single CSV field according to RFC 4180-ish rules. */
function csvEscape(value: string): string {
    if (value === '') return '';
    const needsQuotes = /[",\n\r]/.test(value) || /^\s|\s$/.test(value);
    let v = value.replace(/"/g, '""');
    return needsQuotes ? `"${v}"` : v;
}

/** Convert a MetricEntry to a CSV row string (without trailing newline). */
function toCsv(entry: MetricEntry): string {
    const mem = entry.memory || {} as any;
    const cpu = entry.cpu || {} as any;
    const fields = [
        entry.ts,
        entry.input,
        String(entry.ms),
        mem.deltaHeapUsedBytes ?? '',
        mem.deltaRssBytes ?? '',
        mem.deltaExternalBytes ?? '',
        mem.deltaArrayBuffersBytes ?? '',
        cpu.userMicros ?? '',
        cpu.systemMicros ?? '',
    ].map((v) => v === '' ? '' : typeof v === 'string' ? csvEscape(v) : String(v));
    return fields.join(',');
}

/**
 * Append a metric entry to the log file in CSV format. Errors are ignored.
 */
export function logMetrics(entry: MetricEntry): void {
    const file = session.monitorLogPath || getMonitoringFilePath();
    try {
        // Determine if we need to write the header
        let needsHeader = false;
        try {
            if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
                needsHeader = true;
            }
        } catch {
            needsHeader = true;
        }
        const payload = (needsHeader ? CSV_HEADER + '\n' : '') + toCsv(entry) + '\n';
        fs.appendFile(file, payload, () => {});
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
