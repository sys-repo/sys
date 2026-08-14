import {
  Files,
  FilesStatic,
  FsPkg,
  HttpServer,
  pkg,
  Rx,
  Schedule,
  serveFileBytes,
  type t,
  Time,
} from '../common.ts';
import { Cli } from '@sys/cli';
import { Open } from '@sys/process';
import {
  acceptsFetchSite,
  acceptsWorkerDestination,
  admitsVerifiedBrowserPolicy,
  applyBrowserHeaders,
  browserRejected,
  type BrowserRuntime,
  createBrowserRuntime,
  provisionalBrowserHeaders,
} from './u.browser.ts';
import { DistServerError, startError, startupReason } from './u.error.ts';
import { acceptedAuthorities, acceptsHost, exactAuthority } from './u.host.ts';
import { DistServeScreen } from './u.serve.screen.ts';
import { snapshotServeInput, snapshotServeLocalInput } from './u.input/u.serve.ts';
import { snapshotStartInput, snapshotStartLocalInput } from './u.input/u.start.ts';
import { requestPath } from './u.path.ts';
import { readAsset } from './u.read.ts';

export type StartDependencies = {
  readonly verify: t.FsPkg.Dist.Pinned.Verify.Method;
  readonly verifyLocal: t.FsPkg.Dist.Local.Verify.Method;
  readonly readPart: t.FsPkg.Dist.Pinned.ReadPart.Method;
  readonly fromDist: typeof FilesStatic.fromDist;
  readonly createApp: typeof HttpServer.create;
  readonly startHttp: typeof HttpServer.start;
  readonly serveBytes: typeof serveFileBytes;
};

export const DEFAULT_DEPENDENCIES: StartDependencies = Object.freeze({
  verify: FsPkg.Dist.Pinned.verify,
  verifyLocal: FsPkg.Dist.Local.verify,
  readPart: FsPkg.Dist.Pinned.readPart,
  fromDist: FilesStatic.fromDist,
  createApp: HttpServer.create,
  startHttp: HttpServer.start,
  serveBytes: serveFileBytes,
});

/** Start one checksum-pinned local Dist host. */
export const start: (input: t.DistServer.Start.Args) => Promise<t.DistServer.Started> = (input) =>
  startWith(input, DEFAULT_DEPENDENCIES);

/** Blocking terminal-ownership startup for pinned authority. */
export const serve: (input: t.DistServer.Serve.Args) => Promise<void> = (input) =>
  serveWith(input, DEFAULT_DEPENDENCIES);

/** Explicit locally verified, unpinned authority family. */
export const Local: t.DistServer.Local.Lib = Object.freeze({
  start: (input) => startLocalWith(input, DEFAULT_DEPENDENCIES),
  serve: (input) => serveLocalWith(input, DEFAULT_DEPENDENCIES),
});

/** Internal deterministic dependency seam. */
export async function startWith(
  input: unknown,
  deps: StartDependencies,
  options: StartRunOptions = {},
): Promise<t.DistServer.Started> {
  const prepared = snapshotStartInput(input);
  if (!prepared.ok) throw startError(prepared.reason);

  let life: t.Abortable;
  try {
    life = Rx.abortable(prepared.value.until);
  } catch {
    throw startError('invalid-input');
  }

  try {
    await Schedule.micro();
    if (life.signal.aborted) throw startError('cancelled');

    let verified: t.FsPkg.Dist.Verify.Result;
    try {
      verified = await deps.verify({
        dir: prepared.value.dir,
        integrity: prepared.value.integrity,
        limits: prepared.value.limits,
        until: life.signal,
      });
    } catch {
      throw startError('startup-failure');
    }

    if (verified.kind !== 'verified') throw startError(verified.kind);
    if (life.signal.aborted) throw startError('cancelled');

    return await serveVerified(
      prepared.value,
      verified.evidence,
      { kind: 'pinned', integrity: prepared.value.integrity },
      life,
      deps,
      options,
    );
  } catch (cause) {
    life?.dispose();
    if (DistServerError.is(cause)) throw cause;
    throw startError('startup-failure');
  }
}

/** Internal deterministic local-hosting dependency seam. */
export async function startLocalWith(
  input: unknown,
  deps: StartDependencies,
  options: StartRunOptions = {},
): Promise<t.DistServer.Started> {
  const prepared = snapshotStartLocalInput(input);
  if (!prepared.ok) throw startError(prepared.reason);

  let life: t.Abortable;
  try {
    life = Rx.abortable(prepared.value.until);
  } catch {
    throw startError('invalid-input');
  }

  try {
    await Schedule.micro();
    if (life.signal.aborted) throw startError('cancelled');

    let verified: t.FsPkg.Dist.Verify.Result;
    try {
      verified = await deps.verifyLocal({
        dir: prepared.value.dir,
        limits: prepared.value.limits,
        until: life.signal,
      });
    } catch {
      throw startError('startup-failure');
    }

    if (verified.kind !== 'verified') throw startError(verified.kind);
    if (life.signal.aborted) throw startError('cancelled');

    return await serveVerified(
      prepared.value,
      verified.evidence,
      { kind: 'local-unpinned', integrity: verified.evidence.integrity },
      life,
      deps,
      options,
    );
  } catch (cause) {
    life?.dispose();
    if (DistServerError.is(cause)) throw cause;
    throw startError('startup-failure');
  }
}

type ServeMode = 'screen' | 'raw';

type ServeKeyboard = {
  readonly enabled: boolean;
  readonly print: boolean;
  readonly exit: boolean;
  readonly http: t.HttpServer.Start.Options['keyboard'];
};

type StartRunOptions = {
  readonly strictPort?: boolean;
  readonly rawOutput?: boolean;
  readonly rawAuthority?: string;
};

type ServeLoopInput = {
  readonly keyboard: ServeKeyboard;
  readonly dir: t.StringDir;
  readonly pkgSubpath?: string;
};

type ServeEffects = {
  readonly bindKeyboard: typeof Cli.Keyboard.bind;
  readonly createScreen: typeof DistServeScreen.create;
  readonly open: (origin: t.StringUrl) => void | Promise<void>;
  readonly now: () => t.UnixTimestamp;
};

type ServeOutcome =
  | { readonly kind: 'server'; readonly ok: true }
  | { readonly kind: 'server'; readonly ok: false; readonly cause: unknown }
  | { readonly kind: 'screen'; readonly cause: unknown }
  | { readonly kind: 'keyboard'; readonly ok: true }
  | { readonly kind: 'keyboard'; readonly ok: false; readonly cause: unknown };

const DEFAULT_SERVE_EFFECTS: ServeEffects = Object.freeze({
  bindKeyboard: Cli.Keyboard.bind,
  createScreen: DistServeScreen.create,
  open: (origin) => Open.invokeDetached(Deno.cwd() as t.StringDir, origin, { silent: true }),
  now: () => Time.now.timestamp,
});

/** Blocking pinned startup with terminal ownership (raw print or interactive screen). */
export async function serveWith(
  input: unknown,
  deps: StartDependencies,
  effects: ServeEffects = DEFAULT_SERVE_EFFECTS,
): Promise<void> {
  const prepared = snapshotServeInput(input);
  if (!prepared.ok) throw startError(prepared.reason);
  const { pkgSubpath, start: value } = prepared.value;
  const mode = wrangle.serveMode(value.silent);
  const keyboard = wrangle.serveKeyboard(value.keyboard);
  const started = await startWith(
    {
      ...value,
      silent: mode === 'screen' ? true : value.silent ?? false,
      keyboard: mode === 'screen' ? false : keyboard.http,
    },
    deps,
    {
      strictPort: true,
      rawOutput: mode === 'raw',
      rawAuthority: `pinned ${value.integrity}`,
    },
  );
  await serveLoop(started, mode, {
    dir: value.dir,
    keyboard,
    ...(pkgSubpath === undefined ? {} : { pkgSubpath }),
  }, effects);
}

/** Blocking local startup with terminal ownership (raw print or interactive screen). */
export async function serveLocalWith(
  input: unknown,
  deps: StartDependencies,
  effects: ServeEffects = DEFAULT_SERVE_EFFECTS,
): Promise<void> {
  const prepared = snapshotServeLocalInput(input);
  if (!prepared.ok) throw startError(prepared.reason);
  const { pkgSubpath, start: value } = prepared.value;
  const mode = wrangle.serveMode(value.silent);
  const keyboard = wrangle.serveKeyboard(value.keyboard);
  const started = await startLocalWith(
    {
      ...value,
      silent: mode === 'screen' ? true : value.silent ?? false,
      keyboard: mode === 'screen' ? false : keyboard.http,
    },
    deps,
    {
      strictPort: false,
      rawOutput: mode === 'raw',
      rawAuthority: 'local (UNPINNED)',
    },
  );
  await serveLoop(started, mode, {
    dir: value.dir,
    keyboard,
    ...(pkgSubpath === undefined ? {} : { pkgSubpath }),
  }, effects);
}

async function serveVerified(
  input: t.DistServer.Start.Args | t.DistServer.Local.Args,
  evidence: t.FsPkg.Dist.Verify.Evidence,
  authority: t.DistServer.Started['authority'],
  life: t.Abortable,
  deps: StartDependencies,
  options: StartRunOptions = {},
): Promise<t.DistServer.Started> {
  let started: t.HttpServer.Started | undefined;
  const strictPort = options.strictPort ?? true;

  try {
    const browserPolicy = input.browserPolicy;
    if (browserPolicy && !admitsVerifiedBrowserPolicy(browserPolicy, evidence)) {
      throw startError('invalid-input');
    }

    let backing: t.FilesStatic.Readonly;
    try {
      backing = deps.fromDist({
        dist: evidence.dist,
        policy: Files.Policy.readonly('**'),
      });
    } catch {
      throw startError('startup-failure');
    }

    const app = deps.createApp({ static: false, cors: false });
    const hosts = { hosts: undefined as undefined | ReadonlySet<string> };
    const provisionalHeaders = browserPolicy ? provisionalBrowserHeaders() : undefined;
    let browserRuntime: BrowserRuntime | undefined;
    const readSignal = () => started?.signal ?? life.signal;
    app.all('*', async (context) => {
      const request = context.req.raw;
      const browserHeaders = browserRuntime?.responseHeaders ?? provisionalHeaders;
      if (!hosts.hosts || !acceptsHost(request, hosts.hosts)) {
        return hostRejected(browserHeaders);
      }

      try {
        if (browserPolicy && !acceptsFetchSite(request)) {
          return browserRejected(403, browserHeaders!);
        }

        const path = requestPath(request);
        if (
          browserPolicy &&
          (!browserRuntime ||
            !acceptsWorkerDestination(
              request,
              path,
              browserPolicy,
              browserRuntime.directWorkerAssets,
            ))
        ) {
          return browserRejected(403, browserHeaders!);
        }

        const response = !path
          ? await deps.serveBytes({
            req: request,
            path: 'invalid',
            cache: 'no-store',
            read: () => Promise.resolve({ kind: 'missing' }),
          })
          : await deps.serveBytes({
            req: request,
            path,
            cache: 'no-store',
            read: () => {
              const signal = readSignal();
              return readAsset({
                backing,
                dir: input.dir,
                path,
                signal,
                until: signal,
                deps,
              });
            },
          });
        return browserHeaders ? applyBrowserHeaders(response, browserHeaders) : response;
      } catch (cause) {
        if (browserHeaders) return browserRejected(500, browserHeaders);
        throw cause;
      }
    });

    if (life.signal.aborted) throw startError('cancelled');
    try {
      started = deps.startHttp(app, {
        hostname: input.hostname,
        port: input.port,
        ...(browserPolicy === undefined ? {} : { origin: 'exact-loopback' as const }),
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.silent === undefined ? {} : { silent: input.silent }),
        ...(input.keyboard === undefined ? {} : { keyboard: input.keyboard }),
        ...(options.rawOutput
          ? {
            pkg: evidence.dist.pkg,
            hash: evidence.dist.hash.digest,
            ...(options.rawAuthority === undefined
              ? {}
              : { info: { authority: options.rawAuthority } }),
          }
          : {}),
        until: life.signal,
        status: { kind: 'dist', root: input.dir, urlPaths: ['/'] },
      });
    } catch (cause) {
      throw startError(startupReason(cause));
    }
    if (strictPort && input.port !== 0 && started.port !== input.port) {
      throw startError('address-in-use');
    }
    if (browserPolicy) {
      const host = exactAuthority(started);
      browserRuntime = createBrowserRuntime(browserPolicy, started.origin, host);
      hosts.hosts = new Set([host]);
    } else {
      hosts.hosts = acceptedAuthorities(started);
    }
    await settleListener(started);
    if (life.signal.aborted) throw startError('cancelled');

    void started.finished.then(
      () => life.dispose('server.finished'),
      () => life.dispose('server.finished'),
    ).catch(() => {});

    Object.defineProperties(started, {
      authority: {
        value: Object.freeze(authority),
        enumerable: true,
        writable: false,
        configurable: false,
      },
      verification: {
        value: Object.freeze(evidence),
        enumerable: true,
        writable: false,
        configurable: false,
      },
      ...(browserRuntime
        ? {
          browserPolicy: {
            value: browserRuntime.applied,
            enumerable: true,
            writable: false,
            configurable: false,
          },
        }
        : {}),
    });

    return started as t.DistServer.Started;
  } catch (cause) {
    if (started) {
      try {
        await started.close('startup.failure');
      } catch {
        // Preserve the original sanitized startup failure.
      }
    }
    life.dispose();
    if (DistServerError.is(cause)) throw cause;
    throw startError('startup-failure');
  }
}

async function serveLoop(
  started: t.DistServer.Started,
  mode: ServeMode,
  input: ServeLoopInput,
  effects: ServeEffects,
): Promise<void> {
  if (mode === 'raw') {
    await started.finished;
    return;
  }

  let keyboard: ReturnType<ServeEffects['bindKeyboard']>;
  let closePromise: Promise<void> | undefined;
  const closeStarted = (cause?: unknown) => {
    return closePromise ??= Promise.resolve().then(() => started.close(cause));
  };
  const closePreserving = async (cause: unknown) => {
    try {
      await closeStarted(cause);
    } catch {
      // Preserve the failure that required shutdown.
    }
  };

  let screen: ReturnType<ServeEffects['createScreen']> | undefined;
  try {
    if (input.keyboard.enabled) {
      keyboard = effects.bindKeyboard({
        exit: input.keyboard.exit,
        onQuit: () => closeStarted('keyboard'),
        onKey: (event) => {
          if (event.key === 'o') return effects.open(started.origin);
        },
      });
    }

    const root = started.verification.dist.pkg ?? pkg;
    const identity = input.pkgSubpath === undefined ? root : { root, subpath: input.pkgSubpath };
    screen = effects.createScreen({
      identity,
      origin: started.origin,
      dir: input.dir,
      evidence: started.verification,
      authority: started.authority,
      keyboard: {
        enabled: keyboard !== undefined,
        print: input.keyboard.print,
      },
      renderedAt: effects.now(),
      until: started.dispose$,
    });
  } catch (cause) {
    await closePreserving(cause);
    cleanup([() => keyboard?.dispose()]);
    throw cause;
  }

  const serverOutcome = started.finished.then(
    () => ({ kind: 'server', ok: true } as const),
    (cause: unknown) => ({ kind: 'server', ok: false, cause } as const),
  );
  const screenOutcome = screen.failure.catch(
    (cause) => ({ kind: 'screen', cause } as const),
  );
  const outcomes: PromiseLike<ServeOutcome>[] = [serverOutcome, screenOutcome];
  if (keyboard) {
    outcomes.push(
      keyboard.finished.then(
        () => ({ kind: 'keyboard', ok: true } as const),
        (cause) => ({ kind: 'keyboard', ok: false, cause } as const),
      ),
    );
  }

  let failed = false;
  let failure: unknown;
  try {
    const outcome = await Promise.race(outcomes);
    if (outcome.kind === 'keyboard' && outcome.ok) {
      await closeStarted('keyboard.finished');
    } else if (outcome.kind !== 'server') {
      await closePreserving(outcome.cause);
      throw outcome.cause;
    } else if (!outcome.ok) {
      throw outcome.cause;
    } else if (closePromise) {
      await closePromise;
    }
  } catch (cause) {
    failed = true;
    failure = cause;
  }

  const cleaned = cleanup([
    () => screen.dispose(),
    () => keyboard?.dispose(),
  ]);
  if (failed) throw failure;
  if (!cleaned.ok) throw cleaned.cause;
}

async function settleListener(started: t.HttpServer.Started): Promise<void> {
  let terminal: { readonly cause?: unknown } | undefined;
  void started.finished.then(
    () => (terminal = {}),
    (cause) => (terminal = { cause }),
  );
  await Schedule.macro();
  if (terminal) throw startError(startupReason(terminal.cause));
}

const wrangle = {
  serveMode(silent: boolean | undefined): ServeMode {
    return !silent && Cli.Is.interactive() ? 'screen' : 'raw';
  },
  serveKeyboard(input: t.HttpServer.Start.Options['keyboard']): ServeKeyboard {
    if (input === false) {
      return { enabled: false, print: false, exit: false, http: false };
    }

    if (input === true || input === undefined) {
      return {
        enabled: true,
        print: true,
        exit: false,
        http: true,
      };
    }

    const keyboard = {
      ...(input.print === undefined ? {} : { print: input.print }),
      ...(input.exit === undefined ? {} : { exit: input.exit }),
    };
    return {
      enabled: true,
      print: input.print ?? true,
      exit: input.exit ?? false,
      http: keyboard,
    };
  },
};

function cleanup(actions: readonly (() => void)[]) {
  let failed = false;
  let failure: unknown;
  for (const action of actions) {
    try {
      action();
    } catch (cause) {
      if (failed) continue;
      failed = true;
      failure = cause;
    }
  }
  return failed ? { ok: false, cause: failure } as const : { ok: true } as const;
}

function hostRejected(policy?: t.DistServer.BrowserPolicy.Headers): Response {
  const response = new Response(null, {
    status: 421,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
  return policy ? applyBrowserHeaders(response, policy) : response;
}
