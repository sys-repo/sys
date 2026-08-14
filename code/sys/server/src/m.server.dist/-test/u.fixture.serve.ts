import { Cli } from '@sys/cli';
import { Schedule, type t, WebFixture } from '../../-test.ts';
import type { Fixture } from '../../-test/u.fixture.dist.ts';
import { verified } from '../../-test/u.fixture.dist.ts';
import { DEFAULT_DEPENDENCIES, serveLocalWith } from '../u.server.start/mod.ts';

export type CapturedStartInput = {
  keyboard?: unknown;
  silent?: boolean;
  pkg?: t.Pkg;
  hash?: t.StringHash;
  info?: Record<string, string>;
  hasPkgSubpath?: boolean;
};

export type StartedController = {
  readonly release: () => void;
  readonly fail: (cause?: unknown) => void;
  readonly closeCauses: readonly unknown[];
  readonly server: t.DistServer.Started;
};

type ServeEffects = NonNullable<Parameters<typeof serveLocalWith>[2]>;

type StartedOptions = {
  closeFailure?: unknown;
  finishBeforeCloseFailure?: boolean;
};

export function mockInteractive(value: boolean) {
  return WebFixture.Property.mock([{
    target: Cli.Is,
    key: 'interactive',
    descriptor: { value: () => value },
  }]);
}

export function capture(input: Record<string, unknown>): CapturedStartInput {
  return {
    keyboard: input.keyboard,
    silent: input.silent as boolean,
    pkg: input.pkg as t.Pkg,
    hash: input.hash as t.StringHash,
    info: input.info as Record<string, string>,
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
      ...DEFAULT_DEPENDENCIES,
      verifyLocal: async () => verified(fixture),
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
  let quit: Parameters<typeof Cli.Keyboard.bind>[0]['onQuit'] | undefined;
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
      dispose() {
        screenDisposals += 1;
      },
    }),
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

  const server = {
    port,
    hostname: '127.0.0.1',
    addr: { hostname: '127.0.0.1' },
    origin: `http://127.0.0.1:${port}/`,
    dispose$: new AbortController().signal,
    finished,
    close: async (cause?: unknown) => {
      closeCauses.push(cause);
      if (options.finishBeforeCloseFailure) release();
      if (options.closeFailure !== undefined) throw options.closeFailure;
      release();
    },
    dispose: async () => release(),
  } as unknown as t.DistServer.Started;

  return { release, fail, closeCauses, server };
}

export function keypress(key: string) {
  return { key } as Parameters<
    NonNullable<Parameters<typeof Cli.Keyboard.bind>[0]['onKey']>
  >[0];
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
