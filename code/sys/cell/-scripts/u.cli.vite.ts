import { type ChildProcess, spawn } from 'node:child_process';
import { constants } from 'node:os';
import { kill } from 'node:process';
import { Cli, Is, Path } from '../src/m.cli/common.ts';

const ENTRY = Path.fromFileUrl(new URL('../src/m.cli/mod.ts', import.meta.url));
const SHUTDOWN_GRACE = 5_000;
const KILL_SETTLE = 5_000;

/** Run the trusted sample; the optional entry is a module-local process-proof seam. */
export async function runVite(argv: readonly string[], entry = ENTRY): Promise<number> {
  const posix = Deno.build.os !== 'windows';
  const terminal = posix && Cli.Is.terminal('stdin') ? await stty(['-g']) : undefined;
  const bindings: Array<{ signal: Deno.Signal; handler: () => void }> = [];
  const failures: unknown[] = [];
  let child: ChildProcess | undefined;
  let exited = false;
  let shutdownRequested = false;
  let groupTerminationAttempted = false;
  let grace: ReturnType<typeof setTimeout> | undefined;
  let settle: ReturnType<typeof setTimeout> | undefined;
  let resolveStatus: (code: number) => void = () => undefined;
  const status = new Promise<number>((resolve) => (resolveStatus = resolve));
  const attempt = (fn: () => void) => {
    try {
      fn();
    } catch (error) {
      failures.push(error);
    }
  };

  // The group was created by this spawn, not found by port, process name or session discovery.
  // Leader exit still cleans up surviving descendants, but never re-signals a group already
  // targeted by the grace deadline. Retire this authority before the syscall, including on
  // failure: errors remain visible through `attempt`, and are not retried against a stale PGID.
  const killGroup = () => {
    if (!child?.pid || groupTerminationAttempted) return;
    groupTerminationAttempted = true;
    try {
      if (posix) kill(-child.pid, 'SIGKILL');
      else if (!exited) child.kill('SIGKILL');
    } catch (error) {
      if (!Is.record(error) || error.code !== 'ESRCH') throw error;
    }
  };
  const shutdown = (signal: 'SIGINT' | 'SIGTERM') => {
    if (shutdownRequested || exited || !child) return;
    shutdownRequested = true;
    // `deno task` may deliver one interrupt twice. Coalesce requests during a fixed grace;
    // never depend on another signal to terminate a stalled cleanup, or extend that deadline.
    grace = setTimeout(() => {
      attempt(killGroup);
      settle = setTimeout(() => {
        failures.push(new Error('Cell Vite child did not settle after forced shutdown.'));
        resolveStatus(137);
      }, KILL_SETTLE);
    }, SHUTDOWN_GRACE);
    attempt(() => child?.kill(signal));
  };
  const bind = (signal: Deno.Signal, handler: () => void) => {
    Deno.addSignalListener(signal, handler);
    bindings.push({ signal, handler });
  };

  let code: number;
  try {
    bind('SIGINT', () => shutdown('SIGINT'));
    if (posix) {
      bind('SIGTERM', () => shutdown('SIGTERM'));
      bind('SIGHUP', () => shutdown('SIGTERM'));
      bind('SIGWINCH', () => {
        if (!exited) attempt(() => child?.kill('SIGWINCH'));
      });
    }

    // Separate the child from terminal/task signal duplication while preserving real terminal
    // stdio. Process.inherit exposes neither an owned signal target nor a process group.
    child = spawn(Deno.execPath(), ['run', '-A', entry, ...argv], {
      cwd: Deno.cwd(),
      stdio: 'inherit',
      detached: posix,
    });
    child.on('error', (error) => failures.push(error));
    child.once('exit', () => {
      exited = true;
      attempt(killGroup);
    });
    child.once('close', (code, signal) => {
      resolveStatus(code ?? (signal ? 128 + constants.signals[signal] : 1));
    });
    code = await status;
  } finally {
    clearTimeout(grace);
    clearTimeout(settle);
    for (const { signal, handler } of bindings) {
      attempt(() => Deno.removeSignalListener(signal, handler));
    }
    // Graceful Cell shutdown restores its keyboard owner. A forced exit cannot do so: restore
    // the exact input mode captured before delegation, rather than guessing cooked defaults.
    if (terminal !== undefined) {
      try {
        await stty([terminal]);
      } catch (error) {
        failures.push(error);
      }
    }
  }
  if (failures.length) throw new AggregateError(failures, 'Cell Vite launcher failed.');
  return code;
}

// Mixed stdio is essential: Process.capture cannot inherit stdin; Process.inherit cannot
// capture the saved mode. Keep the native terminal adapter local to this launcher.
async function stty(args: readonly string[]): Promise<string> {
  const child = new Deno.Command('stty', {
    args: [...args],
    stdin: 'inherit',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  let failure: unknown;
  const timer = setTimeout(() => {
    failure = new Error('Cell Vite terminal-mode operation timed out.');
    try {
      child.kill('SIGKILL');
    } catch (error) {
      if (!Is.error(error) || error.name !== 'NotFound') failure = error;
    }
  }, 2_000);
  try {
    const res = await child.output();
    if (failure) throw failure;
    const decoder = new TextDecoder();
    if (!res.success) {
      throw new Error(`Cell Vite terminal mode: ${decoder.decode(res.stderr).trim()}`);
    }
    return decoder.decode(res.stdout).trim();
  } finally {
    clearTimeout(timer);
  }
}
