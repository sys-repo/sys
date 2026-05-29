import { Is, Num, type t, Time } from './common.ts';

const DEFAULT_TIMEOUT = 1_000 as t.Msecs;
const POLL_INTERVAL = 25 as t.Msecs;

/** Determine whether an OS process currently accepts signal delivery. */
export function isRunning(pid: number) {
  assertPid(pid);
  const output = new Deno.Command('kill', {
    args: ['-0', String(pid)],
    stdout: 'null',
    stderr: 'null',
  }).outputSync();
  return output.success;
}

/** Terminate an arbitrary process id with bounded graceful escalation. */
export async function pid(
  pid: number,
  options: t.Process.Terminate.Options = {},
): Promise<t.Process.Terminate.Result> {
  assertPid(pid);

  const timeout = timeoutOf(options.timeout);
  const actions: t.Process.Terminate.Action[] = [];

  if (!isRunning(pid)) return result(pid, 'not-running', actions);

  if (options.force) {
    actions.push(signal(pid, 'SIGKILL'));
    return result(pid, await statusAfterKill(pid, timeout, 'killed'), actions);
  }

  actions.push(signal(pid, 'SIGTERM'));
  if (await waitUntilGone(pid, timeout)) return result(pid, 'terminated', actions);

  actions.push(signal(pid, 'SIGKILL'));
  return result(pid, await statusAfterKill(pid, timeout, 'killed'), actions);
}

/**
 * Helpers:
 */
function assertPid(pid: number) {
  if (!Is.num(pid) || !Num.Is.safeInt(pid) || pid < 1) {
    throw new Error(`Process.pid: invalid pid: ${String(pid)}.`);
  }
}

function timeoutOf(input?: t.Msecs): t.Msecs {
  if (input === undefined) return DEFAULT_TIMEOUT;
  if (!Is.num(input) || !Num.Is.safeInt(input) || input < 0) {
    throw new Error(`Process.Terminate.pid: invalid timeout: ${String(input)}.`);
  }
  return input;
}

function signal(pid: number, signal: Deno.Signal): t.Process.Terminate.Action {
  try {
    Deno.kill(pid, signal);
    return { signal, ok: true };
  } catch (error) {
    return { signal, ok: false, error };
  }
}

async function statusAfterKill(
  pid: number,
  timeout: t.Msecs,
  status: t.Process.Terminate.Status,
) {
  return await waitUntilGone(pid, timeout) ? status : 'still-running';
}

async function waitUntilGone(pid: number, timeout: t.Msecs) {
  if (!isRunning(pid)) return true;

  const startedAt = Time.now.timestamp;
  while (Time.now.timestamp - startedAt < timeout) {
    await Time.wait(POLL_INTERVAL);
    if (!isRunning(pid)) return true;
  }

  return !isRunning(pid);
}

function result(
  pid: number,
  status: t.Process.Terminate.Status,
  actions: readonly t.Process.Terminate.Action[],
): t.Process.Terminate.Result {
  return { pid, status, actions };
}
