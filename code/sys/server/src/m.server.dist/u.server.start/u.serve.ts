import {
  Cli,
  DEFAULT_DEPENDENCIES,
  Fs,
  Open,
  pkg,
  type StartDependencies,
  type t,
  Time,
} from './common.ts';
import { snapshotServeInput, snapshotServeLocalInput } from '../u.server.input/u.serve.ts';
import { DistServeScreen } from '../u.server.screen/mod.ts';
import { startError } from '../u.server/u.error.ts';
import { startLocalWith, startWith } from './u.start.ts';

type ServeMode = 'screen' | 'raw';

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

type ServeKeyEvent = Parameters<NonNullable<t.Cli.Keyboard.Bind.Options['onKey']>>[0];

const DEFAULT_SERVE_EFFECTS: ServeEffects = Object.freeze({
  bindKeyboard: Cli.Keyboard.bind,
  createScreen: DistServeScreen.create,
  isInteractive: Cli.Is.interactive,
  open: (origin) => Open.invokeDetached(Deno.cwd(), origin, { silent: true }),
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
  const source = wrangle.serveSource(
    value.dir,
    wrangle.serveMode(value.silent, effects.isInteractive),
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
  await serveLoop(started, source, {
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
  const source = wrangle.serveSource(
    value.dir,
    wrangle.serveMode(value.silent, effects.isInteractive),
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
      strictPort: false,
      rawOutput: source.kind === 'raw',
      rawAuthority: 'local (UNPINNED)',
    },
  );
  await serveLoop(started, source, {
    dir: value.dir,
    keyboard,
    ...(pkgSubpath === undefined ? {} : { pkgSubpath }),
  }, effects);
}

async function serveLoop(
  started: t.DistServer.Started,
  source: ServeSource,
  input: ServeLoopInput,
  effects: ServeEffects,
): Promise<void> {
  if (source.kind === 'raw') {
    await closeRaw(started);
    return;
  }

  let keyboard: ReturnType<ServeEffects['bindKeyboard']>;
  let redrawScreen = () => {};
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
          if (isRedrawKey(event)) return redrawScreen();
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
      manifestHref: source.manifestHref,
      evidence: started.verification,
      authority: started.authority,
      keyboard: {
        enabled: keyboard !== undefined,
        print: input.keyboard.print,
      },
      renderedAt: effects.now(),
      until: started.dispose$,
    });
    const ownedScreen = screen;
    redrawScreen = () => ownedScreen.redraw();
  } catch (cause) {
    await closePreserving(cause);
    await closePresentation(undefined, keyboard);
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
    redrawScreen = () => {};
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

  redrawScreen = () => {};
  const cleaned = await closePresentation(screen, keyboard);
  if (failed) throw failure;
  if (!cleaned.ok) throw cleaned.cause;
}

function isRedrawKey(event: ServeKeyEvent): boolean {
  return event.key === 'r' && event.ctrlKey === false && event.altKey === false &&
    event.metaKey === false && event.shiftKey === false;
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
  screen: ReturnType<ServeEffects['createScreen']> | undefined,
  keyboard: ReturnType<ServeEffects['bindKeyboard']>,
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

const wrangle = {
  serveMode(
    silent: boolean | undefined,
    isInteractive: ServeEffects['isInteractive'],
  ): ServeMode {
    return !silent && isInteractive() ? 'screen' : 'raw';
  },
  serveSource(dir: t.StringDir, mode: ServeMode): ServeSource {
    if (mode === 'raw') return { kind: 'raw', verificationDir: dir };
    const verificationDir = Fs.Path.resolve(dir) as t.StringDir;
    const manifestHref = Fs.Path.toFileUrl(Fs.Path.join(verificationDir, 'dist.json'));
    return { kind: 'screen', verificationDir, manifestHref };
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
