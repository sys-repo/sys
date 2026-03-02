import type { t } from './common.ts';
import { asCommand } from './u.ts';

/**
 * Run a command with stdio inherited from the current terminal.
 */
export const inherit: t.ProcLib['inherit'] = async (config) => {
  const command = asCommand(config, {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const child = command.spawn();
  const status = await child.status;

  // Pass through Deno status as-is (including signal exits).
  return {
    code: status.code,
    success: status.success,
    signal: status.signal,
  };
};
