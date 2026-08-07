import { Cli } from '@sys/cli';
import { DEFAULT_DEPENDENCIES, serveLocalWith, serveWith } from '../u.server/u.start.ts';
import { DistServeScreen } from '../u.server/u.serve.screen.ts';
import { describe, expect, it, Schedule, type t } from '../../-test.ts';
import { setup, teardown } from './u.fixture.ts';

type CapturedStartInput = {
  keyboard?: unknown;
  silent?: boolean;
  pkg?: t.Pkg;
  hash?: t.StringHash;
  info?: Record<string, string>;
};

describe('DistServer.serve', () => {
  it('uses raw terminal metadata for pinned startup', async () => {
    const original = Cli.Is.interactive;
    Object.defineProperty(Cli.Is, 'interactive', { value: () => false, configurable: true });

    const fixture = await setup();
    let captured: CapturedStartInput = {};
    let started: StartedController | undefined;

    try {
      const running = serveWith(
        {
          dir: fixture.source as t.StringDir,
          integrity: fixture.integrity,
          limits: fixture.policy.verification,
          port: 49152,
          silent: false,
        },
        {
          ...DEFAULT_DEPENDENCIES,
          verify: async () => verified(fixture),
          startHttp: (_app: unknown, input: Record<string, unknown>) => {
            captured = capture(input);
            started = createStarted(49152);
            return started.server;
          },
        },
      );

      await listenerSettled();
      expect(started).to.be.an('object');
      started?.release();
      await running;

      expect(captured.silent).to.eql(false);
      expect(captured.keyboard).to.eql(true);
      expect(captured.pkg).to.eql(fixture.cloneDist().pkg);
      expect(captured.hash).to.eql(fixture.cloneDist().hash.digest);
      expect(captured.info).to.eql({ authority: `pinned ${fixture.integrity}` });
    } finally {
      started?.release();
      Object.defineProperty(Cli.Is, 'interactive', { value: original, configurable: true });
      await teardown(fixture);
    }
  });

  it('uses local authority metadata in local serve mode', async () => {
    const original = Cli.Is.interactive;
    Object.defineProperty(Cli.Is, 'interactive', { value: () => false, configurable: true });

    const fixture = await setup();
    let captured: CapturedStartInput = {};
    let started: StartedController | undefined;

    try {
      const running = serveLocalWith(
        {
          dir: fixture.source as t.StringDir,
          limits: fixture.policy.verification,
          port: 49152,
          silent: false,
        },
        {
          ...DEFAULT_DEPENDENCIES,
          verifyLocal: async () => verified(fixture),
          startHttp: (_app: unknown, input: Record<string, unknown>) => {
            captured = capture(input);
            started = createStarted(49152);
            return started.server;
          },
        },
      );

      await listenerSettled();
      expect(started).to.be.an('object');
      started?.release();
      await running;

      expect(captured.silent).to.eql(false);
      expect(captured.keyboard).to.eql(true);
      expect(captured.info).to.eql({ authority: 'local (UNPINNED)' });
    } finally {
      started?.release();
      Object.defineProperty(Cli.Is, 'interactive', { value: original, configurable: true });
      await teardown(fixture);
    }
  });

  it('lets silent mode suppress screen ownership without disabling keyboard lifecycle', async () => {
    const original = Cli.Is.interactive;
    Object.defineProperty(Cli.Is, 'interactive', { value: () => true, configurable: true });

    const fixture = await setup();
    let captured: CapturedStartInput = {};
    let started: StartedController | undefined;
    const unexpected = () => {
      throw new Error('screen effect should not be acquired');
    };
    try {
      const running = serveLocalWith(
        {
          dir: fixture.source as t.StringDir,
          limits: fixture.policy.verification,
          silent: true,
        },
        {
          ...DEFAULT_DEPENDENCIES,
          verifyLocal: async () => verified(fixture),
          startHttp: (_app: unknown, input: Record<string, unknown>) => {
            captured = capture(input);
            started = createStarted(49152);
            return started.server;
          },
        },
        {
          bindKeyboard: unexpected,
          createScreen: unexpected,
          open: unexpected,
          now: unexpected,
        },
      );

      await listenerSettled();
      started?.release();
      await running;

      expect(captured.silent).to.eql(true);
      expect(captured.keyboard).to.eql(true);
      expect(captured.info).to.eql({ authority: 'local (UNPINNED)' });
    } finally {
      started?.release();
      Object.defineProperty(Cli.Is, 'interactive', { value: original, configurable: true });
      await teardown(fixture);
    }
  });

  it('owns interactive keyboard and screen against the actual listener origin', async () => {
    const original = Cli.Is.interactive;
    Object.defineProperty(Cli.Is, 'interactive', { value: () => true, configurable: true });

    const fixture = await setup();
    const dist = fixture.cloneDist();
    let captured: CapturedStartInput = {};
    let started: StartedController | undefined;
    let binding: Parameters<typeof Cli.Keyboard.bind>[0] | undefined;
    let screenArgs: Parameters<typeof DistServeScreen.create>[0] | undefined;
    let keyboardDisposals = 0;
    let screenDisposals = 0;
    const opened: t.StringUrl[] = [];
    let finishKeyboard = () => {};
    const keyboardFinished = new Promise<void>((resolve) => {
      finishKeyboard = resolve;
    });

    try {
      const running = serveLocalWith(
        {
          dir: fixture.source as t.StringDir,
          limits: fixture.policy.verification,
          port: 8080,
          silent: false,
        },
        {
          ...DEFAULT_DEPENDENCIES,
          verifyLocal: async () => verified(fixture),
          startHttp: (_app: unknown, input: Record<string, unknown>) => {
            captured = capture(input);
            started = createStarted(49152);
            return started.server;
          },
        },
        {
          bindKeyboard: (options) => {
            binding = options;
            return {
              finished: keyboardFinished,
              dispose() {
                keyboardDisposals += 1;
                finishKeyboard();
              },
            };
          },
          createScreen: (args) => {
            screenArgs = args;
            return {
              failure: new Promise<never>(() => {}),
              dispose: () => {
                screenDisposals += 1;
              },
            };
          },
          open: (origin) => {
            opened.push(origin);
          },
          now: () => dist.build.time,
        },
      );

      await listenerSettled();
      if (!started || !binding || !screenArgs) throw new Error('interactive effects not acquired');

      expect(captured.silent).to.eql(true);
      expect(captured.keyboard).to.eql(false);
      expect(captured.info).to.eql(undefined);
      expect(binding.until).to.equal(started.server.finished);
      expect(binding.exit).to.eql(false);
      expect(screenArgs.origin).to.eql('http://127.0.0.1:49152/');
      expect(screenArgs.authority.kind).to.eql('local-unpinned');
      expect(screenArgs.evidence).to.equal(started.server.verification);
      expect(screenArgs.keyboard).to.eql({ enabled: true, print: true });
      expect(screenArgs.renderedAt).to.eql(dist.build.time);

      await binding.onKey?.(keypress('o'));
      await binding.onKey?.(keypress('x'));
      expect(opened).to.eql(['http://127.0.0.1:49152/']);

      await binding.onQuit();
      await running;
      expect(started.closeCauses).to.eql(['keyboard']);
      expect(screenDisposals).to.eql(1);
      expect(keyboardDisposals).to.eql(1);
    } finally {
      started?.release();
      Object.defineProperty(Cli.Is, 'interactive', { value: original, configurable: true });
      await teardown(fixture);
    }
  });

  it('rolls back an acquired server without masking screen acquisition failure', async () => {
    const original = Cli.Is.interactive;
    Object.defineProperty(Cli.Is, 'interactive', { value: () => true, configurable: true });

    const fixture = await setup();
    let started: StartedController | undefined;
    let keyboardDisposals = 0;
    const cause = new Error('screen-acquisition-failed');
    try {
      const outcome = await serveLocalWith(
        {
          dir: fixture.source as t.StringDir,
          limits: fixture.policy.verification,
          silent: false,
        },
        {
          ...DEFAULT_DEPENDENCIES,
          verifyLocal: async () => verified(fixture),
          startHttp: () => {
            started = createStarted(49152);
            return started.server;
          },
        },
        {
          bindKeyboard: () => ({
            finished: new Promise<void>(() => {}),
            dispose() {
              keyboardDisposals += 1;
              throw new Error('keyboard-cleanup-failed');
            },
          }),
          createScreen: () => {
            throw cause;
          },
          open: () => {},
          now: () => fixture.cloneDist().build.time,
        },
      ).then(
        () => ({ rejected: false, cause: undefined }),
        (error) => ({ rejected: true, cause: error }),
      );

      expect(outcome).to.eql({ rejected: true, cause });
      expect(started?.closeCauses).to.eql([cause]);
      expect(keyboardDisposals).to.eql(1);
    } finally {
      started?.release();
      Object.defineProperty(Cli.Is, 'interactive', { value: original, configurable: true });
      await teardown(fixture);
    }
  });

  it('closes on keyboard failure and preserves it over presentation cleanup failures', async () => {
    const original = Cli.Is.interactive;
    Object.defineProperty(Cli.Is, 'interactive', { value: () => true, configurable: true });

    const fixture = await setup();
    let started: StartedController | undefined;
    let rejectKeyboard = (_cause: unknown) => {};
    let keyboardDisposals = 0;
    let screenDisposals = 0;
    const keyboardFinished = new Promise<void>((_resolve, reject) => {
      rejectKeyboard = reject;
    });
    const cause = new Error('keyboard-failed');

    try {
      const running = serveLocalWith(
        {
          dir: fixture.source as t.StringDir,
          limits: fixture.policy.verification,
          silent: false,
        },
        {
          ...DEFAULT_DEPENDENCIES,
          verifyLocal: async () => verified(fixture),
          startHttp: () => {
            started = createStarted(49152);
            return started.server;
          },
        },
        {
          bindKeyboard: () => ({
            finished: keyboardFinished,
            dispose() {
              keyboardDisposals += 1;
              throw new Error('keyboard-cleanup-failed');
            },
          }),
          createScreen: () => ({
            failure: new Promise<never>(() => {}),
            dispose() {
              screenDisposals += 1;
              throw new Error('screen-cleanup-failed');
            },
          }),
          open: () => {},
          now: () => fixture.cloneDist().build.time,
        },
      );

      await listenerSettled();
      rejectKeyboard(cause);
      const outcome = await running.then(
        () => ({ rejected: false, cause: undefined }),
        (error) => ({ rejected: true, cause: error }),
      );

      expect(outcome).to.eql({ rejected: true, cause });
      expect(started?.closeCauses).to.eql([cause]);
      expect(screenDisposals).to.eql(1);
      expect(keyboardDisposals).to.eql(1);
    } finally {
      started?.release();
      Object.defineProperty(Cli.Is, 'interactive', { value: original, configurable: true });
      await teardown(fixture);
    }
  });

  it('preserves an undefined-cause server rejection over screen cleanup failure', async () => {
    const original = Cli.Is.interactive;
    Object.defineProperty(Cli.Is, 'interactive', { value: () => true, configurable: true });

    const fixture = await setup();
    let started: StartedController | undefined;
    let screenDisposals = 0;
    try {
      const running = serveLocalWith(
        {
          dir: fixture.source as t.StringDir,
          limits: fixture.policy.verification,
          keyboard: false,
          silent: false,
        },
        {
          ...DEFAULT_DEPENDENCIES,
          verifyLocal: async () => verified(fixture),
          startHttp: () => {
            started = createStarted(49152);
            return started.server;
          },
        },
        {
          bindKeyboard: () => {
            throw new Error('keyboard should remain disabled');
          },
          createScreen: () => ({
            failure: new Promise<never>(() => {}),
            dispose() {
              screenDisposals += 1;
              throw new Error('screen-cleanup-failed');
            },
          }),
          open: () => {},
          now: () => fixture.cloneDist().build.time,
        },
      );

      await listenerSettled();
      started?.fail(undefined);
      const outcome = await running.then(
        () => ({ rejected: false, cause: undefined }),
        (cause) => ({ rejected: true, cause }),
      );

      expect(outcome).to.eql({ rejected: true, cause: undefined });
      expect(screenDisposals).to.eql(1);
    } finally {
      started?.release();
      Object.defineProperty(Cli.Is, 'interactive', { value: original, configurable: true });
      await teardown(fixture);
    }
  });

  it('keeps pinned serve strict while local serve allows port fallback', async () => {
    const original = Cli.Is.interactive;
    Object.defineProperty(Cli.Is, 'interactive', { value: () => false, configurable: true });

    const fixture = await setup();
    let localStarted: StartedController | undefined;
    try {
      const shared = {
        ...DEFAULT_DEPENDENCIES,
        verify: async () => verified(fixture),
        verifyLocal: async () => verified(fixture),
      };

      const pinnedError = await catchStart(() =>
        serveWith(
          {
            dir: fixture.source as t.StringDir,
            integrity: fixture.integrity,
            limits: fixture.policy.verification,
            port: 8080,
            silent: false,
          },
          {
            ...shared,
            startHttp: () => createStarted(49152).server,
          },
        )
      );

      const localRun = serveLocalWith(
        {
          dir: fixture.source as t.StringDir,
          limits: fixture.policy.verification,
          port: 8080,
          silent: false,
        },
        {
          ...shared,
          startHttp: () => {
            localStarted = createStarted(49152);
            return localStarted.server;
          },
        },
      );
      await listenerSettled();
      expect(localStarted).to.be.an('object');
      localStarted?.release();
      const localError = await catchStart(() => localRun);

      expect(pinnedError?.reason).to.eql('address-in-use');
      expect(localError).to.eql(undefined);
    } finally {
      localStarted?.release();
      Object.defineProperty(Cli.Is, 'interactive', { value: original, configurable: true });
      await teardown(fixture);
    }
  });
});

type Fixture = Awaited<ReturnType<typeof setup>>;
type StartedController = {
  readonly release: () => void;
  readonly fail: (cause?: unknown) => void;
  readonly closeCauses: unknown[];
  readonly server: t.DistServer.Started;
};

function verified(fixture: Fixture): t.FsPkg.Dist.Verify.Verified {
  return {
    kind: 'verified',
    evidence: {
      integrity: fixture.integrity,
      manifestBytes: fixture.manifestBytes.byteLength,
      dist: fixture.cloneDist(),
      assets: { files: 0, totalBytes: 0, packageBytes: 0 },
    },
  };
}

function capture(input: Record<string, unknown>): CapturedStartInput {
  return {
    keyboard: input.keyboard,
    silent: input.silent as boolean,
    pkg: input.pkg as t.Pkg,
    hash: input.hash as t.StringHash,
    info: input.info as Record<string, string>,
  };
}

function createStarted(port: number): StartedController {
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
      release();
    },
    dispose: async () => release(),
  } as unknown as t.DistServer.Started;

  return { release, fail, closeCauses, server };
}

function keypress(key: string) {
  return { key } as Parameters<
    NonNullable<Parameters<typeof Cli.Keyboard.bind>[0]['onKey']>
  >[0];
}

async function listenerSettled() {
  await Schedule.macro();
  await Schedule.macro();
  await Schedule.macro();
}

async function catchStart(
  fn: () => Promise<unknown>,
): Promise<t.DistServer.StartError | undefined> {
  try {
    await fn();
  } catch (cause) {
    return cause as t.DistServer.StartError;
  }
}
