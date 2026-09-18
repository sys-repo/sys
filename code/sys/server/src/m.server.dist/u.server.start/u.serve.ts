import { Cli, D, Open, Path, pkg, type StartDependencies, type t, Time } from './common.ts';
import { snapshotServeInput, snapshotServeLocalInput } from '../u.server.input/u.serve.ts';
import { DistServeScreen } from '../u.server.screen/mod.ts';
import type { DistServeScreen as TDistServeScreen } from '../u.server.screen/t.ts';
import { startError } from '../u.server/u.error.ts';
import { startLocalWith, startWith } from './u.start.ts';

type ServeMode = 'screen' | 'raw';
type ServeNavigation = 'default' | 'nested';

type ServeSource =
  | {
    readonly kind: 'screen';
    readonly verificationDir: t.StringDir;
    readonly manifestHref: URL;
  }
  | {
    readonly kind: 'raw';
    readonly verificationDir: t.StringDir;
  };

type ServeKeyboard = {
  readonly enabled: boolean;
  readonly print: boolean;
  readonly exit: boolean;
  readonly http: t.HttpServer.Start.Options['keyboard'];
};

type ServeLoopInput = {
  readonly keyboard: ServeKeyboard;
  readonly navigation: ServeNavigation;
  readonly dir: t.StringDir;
  readonly pkgSubpath?: string;
};

type ServeEffects = {
  readonly bindKeyboard: typeof Cli.Keyboard.bind;
  readonly createScreen: typeof DistServeScreen.create;
  readonly isInteractive: typeof Cli.Is.interactive;
  readonly open: (origin: t.StringUrl) => void | Promise<void>;
  readonly now: () => t.UnixTimestamp;
};

type ServeOutcome =
  | { readonly kind: 'server'; readonly ok: true }
  | { readonly kind: 'server'; readonly ok: false; readonly cause: unknown }
  | { readonly kind: 'screen'; readonly cause: unknown }
  | { readonly kind: 'keyboard'; readonly ok: true }
  | { readonly kind: 'keyboard'; readonly ok: false; readonly cause: unknown }
  | { readonly kind: 'back' }
  | { readonly kind: 'quit' };

type ServeOutcomeOwner = {
  readonly promise: Promise<ServeOutcome>;
  readonly isSettled: () => boolean;
  readonly settle: (outcome: ServeOutcome) => boolean;
};

const BACK_RESULT: t.DistServer.Serve.Result = Object.freeze({ kind: 'back' });
const CLOSED_RESULT: t.DistServer.Serve.Result = Object.freeze({ kind: 'closed' });

const DEFAULT_SERVE_EFFECTS: ServeEffects = Object.freeze({
  bindKeyboard: Cli.Keyboard.bind,
  createScreen: DistServeScreen.create,
  isInteractive: Cli.Is.interactive,
  open: (origin) => Open.invokeDetached(Path.cwd(), origin, { silent: true }),
  now: () => Time.now.timestamp,
});

/**
 * Serve one checksum-pinned Dist with terminal lifecycle ownership.
 */
export function serve(input: t.DistServer.Serve.NestedArgs): Promise<t.DistServer.Serve.Result>;
export function serve(input: t.DistServer.Serve.Args): Promise<void>;
export function serve(input: unknown): Promise<t.DistServer.Serve.Result | void> {
  return servePinned(input, D.DEPS, DEFAULT_SERVE_EFFECTS);
}

/**
 * Serve one locally verified, unpinned Dist with terminal lifecycle ownership.
 */
export function serveLocal(
  input: t.DistServer.Local.Serve.NestedArgs,
): Promise<t.DistServer.Serve.Result>;
export function serveLocal(input: t.DistServer.Local.ServeArgs): Promise<void>;
export function serveLocal(input: unknown): Promise<t.DistServer.Serve.Result | void> {
  return serveUnpinned(input, D.DEPS, DEFAULT_SERVE_EFFECTS);
}

/**
 * Serve one checksum-pinned Dist through explicit host and presentation dependencies.
 */
export function serveWith(
  input: t.DistServer.Serve.NestedArgs,
  deps: StartDependencies,
  effects?: ServeEffects,
): Promise<t.DistServer.Serve.Result>;
export function serveWith(
  input: t.DistServer.Serve.Args,
  deps: StartDependencies,
  effects?: ServeEffects,
): Promise<void>;
export function serveWith(
  input: unknown,
  deps: StartDependencies,
  effects: ServeEffects = DEFAULT_SERVE_EFFECTS,
): Promise<t.DistServer.Serve.Result | void> {
  return servePinned(input, deps, effects);
}

/**
 * Serve one locally verified, unpinned Dist through explicit host and presentation dependencies.
 */
export function serveLocalWith(
  input: t.DistServer.Local.Serve.NestedArgs,
  deps: StartDependencies,
  effects?: ServeEffects,
): Promise<t.DistServer.Serve.Result>;
export function serveLocalWith(
  input: t.DistServer.Local.ServeArgs,
  deps: StartDependencies,
  effects?: ServeEffects,
): Promise<void>;
export function serveLocalWith(
  input: unknown,
  deps: StartDependencies,
  effects: ServeEffects = DEFAULT_SERVE_EFFECTS,
): Promise<t.DistServer.Serve.Result | void> {
  return serveUnpinned(input, deps, effects);
}

async function servePinned(
  input: unknown,
  deps: StartDependencies,
  effects: ServeEffects,
): Promise<t.DistServer.Serve.Result | void> {
  const prepared = snapshotServeInput(input);
  if (!prepared.ok) throw startError(prepared.reason);
  const { displayDir, navigation, pkgSubpath, start: value } = prepared.value;
  const source = wrangle.serveSource(
    value.dir,
    wrangle.serveMode(navigation, value.silent, effects.isInteractive),
  );
  const keyboard = wrangle.serveKeyboard(value.keyboard);
  const started = await startWith(
    {
      ...value,
      dir: source.verificationDir,
      silent: source.kind === 'screen' ? true : value.silent ?? false,
      keyboard: source.kind === 'screen' ? false : keyboard.http,
    },
    deps,
    {
      strictPort: true,
      rawOutput: source.kind === 'raw',
      rawAuthority: `pinned ${value.integrity}`,
    },
  );
  return await serveLoop(started, source, {
    dir: displayDir,
    keyboard,
    navigation,
    ...(pkgSubpath === undefined ? {} : { pkgSubpath }),
  }, effects);
}

async function serveUnpinned(
  input: unknown,
  deps: StartDependencies,
  effects: ServeEffects,
): Promise<t.DistServer.Serve.Result | void> {
  const prepared = snapshotServeLocalInput(input);
  if (!prepared.ok) throw startError(prepared.reason);
  const { displayDir, navigation, pkgSubpath, start: value } = prepared.value;
  const source = wrangle.serveSource(
    value.dir,
    wrangle.serveMode(navigation, value.silent, effects.isInteractive),
  );
  const keyboard = wrangle.serveKeyboard(value.keyboard);
  const started = await startLocalWith(
    {
      ...value,
      dir: source.verificationDir,
      silent: source.kind === 'screen' ? true : value.silent ?? false,
      keyboard: source.kind === 'screen' ? false : keyboard.http,
    },
    deps,
    {
      strictPort: true,
      rawOutput: source.kind === 'raw',
      rawAuthority: 'local (UNPINNED)',
    },
  );
  return await serveLoop(started, source, {
    dir: displayDir,
    keyboard,
    navigation,
    ...(pkgSubpath === undefined ? {} : { pkgSubpath }),
  }, effects);
}

async function serveLoop(
  started: t.DistServer.Started,
  source: ServeSource,
  input: ServeLoopInput,
  effects: ServeEffects,
): Promise<t.DistServer.Serve.Result | void> {
  if (source.kind === 'raw') {
    await closeRaw(started);
    return input.navigation === 'nested' ? CLOSED_RESULT : undefined;
  }

  const terminal = createServeOutcomeOwner();
  let keyboard: t.Cli.Keyboard.Bind.Handle | undefined;
  let redrawScreen = () => {};
  let closePromise: Promise<void> | undefined;
  const closeStarted = (cause?: unknown) => {
    return closePromise ??= Promise.resolve().then(() => started.close(cause));
  };
  const closeAndSettle = async (cause?: unknown) => {
    await closeStarted(cause);
    await started.finished;
  };
  const closePreserving = async (cause: unknown) => {
    try {
      await closeStarted(cause);
    } catch {
      // Preserve the failure that required shutdown.
    }
  };

  void started.finished.then(
    () => {
      terminal.settle({ kind: 'server', ok: true });
    },
    (cause: unknown) => {
      terminal.settle({ kind: 'server', ok: false, cause });
    },
  );

  let screen: TDistServeScreen.Reporter | undefined;
  try {
    if (input.keyboard.enabled) {
      keyboard = effects.bindKeyboard({
        exit: input.keyboard.exit,
        onQuit: async () => {
          if (terminal.settle({ kind: 'quit' })) await closeAndSettle('keyboard');
        },
        onKey: async (event) => {
          if (input.navigation === 'nested' && Cli.Keyboard.Is.back(event)) {
            if (terminal.settle({ kind: 'back' })) await closeAndSettle('keyboard.back');
            return 'stop';
          }
          if (Cli.Keyboard.Is.redraw(event)) return redrawScreen();
          if (event.key === 'o') return await effects.open(started.origin);
        },
      });
      if (input.navigation === 'nested' && !keyboard) {
        throw startError('startup-failure');
      }
      if (keyboard) {
        void keyboard.finished.then(
          () => {
            terminal.settle({ kind: 'keyboard', ok: true });
          },
          (cause) => {
            terminal.settle({ kind: 'keyboard', ok: false, cause });
          },
        );
      }
    }

    if (!terminal.isSettled()) {
      const root = started.verification.dist.pkg ?? pkg;
      const identity = input.pkgSubpath === undefined ? root : { root, subpath: input.pkgSubpath };
      screen = effects.createScreen({
        identity,
        origin: started.origin,
        dir: input.dir,
        manifestHref: source.manifestHref,
        evidence: started.verification,
        authority: started.authority,
        keyboard: wrangle.screenKeyboard(input.keyboard, input.navigation, keyboard !== undefined),
        renderedAt: effects.now(),
        until: started.dispose$,
      });
      const ownedScreen = screen;
      redrawScreen = () => ownedScreen.redraw();
      void screen.failure.catch((cause) => {
        terminal.settle({ kind: 'screen', cause });
      });
    }
  } catch (cause) {
    await closePreserving(cause);
    await closePresentation(screen, keyboard);
    throw cause;
  }

  let back = false;
  let failed = false;
  let failure: unknown;
  try {
    const outcome = await terminal.promise;
    redrawScreen = () => {};
    if (outcome.kind === 'back') {
      back = true;
      await closeAndSettle('keyboard.back');
    } else if (outcome.kind === 'quit') {
      await closeAndSettle('keyboard');
    } else if (outcome.kind === 'keyboard' && outcome.ok) {
      await closeAndSettle('keyboard.finished');
    } else if (outcome.kind === 'keyboard' || outcome.kind === 'screen') {
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

  redrawScreen = () => {};
  const cleaned = await closePresentation(screen, keyboard);
  if (failed) throw failure;
  if (!cleaned.ok) throw cleaned.cause;
  return input.navigation === 'nested' ? (back ? BACK_RESULT : CLOSED_RESULT) : undefined;
}

async function closeRaw(started: t.DistServer.Started): Promise<void> {
  let failed = false;
  let failure: unknown;

  try {
    await started.finished;
  } catch (cause) {
    failed = true;
    failure = cause;
  }
  try {
    await started.close('server.finished');
  } catch (cause) {
    if (!failed) {
      failed = true;
      failure = cause;
    }
  }

  if (failed) throw failure;
}

async function closePresentation(
  screen: TDistServeScreen.Reporter | undefined,
  keyboard: t.Cli.Keyboard.Bind.Handle | undefined,
) {
  let failed = false;
  let failure: unknown;

  if (screen) {
    try {
      screen.dispose();
    } catch (cause) {
      failed = true;
      failure = cause;
    }
  }
  if (keyboard) {
    try {
      await Cli.Keyboard.shutdown(keyboard);
    } catch (cause) {
      if (!failed) {
        failed = true;
        failure = cause;
      }
    }
  }

  return failed ? { ok: false, cause: failure } as const : { ok: true } as const;
}

function createServeOutcomeOwner(): ServeOutcomeOwner {
  const { promise, resolve } = Promise.withResolvers<ServeOutcome>();
  let settled = false;
  return Object.freeze({
    promise,
    isSettled: () => settled,
    settle(outcome: ServeOutcome) {
      if (settled) return false;
      settled = true;
      resolve(outcome);
      return true;
    },
  });
}

const wrangle = {
  serveMode(
    navigation: ServeNavigation,
    silent: boolean | undefined,
    isInteractive: ServeEffects['isInteractive'],
  ): ServeMode {
    if (navigation === 'nested') {
      if (!isInteractive()) throw startError('startup-failure');
      return 'screen';
    }
    return !silent && isInteractive() ? 'screen' : 'raw';
  },
  serveSource(dir: t.StringDir, mode: ServeMode): ServeSource {
    if (mode === 'raw') return { kind: 'raw', verificationDir: dir };
    const verificationDir = Path.resolve(dir) as t.StringDir;
    const manifestHref = Path.toFileUrl(Path.join(verificationDir, 'dist.json'));
    return { kind: 'screen', verificationDir, manifestHref };
  },
  screenKeyboard(
    input: ServeKeyboard,
    navigation: ServeNavigation,
    enabled: boolean,
  ): TDistServeScreen.Keyboard {
    const keyboard = { enabled, print: input.print };
    return navigation === 'nested' ? { ...keyboard, navigation } : keyboard;
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
