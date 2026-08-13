import {
  DEFAULTS,
  Http,
  Is,
  Net,
  Num,
  Path,
  Pkg,
  Process,
  Rx,
  stripAnsi,
  type t,
  Time,
  Url,
} from '../common.ts';
import { Perf } from '../../common/u.perf.ts';
import { DevOutputLog } from './u.dev.output.ts';
import { DevScreen } from './u.dev.screen.ts';
import { keyboardFactory } from './u.keyboard.ts';
import { Log } from './u.log.ts';
import { Wrangle } from './u.wrangle.ts';

const STARTING_DEV_SERVER = 'starting dev server…';

const SUPPRESS_VISIBLE_OUTPUT = [
  /**
   * Deno auto-discovers the consumer `deno.json` while this driver also passes a
   * generated `--import-map=...` for the child Vite CLI. Projection has already
   * merged the consumer `deno.json.importMap` into that generated map, so Deno's
   * warning is true but benign for this path. Suppress it only from the visible
   * screen/recent-output tail; raw passthrough and retained stderr remain truthful.
   */
  /^Warning\s+the configuration file "file:\/\/\/.+?" contains an entry for "importMap" that is being ignored\.?$/,

  /**
   * The parent screen reporter seeds the visible log with this startup affordance
   * before the child has produced output. If the child/toolchain emits the same
   * startup-kind line, keep the visible log stable by suppressing the duplicate
   * child row. Raw passthrough mode is unaffected.
   */
  /^starting(?:\s+(?:vite|dev\s+server))?(?:\.{3}|…)?$/i,
];

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
export const dev: t.Vite.Lib['dev'] = async (input) => devWithDeps(input);

/** Internal dependency seam for deterministic lifecycle tests. */
export async function devWithDeps(input: t.Vite.Dev.Args, deps: t.ViteDevDeps = {}) {
  const parsedSubpath = Pkg.Subpath.parse(input.pkgSubpath);
  if (parsedSubpath.kind === 'invalid') throw new Error('Vite.dev: invalid package subpath.');
  if (parsedSubpath.kind === 'valid' && !input.pkg) {
    throw new Error('Vite.dev: package subpath requires package metadata.');
  }
  const pkgSubpath = parsedSubpath.kind === 'valid' ? parsedSubpath.value : undefined;
  const { silent = false, pkg, strictPort = false } = input;
  const waitForHttp = deps.waitForHttp ?? Http.Client.waitFor;
  const createScreen = deps.createScreen ?? DevScreen.create;
  const reporterMode = DevScreen.resolveReporter(input.reporter, {
    silent,
    hasPkg: Boolean(pkg),
  });
  const parentOwnsOutput = reporterMode === 'screen';
  const startedAt = Time.now.timestamp as t.Msecs;
  const end = Perf.section(
    'dev.parent.total',
    { cwd: input.cwd ?? '', silent, reporter: reporterMode },
    { level: 1 },
  );
  const paths = input.paths ??
    (await Perf.measure(
      'dev.parent.paths',
      async () => await Wrangle.pathsFromConfigfile(input.cwd),
      {
        cwd: input.cwd ?? '',
      },
      { level: 2 },
    ));
  const cwd = paths.cwd;
  const preferredPort = input.port ?? DEFAULTS.port;
  let requestedPort: number;
  try {
    requestedPort = strictPort ? Net.port(preferredPort, { throw: true }) : Net.port(preferredPort);
  } catch (cause) {
    throw startupError({ cwd, requestedPort: preferredPort, strictPort, cause });
  }
  const { dist } = await Perf.measure(
    'dev.parent.dist',
    async () => await Pkg.Dist.load(Path.resolve('./dist/dist.json')),
    {
      cwd,
    },
    { level: 2 },
  );

  const requestedUrl = `http://localhost:${requestedPort}/`;
  let resolvedUrl = requestedUrl;
  let resolvedLocalUrl = '';
  const { args, env, dispose: disposeBootstrap } = await Perf.measure(
    'dev.parent.command',
    async () =>
      await Wrangle.command(
        paths,
        `dev --port=${requestedPort} --host${strictPort ? ' --strictPort' : ''}`,
      ),
    { cwd, port: requestedPort },
    { level: 2 },
  );
  if (!silent && !parentOwnsOutput && pkg) Log.Entry.log(pkg, Path.join(cwd, paths.app.entry));

  // Readiness from process output establishes the resolved URL; HTTP confirms it serves.
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

  const logLines = DevScreen.logLines(input.logLines);
  const output = DevOutputLog.create({
    maxLines: Math.max(40, logLines),
    suppressVisible: SUPPRESS_VISIBLE_OUTPUT,
  });
  if (parentOwnsOutput && pkg) output.pushDisplay('stdout', STARTING_DEV_SERVER);
  let proc: t.Process.Handle;
  try {
    proc = Process.spawn({
      cwd,
      args,
      env,
      silent: silent || parentOwnsOutput,
      readySignal,
    });
  } catch (error) {
    try {
      await disposeBootstrap();
    } catch {
      // Preserve the process construction failure.
    }
    throw startupError({ cwd, requestedPort, strictPort, output, cause: error });
  }

  let screen: t.ViteDev.Screen.Reporter | undefined;
  const startupAbort = new AbortController();
  const procUntil = proc.dispose$.pipe(
    Rx.map((event) => ({ reason: event.payload.reason })),
  );
  let life: t.LifecycleAsync;
  try {
    life = Rx.lifecycleAsync([input.until, procUntil], async (e) => {
      if (!startupAbort.signal.aborted) startupAbort.abort(e.reason);
      try {
        screen?.dispose();
      } finally {
        try {
          await proc.dispose(e.reason);
        } finally {
          await disposeBootstrap();
        }
      }
    });
  } catch (error) {
    try {
      await proc.dispose(error);
    } catch {
      // Preserve the outer lifecycle construction failure.
    }
    try {
      await disposeBootstrap();
    } catch {
      // Preserve the outer lifecycle construction failure.
    }
    throw startupError({ cwd, requestedPort, strictPort, output, cause: error });
  }

  try {
    const identity: t.Cli.Fmt.Header.PackageIdentity | undefined = pkg && pkgSubpath
      ? { root: pkg, subpath: pkgSubpath }
      : pkg;
    screen = parentOwnsOutput && identity
      ? createScreen({
        identity,
        dist,
        paths,
        url: () => resolvedUrl,
        output,
        logLines,
        until: life.dispose$,
      })
      : undefined;
    const pushOutput = (e: t.Process.Event) => {
      output.push(e);
      screen?.outputChanged();
    };
    proc.onStdOut(pushOutput);
    proc.onStdErr(pushOutput);

    const waitForReady = Perf.section('dev.parent.waitForReady', { requestedUrl }, { level: 2 });
    await proc.whenReady();
    waitForReady({ resolvedUrl });

    await Perf.measure(
      'dev.parent.waitForResolvedUrl',
      async () =>
        await waitForHttp(resolvedUrl, {
          timeout: 30_000,
          interval: 150,
          signal: startupAbort.signal,
        }),
      {
        resolvedUrl,
      },
      { level: 2 },
    );

    const port = DevParse.port(resolvedUrl, requestedPort);
    if (strictPort && port !== requestedPort) {
      throw new Error(
        `Vite.dev: strict port mismatch: requested ${requestedPort}, resolved ${port}.`,
      );
    }

    Perf.log('dev.parent.ready', {
      requestedPort,
      port,
      requestedUrl,
      resolvedUrl,
      elapsed: Time.elapsed(startedAt).msec,
    }, { level: 1 });
    end({ port, resolvedUrl, elapsed: Time.elapsed(startedAt).msec });
    screen?.ready();

    const keyboard = keyboardFactory({
      cwd,
      url: resolvedUrl,
      until: life.dispose$,
      dispose: life.dispose,
    });
    const listen = async () => void await keyboard();

    /**
     * API:
     */
    const api: t.Vite.Dev.Process = {
      port,
      url: resolvedUrl,
      listen,
      keyboard,
      get proc() {
        return proc;
      },

      // Lifecycle:
      dispose: life.dispose,
      [Symbol.asyncDispose]: life[Symbol.asyncDispose],
      get dispose$() {
        return life.dispose$;
      },
      get disposed() {
        return life.disposed;
      },
    };
    return api;
  } catch (error) {
    try {
      await life.dispose(error);
    } catch {
      // Best effort cleanup: preserve the startup failure.
    }
    throw startupError({ cwd, requestedPort, strictPort, output, cause: error });
  }
}

function startupError(args: {
  cwd: t.StringDir;
  requestedPort: number;
  strictPort: boolean;
  output?: t.ViteDev.Output.Log;
  cause: unknown;
}) {
  const { cwd, requestedPort, strictPort, cause, output } = args;
  const stderr = output?.stderr().trim() ?? '';
  const tail = output?.tailText().trimEnd() ?? '';
  const mode = strictPort ? ' strict' : '';
  const message = [
    `Vite.dev: failed to start${mode} dev server on port ${requestedPort}.`,
    `cwd: ${cwd}`,
    stderr ? `stderr:\n${stderr}` : '',
    tail ? `recent output:\n${tail}` : '',
  ].filter(Boolean).join('\n\n');
  return new Error(message, { cause });
}

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
