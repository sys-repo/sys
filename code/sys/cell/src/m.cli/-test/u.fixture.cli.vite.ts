import { spawn } from 'node:child_process';
import { kill } from 'node:process';
import { Is, Time } from '../../-test.ts';

/** Only groups acquired by this proof; never infer process ownership from a listening port. */
export function killOwnedGroup(pid: number) {
  try {
    kill(Deno.build.os === 'windows' ? pid : -pid, 'SIGKILL');
  } catch (error) {
    if (!Is.record(error) || error.code !== 'ESRCH') throw error;
  }
}

/** One isolated proof invocation, with bounded output and explicit group acquisition. */
export function spawnCliProof(
  args: readonly string[],
  env: Record<string, string> = {},
  cmd = Deno.execPath(),
) {
  const child = spawn(cmd, [...args], {
    cwd: Deno.cwd(),
    env: { ...Deno.env.toObject(), ...env },
    detached: Deno.build.os !== 'windows',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const groups = new Set<number>();
  if (child.pid) groups.add(child.pid);
  let output = '';
  let failure: Error | undefined;
  let status: { code: number | null; signal: string | null } | undefined;
  const decoder = new TextDecoder();
  const capture = (chunk: Uint8Array) => {
    output = `${output}${decoder.decode(chunk)}`.slice(-200_000);
  };
  child.stdout?.on('data', capture);
  child.stderr?.on('data', capture);
  child.on('error', (error) => (failure ??= error));
  child.once('close', (code, signal) => (status = { code, signal }));

  return {
    child,
    get output() {
      return output;
    },
    get failure() {
      return failure;
    },
    get status() {
      return status;
    },
    /** Acquire only a leader reported by this live invocation, never by stale-record discovery. */
    ownGroup(pid: number) {
      groups.add(pid);
    },
    async stop() {
      for (const pid of [...groups].reverse()) {
        killOwnedGroup(pid);
        groups.delete(pid);
      }
      await Time.waitFor(() => status, { interval: 50, timeout: 5_000 });
    },
  };
}
