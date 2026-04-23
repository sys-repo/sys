import {
  DEFAULTS,
  Http,
  Is,
  Net,
  Num,
  Path,
  Pkg,
  Process,
  Time,
  stripAnsi,
  type t,
  Url,
} from './common.ts';
import { Perf } from '../common/u.perf.ts';
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
  LOCAL_URL: /\bLocal:\s+(https?:\/\/[^\s]+)/i,
  NETWORK_URL: /\bNetwork:\s+(https?:\/\/[^\s]+)/i,
} as const;

/**
 * Run the <vite:dev> command (long-running spawn).
 */
export const dev: D = async (input) => {
  const { silent = false, pkg } = input;
  const startedAt = Time.now.timestamp as t.Msecs;
  const end = Perf.section('dev.parent.total', { cwd: input.cwd ?? '', silent });
  const paths = input.paths ?? (await Perf.measure('dev.parent.paths', async () => await Wrangle.pathsFromConfigfile(input.cwd), {
    cwd: input.cwd ?? '',
  }));
  const cwd = paths.cwd;
  const requestedPort = Net.port(input.port ?? DEFAULTS.port);
  const { dist } = await Perf.measure('dev.parent.dist', async () => await Pkg.Dist.load(Path.resolve('./dist/dist.json')), {
    cwd,
  });

  const requestedUrl = `http://localhost:${requestedPort}/`;
  let resolvedUrl = requestedUrl;
  let resolvedLocalUrl = '';
  const { args, env, dispose: disposeBootstrap } = await Perf.measure('dev.parent.command', async () => await Wrangle.command(
    paths,
    `dev --port=${requestedPort} --host`,
  ), { cwd, port: requestedPort });
  if (!silent && pkg) Log.Entry.log(pkg, Path.join(cwd, paths.app.entry));

  // Readiness from process output (fast path), or HTTP fallback:
  const readySignal: t.Process.ReadySignalFilter = (e) => {
    const lines = stripAnsi(e.toString())
      .split('\n')
      .map((line) => line.trim());
    let isReady = false;
    for (const line of lines) {
      const foundLocalUrl = DevParse.url(line, REGEX.LOCAL_URL);
      const foundNetworkUrl = DevParse.url(line, REGEX.NETWORK_URL);
      if (foundLocalUrl) resolvedLocalUrl = foundLocalUrl;
      if (!resolvedLocalUrl && foundNetworkUrl) resolvedUrl = foundNetworkUrl;
      if (
        REGEX.STARTED.test(line) || REGEX.DEV_RUNNING.test(line) ||
        REGEX.LOCAL_OR_NETWORK.test(line)
      ) {
        isReady = true;
      }
    }
    if (resolvedLocalUrl) resolvedUrl = resolvedLocalUrl;
    return isReady;
  };

  const proc = Process.spawn({
    cwd,
    args,
    env,
    silent,
    readySignal,
    dispose$: input.dispose$,
  });
  const { dispose } = proc;
  const cleanup = async () => {
    try {
      await dispose();
    } finally {
      await disposeBootstrap();
    }
  };

  try {
    const readyAbort = new AbortController();
    try {
      const waitForReady = Perf.section('dev.parent.waitForReady', { requestedUrl });
      await Promise.race([
        proc.whenReady().catch(() => new Promise<never>(() => {})), // NB: never resolve on failure
        Http.Client.waitFor(requestedUrl, {
          timeout: 30_000,
          interval: 150,
          signal: readyAbort.signal,
        }),
      ]);
      waitForReady({ resolvedUrl });
    } finally {
      readyAbort.abort();
    }
    await Perf.measure('dev.parent.waitForResolvedUrl', async () => await Http.Client.waitFor(resolvedUrl, { timeout: 30_000, interval: 150 }), {
      resolvedUrl,
    });
  } catch (error) {
    try {
      await cleanup();
    } catch {
      // Best effort cleanup: preserve original startup failure.
    }
    throw error;
  }

  const port = DevParse.port(resolvedUrl, requestedPort);
  Perf.log('dev.parent.ready', {
    requestedPort,
    port,
    requestedUrl,
    resolvedUrl,
    elapsed: Time.elapsed(startedAt).msec,
  });
  end({ port, resolvedUrl, elapsed: Time.elapsed(startedAt).msec });
  const keyboard = keyboardFactory({ pkg, dist, paths, port, url: resolvedUrl, dispose: cleanup });
  const listen = async () => void await keyboard();

  /**
   * API:
   */
  const api: t.ViteProcess = {
    port,
    url: resolvedUrl,
    listen,
    keyboard,
    get proc() {
      return proc;
    },

    // Lifecycle:
    dispose: cleanup,
    get dispose$() {
      return proc.dispose$;
    },
    get disposed() {
      return proc.disposed;
    },
  };
  return api;
};

/**
 * Standardised `dev` parsing helpers:
 */
export const DevParse = {
  url(line: string, pattern: RegExp) {
    const match = line.match(pattern);
    if (!match) return '';
    const parsed = Url.parse(match[1].trim());
    return parsed.ok ? parsed.href : '';
  },

  port(url: string, fallback: number) {
    const parsed = Url.parse(url);
    if (!parsed.ok) return fallback;

    const value = parsed.toURL().port;
    if (Is.blank(value)) return fallback;

    const port = Number(value);
    if (!Is.num(port)) return fallback;
    return Num.Is.int(port) ? port : fallback;
  },
} as const;
