import { type t, DEFAULTS, Http, Net, Path, Pkg, Process, stripAnsi } from './common.ts';
import { keyboardFactory } from './u.keyboard.ts';
import { Log, Wrangle } from './u.ts';

type D = t.ViteLib['dev'];

export const REGEX = {
  // Example matches:
  //  "VITE v7.1.9  ready in 123 ms"
  //  "Vite v7.1.9-beta.1 ready in 87ms"
  STARTED: /\bvite\s+v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\s+ready\s+in\s+\d+\s*ms\b/i,

  // Example matches:
  //  "Dev server running at:"
  DEV_RUNNING: /\bdev\s+server\s+running\s+at\b/i,

  // Example matches:
  //  "Local:   http://localhost:5173/"
  //  "Network: http://192.168.1.100:5173/"
  LOCAL_OR_NETWORK: /\b(?:Local|Network):\s+https?:\/\/[^\s/]+(?::\d+)?\/?/i,
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

  // Readiness from process output (fast path), or HTTP fallback:
  const readySignal: t.ProcReadySignalFilter = (e) => {
    const lines = stripAnsi(e.toString())
      .split('\n')
      .map((line) => line.trim());
    return lines.some(
      (line) =>
        REGEX.STARTED.test(line) ||
        REGEX.DEV_RUNNING.test(line) ||
        REGEX.LOCAL_OR_NETWORK.test(line),
    );
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
