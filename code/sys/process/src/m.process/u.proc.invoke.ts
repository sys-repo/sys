import type { t } from './common.ts';
import { asCommand, printOutput, toProcOutput } from './u.ts';

/**
 * Run a <unix> command (argv) and wait for response.
 */
export const invoke: t.Process.Lib['invoke'] = async (config) => {
  const { silent } = config;
  const command = asCommand(config);
  const output = await command.output();
  const res = toProcOutput(output);
  if (!silent) printOutput(res.code, res.stdout, res.stderr);
  return res;
};

/**
 * Fire-and-forget invocation:
 * - spawns a child
 * - detaches stdio
 * - unrefs the process so the parent can exit immediately
 * - returns only the PID
 */
export const invokeDetached: t.Process.Lib['invokeDetached'] = (config) => {
  const command = asCommand(config, {
    stdin: 'null',
    stdout: 'null',
    stderr: 'null',
  });

  const child = command.spawn();
  // Allow parent process to exit regardless of child state.
  try {
    // Supported in Deno 2.x. No-op if not available.
    child.unref?.();
  } catch {
    /* ignore */
  }

  return { pid: child.pid };
};
