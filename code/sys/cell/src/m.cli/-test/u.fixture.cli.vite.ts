import { spawn } from 'node:child_process';
import { kill } from 'node:process';
import { expect, Is, Testing, Time } from '../../-test.ts';
import { Cli, stripAnsi } from '../common.ts';
import { CellSession } from '../u/u.session.ts';

type VitePtyMode = 'keyboard' | 'keyboard-ci' | 'sigint' | 'sigterm' | 'forced';

/**
 * Independent PTY measurement, not the production launcher's restoration implementation.
 * Process.capture cannot inherit stdin; Process.inherit cannot capture the saved mode.
 */
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

/** Same real PTY assertions for the CI cases and the separate animated-signal follow-up. */
export async function proveVitePty(mode: VitePtyMode): Promise<void> {
  const listener = Deno.listen({ hostname: 'localhost', port: 5173 });
  listener.close();
  const runtime = await Testing.dir('CellCli.vite.pty');
  const entry = './src/m.cli/-test/u.fixture.cli.vite.pty.ts';
  const args = Deno.build.os === 'darwin'
    ? ['-q', '/dev/null', Deno.execPath(), 'run', '-P=test', entry, mode]
    : ['-q', '-e', '-c', `exec "$CELL_PTY_DENO" run -P=test ${entry} ${mode}`, '/dev/null'];
  const proof = spawnCliProof(args, {
    [CellSession.D.env]: runtime.dir,
    CELL_PTY_DENO: Deno.execPath(),
    TERM: 'xterm-256color',
  }, 'script');
  try {
    await Time.waitFor(() => {
      if (proof.failure) throw proof.failure;
      for (const owner of proof.output.matchAll(/PTY_OWNER:(\d+)/g)) {
        proof.ownGroup(Number(owner[1]));
      }
      const marker = mode === 'forced'
        ? 'PTY_FORCED_READY'
        : mode === 'sigint' || mode === 'sigterm'
        ? 'PTY_SIGNAL_READY'
        : 'PTY_KEYBOARD_READY';
      if (proof.output.includes(marker)) return true;
      if (proof.status) throw new Error(`PTY exited before readiness:\n${proof.output}`);
      return false;
    }, { interval: 100, timeout: 120_000 });
    const resize = proof.output.split('PTY_RESIZE_BEGIN')[1]?.split('PTY_RESIZE_END')[0] ?? '';
    // Terminal repaint is the contract here: assert a real frame arrived after a kernel
    // window-size change, then measure its rendered rows independently of ANSI styling.
    expect(resize).to.contain('\u001b[?2026h');
    expect(stripAnsi(resize)).to.contain('view --mode=dev');
    const rows = resize.split(/\u001b\[\d+;1H\u001b\[2K/).slice(1);
    expect(rows.length).to.be.greaterThan(0);
    for (const row of rows) {
      expect(Cli.Fmt.Text.Width.measure(stripAnsi(row).trim())).to.be.at.most(47);
    }
    if (mode === 'keyboard' || mode === 'keyboard-ci') proof.child.stdin!.write('\u0003');
    const status = await Time.waitFor(() => proof.status, { interval: 50, timeout: 15_000 });
    expect(status, proof.output).to.eql({ code: 0, signal: null });
    expect(proof.output).to.contain('PTY_RESTORED');
  } finally {
    await proof.stop();
  }
}
