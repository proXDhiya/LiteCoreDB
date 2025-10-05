import type {Command} from '@Interfaces/command';
import {
    disableMonitoring,
    enableMonitoring,
    isMonitoringEnabled,
    getMonitoringFilePath
} from '~/helpers/cli/monitoring.ts';

/**
 * MonitoringCommand
 *
 * Toggle REPL performance/metrics collection.
 *
 * Usage:
 *   .monitoring           # show current status
 *   .monitoring status    # show current status
 *   .monitoring true      # enable monitoring and print target log path
 *   .monitoring false     # disable monitoring and print log path
 */
export class MonitoringCommand implements Command {
    public name(): string {
        return '.monitoring';
    }

    public description(): string {
        return 'Enable/disable metrics collection and show status';
    }

    public help(): void {
        console.log('Toggle metrics collection for each command. When enabled,');
        console.log('LiteCoreDB will print execution time after each command and append');
        console.log('metrics to a log file in your home directory.');
        console.log('\nUsage:');
        console.log('  .monitoring');
        console.log('  .monitoring status');
        console.log('  .monitoring true');
        console.log('  .monitoring false');
    }

    public execute(args?: string[]): void {
        const token = (args?.[0] || '').toLowerCase();

        if (token === 'true' || token === 'on' || token === 'enable') {
            const file = enableMonitoring();
            console.log(`Monitoring enabled. Logging to: ${file}`);
            return;
        }
        if (token === 'false' || token === 'off' || token === 'disable') {
            const file = getMonitoringFilePath();
            disableMonitoring();
            console.log(`Monitoring disabled. Log file: ${file}`);
            return;
        }

        // status (default)
        const enabled = isMonitoringEnabled();
        const file = getMonitoringFilePath();
        console.log(`Monitoring: ${enabled ? 'ON' : 'OFF'}`);
        console.log(`Log file: ${file}`);
    }
}
