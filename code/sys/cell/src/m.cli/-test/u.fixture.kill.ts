import { Fs, Str, type t, Testing, Time } from '../../-test.ts';
import { CellSession } from '../u/u.session.ts';

export const DEAD_PID = 999_999_999;

const HOLD_SERVICE_SOURCE = Str.dedent(`
  export const HoldService = {
    start() {
      return {
        finished: new Promise(() => undefined),
        close() {},
        status() {
          return { state: 'ready' };
        },
      };
    },
  };
`).trimStart();

export async function cellFixture(name: string) {
  const fs = await Testing.dir(name);
  await Fs.write(
    Fs.join(fs.dir, '-cell/cell.yaml'),
    Str.dedent(`
      kind: cell
      version: 1
    `).trimStart(),
  );
  return fs;
}

export async function addHoldService(root: string) {
  await Fs.write(
    Fs.join(root, '-cell/cell.yaml'),
    Str.dedent(`
      kind: cell
      version: 1

      services:
        - name: hold
          use: HoldService
          from: ./-services/hold.ts
          config: ./-config/hold.yaml
    `).trimStart(),
  );
  await Fs.write(Fs.join(root, '-services/hold.ts'), HOLD_SERVICE_SOURCE);
}

export function sessionOf(input: {
  readonly id?: string;
  readonly root: string;
  readonly mode?: t.Cell.Services.ServiceMode;
  readonly pid?: number;
  readonly updatedAt?: t.UnixTimestamp;
}): CellSession.Session {
  const now = Time.now.timestamp;
  return {
    id: input.id ?? 'session',
    root: input.root,
    mode: input.mode ?? 'default',
    pid: input.pid ?? Deno.pid,
    startedAt: now,
    updatedAt: input.updatedAt ?? now,
    state: 'ready',
    services: [],
  };
}

export async function sessionRoot(root: string) {
  const real = await Fs.realPath(root);
  return real as t.StringDir;
}

export async function writeSession(dir: string, session: CellSession.Session) {
  await CellSession.write(session, { dir });
  return session;
}

export async function withRuntimeDir<T>(dir: string, fn: () => Promise<T>) {
  const key = CellSession.D.env;
  const previous = Deno.env.get(key);
  Deno.env.set(key, dir);
  try {
    return await fn();
  } finally {
    if (previous === undefined) Deno.env.delete(key);
    else Deno.env.set(key, previous);
  }
}

export async function runCellCli(
  argv: readonly string[],
  options: { readonly cwd: string; readonly runtime: string },
) {
  return await runDenoCellCli(Fs.join(Deno.cwd(), 'src/m.cli/mod.ts'), argv, {
    cwd: options.cwd,
    runtime: options.runtime,
  });
}

export async function runRootCellCli(
  argv: readonly string[],
  options: { readonly runtime: string },
) {
  return await runDenoCellCli(Fs.join(Deno.cwd(), 'src/mod.ts'), argv, {
    cwd: Deno.cwd(),
    runtime: options.runtime,
  });
}

export function spawnCellStart(root: string, runtime: string) {
  return new Deno.Command(Deno.execPath(), {
    args: ['run', '-P=test', './src/m.cli/mod.ts', 'start', root],
    cwd: Deno.cwd(),
    env: { [CellSession.D.env]: runtime },
    stdin: 'null',
    stdout: 'null',
    stderr: 'null',
  }).spawn();
}

export async function waitForSession(root: string, dir: string, pid: number) {
  return await Time.waitFor(async () => {
    const sessions = await CellSession.list(await sessionRoot(root), { dir });
    return sessions.find((session) => session.pid === pid && session.state === 'ready');
  }, { interval: 50, timeout: 5_000 });
}

export async function cleanup(child: Deno.ChildProcess) {
  try {
    child.kill('SIGKILL');
  } catch {
    // Ignore best-effort cleanup failures in the test finalizer.
  }

  try {
    await child.status;
  } catch {
    // Ignore child status races after forced cleanup.
  }
}

async function runDenoCellCli(
  entry: string,
  argv: readonly string[],
  options: { readonly cwd: string; readonly runtime: string },
) {
  return await new Deno.Command(Deno.execPath(), {
    args: ['run', '--config', Fs.join(Deno.cwd(), 'deno.json'), '-P=test', entry, ...argv],
    cwd: options.cwd,
    env: { [CellSession.D.env]: options.runtime },
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}
