import { Schedule, type t } from '../../-test.ts';
import type { Fixture } from '../../-test/u.fixture.dist.ts';
import { verified } from '../../-test/u.fixture.dist.ts';
import type { DistServeScreen as TDistServeScreen } from '../u.server.screen/t.ts';
import { D, serveLocalWith } from '../u.server.start/mod.ts';

type StartHttpInput = t.HttpServer.Start.Options;

export type CapturedStartInput = {
  readonly keyboard?: StartHttpInput['keyboard'];
  readonly silent?: StartHttpInput['silent'];
  readonly strictPort?: StartHttpInput['strictPort'];
  readonly pkg?: StartHttpInput['pkg'];
  readonly hash?: StartHttpInput['hash'];
  readonly info?: StartHttpInput['info'];
  readonly hasPkgSubpath?: boolean;
};

export type StartedController = {
  readonly release: () => void;
  readonly fail: (cause?: unknown) => void;
  readonly closeCauses: readonly unknown[];
  readonly server: t.DistServer.Started;
};

type ServeEffects = {
  bindKeyboard: t.Cli.Keyboard.Lib['bind'];
  createScreen: (args: TDistServeScreen.CreateArgs) => TDistServeScreen.Reporter;
  isInteractive: () => boolean;
  open: (origin: t.StringUrl) => void | Promise<void>;
  now: () => t.UnixTimestamp;
};
type OnKey = NonNullable<t.Cli.Keyboard.Bind.Options['onKey']>;
type KeypressEvent = Parameters<OnKey>[0];

type StartedOptions = {
  closeFailure?: unknown;
  finishBeforeCloseFailure?: boolean;
};

export function createModeEffects(isInteractive: boolean): ServeEffects {
  const unexpected = () => {
    throw new Error('raw serve must not acquire presentation effects');
  };
  return {
    bindKeyboard: unexpected,
    createScreen: unexpected,
    isInteractive: () => isInteractive,
    open: unexpected,
    now: unexpected,
  };
}

export function capture(input: StartHttpInput = {}): CapturedStartInput {
  return {
    keyboard: input.keyboard,
    silent: input.silent,
    strictPort: input.strictPort,
    pkg: input.pkg,
    hash: input.hash,
    info: input.info,
    hasPkgSubpath: Object.hasOwn(input, 'pkgSubpath'),
  };
}

export function runInteractiveServe(
  fixture: Fixture,
  started: StartedController,
  effects: ServeEffects,
) {
  return serveLocalWith(
    {
      dir: fixture.source as t.StringDir,
      limits: fixture.policy.verification,
      silent: false,
    },
    {
      ...D.DEPS,
      verifyLocal: () => Promise.resolve(verified(fixture)),
      startHttp: () => started.server,
    },
    effects,
  );
}

export function runNestedServe(
  fixture: Fixture,
  started: StartedController,
  effects: ServeEffects,
) {
  return serveLocalWith(
    {
      dir: fixture.source as t.StringDir,
      limits: fixture.policy.verification,
      navigation: 'nested',
    },
    {
      ...D.DEPS,
      verifyLocal: () => Promise.resolve(verified(fixture)),
      startHttp: () => started.server,
    },
    effects,
  );
}

export function createInteractiveEffects(fixture: Fixture) {
  let finishKeyboard = () => {};
  const keyboardFinished = new Promise<void>((resolve) => {
    finishKeyboard = resolve;
  });
  let quit: t.Cli.Keyboard.Bind.Options['onQuit'];
  let keyboardDisposals = 0;
  let screenDisposals = 0;

  const effects: ServeEffects = {
    bindKeyboard: (options) => {
      quit = options.onQuit;
      return {
        finished: keyboardFinished,
        dispose() {
          keyboardDisposals += 1;
          finishKeyboard();
        },
      };
    },
    createScreen: () => ({
      failure: new Promise<never>(() => {}),
      redraw() {},
      dispose() {
        screenDisposals += 1;
      },
    }),
    isInteractive: () => true,
    open: () => {},
    now: () => fixture.cloneDist().build.time,
  };

  return {
    effects,
    finishKeyboard,
    quit() {
      if (!quit) throw new Error('keyboard binding not acquired');
      return quit();
    },
    disposals: () => ({ keyboard: keyboardDisposals, screen: screenDisposals }),
  } as const;
}

export function createStarted(port: number, options: StartedOptions = {}): StartedController {
  let release = () => {};
  let fail = (_cause?: unknown) => {};
  const closeCauses: unknown[] = [];
  const finished = new Promise<void>((resolve, reject) => {
    release = resolve;
    fail = reject;
  });
  const controller = new AbortController();
  const runtime = {
    finished,
    shutdown: () => {
      release();
      return Promise.resolve();
    },
  } as unknown as Deno.HttpServer<Deno.NetAddr>;

  const server = {
    port,
    hostname: '127.0.0.1',
    addr: { hostname: '127.0.0.1' },
    origin: `http://127.0.0.1:${port}/`,
    server: runtime,
    signal: controller.signal,
    dispose$: controller.signal,
    finished,
    close: (cause?: unknown) => {
      closeCauses.push(cause);
      controller.abort(cause);
      if (options.finishBeforeCloseFailure) release();
      if (options.closeFailure !== undefined) return Promise.reject(options.closeFailure);
      release();
      return Promise.resolve();
    },
    dispose: () => {
      release();
      return Promise.resolve();
    },
  } as unknown as t.DistServer.Started;

  return { release, fail, closeCauses, server };
}

export function keypress(key: string, overrides: Partial<KeypressEvent> = {}) {
  return { key, ...overrides } as KeypressEvent;
}

export async function listenerSettled() {
  await Schedule.macro();
  await Schedule.macro();
  await Schedule.macro();
}

export async function catchStart(
  fn: () => Promise<unknown>,
): Promise<t.DistServer.StartError | undefined> {
  try {
    await fn();
  } catch (cause) {
    return cause as t.DistServer.StartError;
  }
}
