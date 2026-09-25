import { Cli, describe, expect, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { HttpServer } from '../mod.ts';
import { bindKeyboardWith, type KeyboardDependencies } from '../u/u.keyboard.ts';
import { type StartDependencies, startWith } from '../u/u.start.ts';
import { waitForDispose } from './u.fixture.lifecycle.ts';
import { capturePrint } from './u.fixture.print.ts';

type KeyHandler = NonNullable<t.Cli.Keyboard.Bind.Options['onKey']>;
type KeyboardCase = {
  readonly name: string;
  readonly keyboard: t.HttpServer.Start.Options['keyboard'];
  readonly bound: boolean;
  readonly binds: number;
  readonly hints: boolean;
};

describe('HttpServer.start keyboard', () => {
  describe('keyboard hints', () => {
    const cases: readonly KeyboardCase[] = [
      { name: 'omitted', keyboard: undefined, bound: true, binds: 0, hints: false },
      { name: 'off, unbound', keyboard: false, bound: false, binds: 0, hints: false },
      { name: 'off, bound', keyboard: false, bound: true, binds: 0, hints: false },
      { name: 'on, unbound', keyboard: true, bound: false, binds: 1, hints: false },
      { name: 'on, bound', keyboard: true, bound: true, binds: 1, hints: true },
      { name: 'default print', keyboard: {}, bound: true, binds: 1, hints: true },
      { name: 'hidden, unbound', keyboard: { print: false }, bound: false, binds: 1, hints: false },
      { name: 'hidden, bound', keyboard: { print: false }, bound: true, binds: 1, hints: false },
    ];

    for (const test of cases) {
      it(test.name, async () => {
        const app = HttpServer.create({ static: false });
        const finished = Promise.withResolvers<void>();
        const handle = { finished: finished.promise, dispose: () => finished.resolve() };
        let binds = 0;
        const deps: StartDependencies = {
          bindKeyboard() {
            binds += 1;
            return test.bound ? handle : undefined;
          },
        };
        const options = { port: 0, strictPort: true, keyboard: test.keyboard };
        const printed = capturePrint(() => startWith(deps, app, options));
        await using _server = printed.value;
        const output = Cli.stripAnsi(printed.output.join('\n'));

        expect(/\bopen\s+O\b/.test(output)).to.eql(test.hints);
        expect(output.includes('Ctrl+C or Q')).to.eql(test.hints);
        expect(binds).to.eql(test.binds);
      });
    }
  });

  it('opens the first status URL from the exact settled authority', async () => {
    const app = HttpServer.create({ static: false });
    let keyboard: t.Cli.Keyboard.Bind.Options | undefined;
    const commands: string[] = [];
    const keyboardFinished = Promise.withResolvers<void>();
    const shell: ReturnType<KeyboardDependencies['sh']> = {
      path: '',
      run(script) {
        commands.push(script);
        return Promise.resolve({
          code: 0,
          success: true,
          signal: null,
          stdout: new Uint8Array(),
          stderr: new Uint8Array(),
          text: { stdout: '', stderr: '' },
          toString: () => '',
        });
      },
    };
    const keyboardDeps: KeyboardDependencies = {
      bind(options) {
        keyboard = options;
        return { dispose: () => keyboardFinished.resolve(), finished: keyboardFinished.promise };
      },
      isUnavailableError: Cli.Keyboard.Is.unavailableError,
      sh: () => shell,
      exit() {
        throw new Error('Unexpected process exit.');
      },
    };
    const deps: StartDependencies = {
      bindKeyboard: (args) => bindKeyboardWith(keyboardDeps, args),
    };
    const options: t.HttpServer.Start.Options = {
      silent: true,
      hostname: '127.0.0.1',
      origin: 'exact-loopback',
      status: { urlPaths: ['/health'] },
      keyboard: true,
    };
    await using server = startWith(deps, app, options);
    // Only these fields are consumed by the HTTP key handler, not the Cliffy event machinery.
    const event = { key: 'o', ctrlKey: false } as Parameters<KeyHandler>[0];
    await keyboard?.onKey?.(event);

    expect(commands).to.eql([`open ${server.origin}/health`]);
  });

  it('defers explicit process exit until owned keyboard shutdown completes', async () => {
    const app = HttpServer.create({ static: false });
    let keyboard: t.Cli.Keyboard.Bind.Options | undefined;
    const keyboardFinished = Promise.withResolvers<void>();
    const exitRequested = Promise.withResolvers<void>();
    const exitFailure = new Error('test process exit');
    let exitCalls = 0;
    const shell: ReturnType<KeyboardDependencies['sh']> = {
      path: '',
      run() {
        throw new Error('Quitting must not run a shell command.');
      },
    };
    const keyboardDeps: KeyboardDependencies = {
      bind(options) {
        keyboard = options;
        return { dispose: () => keyboardFinished.resolve(), finished: keyboardFinished.promise };
      },
      isUnavailableError: Cli.Keyboard.Is.unavailableError,
      sh: () => shell,
      exit() {
        exitCalls += 1;
        exitRequested.resolve();
        throw exitFailure;
      },
    };
    const deps: StartDependencies = {
      bindKeyboard: (args) => bindKeyboardWith(keyboardDeps, args),
    };
    await using server = startWith(deps, app, { silent: true, keyboard: { exit: true } });

    expect(keyboard?.exit).to.eql(false);
    expect(keyboard?.onQuit()).to.eql(undefined);
    expect(exitCalls).to.eql(0);
    expect(server.status().state).to.eql('stopping');

    await exitRequested.promise;
    expect(exitCalls).to.eql(1);
    expect(server.status().state).to.eql('stopped');
    await server.close('test.keyboard.already-stopped');
  });

  it('retries keyboard disposal and waits for listener termination before stopped', async () => {
    const keyboardFinished = Promise.withResolvers<void>();
    const disposalAccepted = Promise.withResolvers<void>();
    let disposeCalls = 0;
    const server = startWithKeyboard({
      finished: keyboardFinished.promise,
      dispose() {
        disposeCalls += 1;
        if (disposeCalls === 1) throw new Error('first keyboard disposal failed');
        disposalAccepted.resolve();
      },
    });

    const closing = server.close('test.keyboard.retry');
    try {
      await server.finished;
      await disposalAccepted.promise;
      expect(disposeCalls).to.eql(2);
      expect(server.status().state).to.eql('stopping');

      keyboardFinished.resolve();
      await closing;
      expect(server.status().state).to.eql('stopped');
    } finally {
      keyboardFinished.resolve();
      await closing;
    }
  });

  it('keeps shutdown stopping while failed keyboard disposal remains unresolved', async () => {
    const keyboardFinished = Promise.withResolvers<void>();
    const disposalRequested = Promise.withResolvers<void>();
    const keyboardFailure = new Error('keyboard listener failed');
    let disposeCalls = 0;
    const server = startWithKeyboard({
      finished: keyboardFinished.promise,
      dispose() {
        disposeCalls += 1;
        disposalRequested.resolve();
        throw new Error('keyboard disposal failed');
      },
    });

    const closing = server.close('test.keyboard.pending').then(
      () => undefined,
      (cause) => cause,
    );
    try {
      await server.finished;
      await disposalRequested.promise;
      expect(disposeCalls).to.eql(2);
      expect(server.status().state).to.eql('stopping');

      keyboardFinished.reject(keyboardFailure);
      expect(await closing).to.equal(keyboardFailure);
      expect(server.status().state).to.eql('error');
    } finally {
      keyboardFinished.resolve();
      await closing;
    }
  });

  it('enters shutdown autonomously when the keyboard listener fails', async () => {
    const keyboardFinished = Promise.withResolvers<void>();
    const disposalRequested = Promise.withResolvers<void>();
    const keyboardFailure = new Error('keyboard listener failed');
    let disposeCalls = 0;
    const server = startWithKeyboard({
      finished: keyboardFinished.promise,
      dispose() {
        disposeCalls += 1;
        disposalRequested.resolve();
      },
    });
    const disposed = waitForDispose(server);

    try {
      keyboardFinished.reject(keyboardFailure);
      await disposalRequested.promise;
      await disposed;

      expect(disposeCalls).to.eql(1);
      expect(server.signal.aborted).to.eql(true);
      expect(server.status().state).to.eql('error');
      const failure = await server.close('test.keyboard.already-failed').then(
        () => undefined,
        (cause) => cause,
      );
      expect(failure).to.equal(keyboardFailure);
    } finally {
      keyboardFinished.resolve();
      // The rejection is asserted above; cleanup must also run after an earlier failed assertion.
      await Promise.allSettled([server.close()]);
    }
  });
});

/** Start a quiet server with a test-owned keyboard handle. */
function startWithKeyboard(handle: t.Cli.Keyboard.Bind.Handle) {
  const app = HttpServer.create({ static: false });
  return startWith({ bindKeyboard: () => handle }, app, { silent: true, keyboard: true });
}
