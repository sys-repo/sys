import { type t, DEFAULTS, Http, Net, Path, Pkg, Process, stripAnsi } from './common.ts';
import { keyboardFactory } from './u.keyboard.ts';
import { Log, Wrangle } from './u.ts';

type D = t.ViteLib['dev'];

export const REGEX = {
  STARTED: /VITE v\d+\.\d+\.\d+\s+ready in\s+\d+\s*ms/i,
  LOCAL: /\bLocal:\s+https?:\/\/[^\s/]+(?::\d+)?\/?/i,
} as const;

/**
 * Run the <vite:dev> command (long-running spawn).
 */
export const dev: D = async (input) => {
  const { silent = false, pkg } = input;
  const paths = await Wrangle.pathsFromConfigfile(input.cwd);
  const cwd = paths.cwd;
  const port = Net.port(input.port ?? DEFAULTS.port);
  const { dist } = await Pkg.Dist.load(Path.resolve('./dist/dist.json'));

  const url = `http://localhost:${port}/`;
  const { args } = await Wrangle.command(paths, `dev --port=${port} --host --strictPort`);
  if (!silent && pkg) Log.Entry.log(pkg, Path.join(cwd, paths.app.entry));

  // Readiness from process output (fast path), or HTTP fallback.
  const readySignal: t.ProcReadySignalFilter = (e) => {
    return stripAnsi(e.toString())
      .split('\n')
      .map((line) => line.trim())
      .some((line) => REGEX.STARTED.test(line) || REGEX.LOCAL.test(line));
  };

  const proc = Process.spawn({ cwd, args, silent, readySignal, dispose$: input.dispose$ });
  const { dispose } = proc;
  const keyboard = keyboardFactory({ pkg, dist, paths, port, url, dispose });

  const listen = async () => {
    await keyboard();
  };

  await Promise.race([
    proc.whenReady().catch(() => new Promise<never>(() => {})), //   NB: never resolve on failure
    Http.Client.waitFor(url, { timeout: 30_000, interval: 150 }),
  ]);

  /**
   * API:
   */
  const api: t.ViteProcess = {
    port,
    url,
    listen,
    keyboard,
    get proc() {
      return proc;
    },

    // Lifecycle:
    dispose,
    get dispose$() {
      return proc.dispose$;
    },
    get disposed() {
      return proc.disposed;
    },
  };
  return api;
};
