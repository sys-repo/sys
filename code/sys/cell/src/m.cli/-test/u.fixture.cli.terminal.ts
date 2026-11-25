import { expect, Is, kill, spawn, Time } from './common.ts';

/** Read or set the proof PTY mode with inherited input and captured output. */
export async function stty(args: readonly string[]) {
  const child = new Deno.Command('stty', {
    args: [...args],
    stdin: 'inherit',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  let failure: unknown;
  const timer = setTimeout(() => {
    failure = new Error('PTY terminal-mode operation timed out.');
    try {
      child.kill('SIGKILL');
    } catch (error) {
      if (!Is.error(error) || error.name !== 'NotFound') failure = error;
    }
  }, 2_000);
  try {
    const result = await child.output();
    if (failure) throw failure;
    expect(result.code, new TextDecoder().decode(result.stderr)).to.eql(0);
    return new TextDecoder().decode(result.stdout).trim();
  } finally {
    clearTimeout(timer);
  }
}

/** Only groups acquired by this proof; never infer process ownership from a listening port. */
export function killOwnedGroup(pid: number) {
  try {
    kill(-pid, 'SIGKILL');
  } catch (error) {
    if (!Is.record(error) || error.code !== 'ESRCH') throw error;
  }
}

/** One isolated proof invocation, with bounded output and explicit group acquisition. */
export function spawnPtyProof(args: readonly string[], env: Record<string, string>) {
  const child = spawn('script', [...args], {
    cwd: Deno.cwd(),
    env: { ...Deno.env.toObject(), ...env },
    detached: true,
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
