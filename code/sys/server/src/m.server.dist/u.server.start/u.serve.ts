import { Cli } from '@sys/cli';
import { Open } from '@sys/process';
import { DEFAULT_DEPENDENCIES, pkg, type StartDependencies, type t, Time } from './common.ts';
import { snapshotServeInput, snapshotServeLocalInput } from '../u.server.input/u.serve.ts';
import { DistServeScreen } from '../u.server/u.serve.screen.ts';
import { startError } from '../u.server/u.error.ts';
import { cleanup } from './u.lifecycle.ts';
import { startLocalWith, startWith } from './u.start.ts';

type ServeMode = 'screen' | 'raw';

type ServeKeyboard = {
  readonly enabled: boolean;
  readonly print: boolean;
  readonly exit: boolean;
  readonly http: t.HttpServer.Start.Options['keyboard'];
};

type ServeLoopInput = {
  readonly keyboard: ServeKeyboard;
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
  | { readonly kind: 'keyboard'; readonly ok: false; readonly cause: unknown };

const DEFAULT_SERVE_EFFECTS: ServeEffects = Object.freeze({
  bindKeyboard: Cli.Keyboard.bind,
  createScreen: DistServeScreen.create,
  isInteractive: Cli.Is.interactive,
  open: (origin) => Open.invokeDetached(Deno.cwd() as t.StringDir, origin, { silent: true }),
  now: () => Time.now.timestamp,
});

/** Blocking terminal-ownership startup for pinned authority. */
export const serve: (input: t.DistServer.Serve.Args) => Promise<void> = (input) =>
  serveWith(input, DEFAULT_DEPENDENCIES);

/** Blocking pinned startup with terminal ownership (raw print or interactive screen). */
export async function serveWith(
  input: unknown,
  deps: StartDependencies,
  effects: ServeEffects = DEFAULT_SERVE_EFFECTS,
): Promise<void> {
  const prepared = snapshotServeInput(input);
  if (!prepared.ok) throw startError(prepared.reason);
  const { pkgSubpath, start: value } = prepared.value;
  const mode = wrangle.serveMode(value.silent, effects.isInteractive);
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
  const mode = wrangle.serveMode(value.silent, effects.isInteractive);
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

const wrangle = {
  serveMode(
    silent: boolean | undefined,
    isInteractive: ServeEffects['isInteractive'],
  ): ServeMode {
    return !silent && isInteractive() ? 'screen' : 'raw';
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
