import { type t } from '../common.ts';
import { pid as terminatePid } from './u.pid.ts';
import { tcpListeners } from './u.port/u.discovery.ts';
import { portStatus, uniquePids } from './u.port/u.result.ts';
import { targetOf } from './u.port/u.target.ts';

/**
 * Discover TCP LISTEN sockets matching a local port target.
 */
export async function listeners(input: t.Process.Port.Input) {
  return await tcpListeners(targetOf(input));
}

/**
 * Terminate TCP listener process ids bound to a local port target.
 */
export async function port(
  input: t.Process.Port.Input,
  options: t.Process.Terminate.Options = {},
): Promise<t.Process.Terminate.Port.Result> {
  const target = targetOf(input);
  const listeners = await tcpListeners(target);
  const pids = uniquePids(listeners);
  const results: t.Process.Terminate.Result[] = [];

  for (const pid of pids) results.push(await terminatePid(pid, options));

  return {
    target,
    listeners,
    results,
    status: portStatus(listeners, results),
  };
}
