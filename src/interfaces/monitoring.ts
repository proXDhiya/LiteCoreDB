/**
 * Monitoring interfaces for metrics produced by the REPL.
 *
 * These interfaces describe the in-memory structure of a single metrics record
 * which is serialized to a CSV row in the monitoring log. The shape mirrors the
 * documentation in README.md and the fields produced by src/app.ts when
 * monitoring is enabled.
 */

/**
 * Per-command memory usage deltas in bytes.
 */
export interface MemoryDelta {
  /** Difference in heapUsed (bytes) between the end and the start of command execution. */
  deltaHeapUsedBytes: number;
  /** Difference in Resident Set Size (bytes) between end and start. */
  deltaRssBytes: number;
  /** Optional difference in external memory (bytes) if available on the platform/runtime. */
  deltaExternalBytes?: number;
  /** Optional difference in ArrayBuffers memory (bytes) if available. */
  deltaArrayBuffersBytes?: number;
}

/**
 * Per-command CPU time usage in microseconds, as reported by process.cpuUsage().
 */
export interface CpuUsageEntry {
  /** Microseconds of user CPU time consumed by the command. */
  userMicros: number;
  /** Microseconds of system CPU time consumed by the command. */
  systemMicros: number;
}

/**
 * MetricEntry represents a single monitoring record written to the CSV log.
 */
export interface MetricEntry {
  /** ISO timestamp captured at the end of command execution (or around it). */
  ts: string;
  /** The raw input line as typed by the user. */
  input: string;
  /** Execution duration in milliseconds. */
  ms: number;
  /** Optional memory usage deltas for this command. */
  memory?: MemoryDelta;
  /** Optional CPU usage for this command. */
  cpu?: CpuUsageEntry;
}
