import { EventEmitter } from 'node:events';
import { bindKeyboardInput } from '@sys/cli/testing';
import { describe, expect, it, Rx, Time } from '../../-test.ts';
import { devWithDeps } from '../u.dev/mod.ts';
import { keyboardFactory } from '../u/u.keyboard.ts';
import { createDevStartupFixtures, paths, pkg } from './u.fixture.dev.ts';

describe('Vite.dev keyboard', () => {
  for (const firstGate of ['bootstrap', 'input'] as const) {
    it(`shared session: buffered open → Ctrl+C; ${firstGate} cleanup alone cannot permit exit`, async () => {
      await using fixture = await setup({ holdCleanup: true });
      expect(fixture.acquisitions).to.eql(0);
      const listenFirst = firstGate === 'bootstrap';
      const first = fixture.run(listenFirst ? 'listen' : 'keyboard');
      const second = fixture.run(listenFirst ? 'keyboard' : 'listen');
      await within(fixture.bindingAttempted);

      fixture.emit('xo');
      await within(fixture.opened);
      expect(fixture.opens).to.eql([fixture.server.url]);
      expect(fixture.acquisitions).to.eql(1);
      fixture.emit('\x03');
      await within(Promise.all([fixture.bootstrapStopping, fixture.inputStopping]));

      if (firstGate === 'bootstrap') fixture.releaseBootstrap();
      else fixture.releaseInput();
      await Time.wait(0);
      expect(fixture.exits).to.eql([]);

      if (firstGate === 'bootstrap') fixture.releaseInput();
      else fixture.releaseBootstrap();
      await within(Promise.all([first, second]));
      expect(fixture.opens).to.eql([fixture.server.url]);
      expect(fixture.bootstrapDisposals).to.eql(1);
      expect(fixture.exits).to.eql([0]);
      fixture.assertReleased();
    });
  }

  it('preserves modified open, exact redraw, and plain q', async () => {
    let redraws = 0;
    await using fixture = await setup({ redraw: () => redraws++ });
    const run = fixture.run('keyboard');
    await within(fixture.bindingAttempted);
    fixture.emit('R\x12\x1br'); // Shift+r, Ctrl+r, and Meta+r are not redraw commands.
    fixture.emit('\x0f'); // Ctrl+o marks the point at which the preceding keys were drained.
    await within(fixture.opened);
    expect(redraws).to.eql(0);
    fixture.emit('rq');
    await within(run);
    expect(fixture.opens).to.eql([fixture.server.url]);
    expect(redraws).to.eql(1);
    expect(fixture.exits).to.eql([0]);
  });

  it('raw reporter → r is inert and q still quits', async () => {
    await using fixture = await setup({
      reporter: 'raw',
      redraw() {
        throw new Error('No screen to redraw');
      },
    });
    const run = fixture.run('listen');
    await within(fixture.bindingAttempted);
    fixture.emit('ro');
    await within(fixture.opened);
    fixture.emit('q');
    await within(run);
    expect(fixture.opens).to.eql([fixture.server.url]);
    expect(fixture.exits).to.eql([0]);
  });

  for (const key of ['q', '\x03', 'o', 'r']) {
    it(`external disposal wins over queued ${JSON.stringify(key)}`, async () => {
      let redraws = 0;
      await using fixture = await setup({ redraw: () => redraws++ });
      const entries = [fixture.run('listen'), fixture.run('keyboard')];
      await within(fixture.bindingAttempted);
      const reasons: unknown[] = [];
      fixture.server.dispose$.subscribe(({ payload }) => reasons.push(payload.reason));
      fixture.emit(key);
      const disposal = fixture.server.dispose('external');
      await within(Promise.all([disposal, ...entries]));
      expect(reasons).to.eql(['external', 'external']);
      expect(fixture.opens).to.eql([]);
      expect(fixture.exits).to.eql([]);
      expect(redraws).to.eql(0);
    });
  }

  for (const failRelease of [undefined, 'error'] as const) {
    it(`public disposal joins idle terminal release (${failRelease ? 'failure' : 'success'})`, async () => {
      await using fixture = await setup({ failRelease, holdCleanup: true });
      const run = fixture.run('listen');
      await within(fixture.bindingAttempted);
      const disposal = fixture.server.dispose('external');
      expect(fixture.server[Symbol.asyncDispose]()).to.equal(disposal);
      await within(Promise.all([fixture.bootstrapStopping, fixture.inputStopping]));
      fixture.releaseBootstrap();
      await expectPending(disposal);
      expect(fixture.server.disposed).to.eql(false);
      fixture.releaseInput();
      if (failRelease) {
        for (const entry of [disposal, run]) {
          expect(await failureOf(entry)).to.have.property('message', 'Keyboard disposal failed.');
        }
      } else {
        await within(Promise.all([disposal, run]));
      }
      expect(fixture.exits).to.eql([]);
      fixture.assertReleased();
    });
  }

  it('disposal reentered during acquisition joins release even if bootstrap cleanup fails first', async () => {
    const cleanupFailure = new Error('bootstrap cleanup failed');
    const disposing = Promise.withResolvers<void>();
    await using fixture = await setup({
      cleanupFailure,
      holdCleanup: true,
      onBind: () => disposing.resolve(fixture.server.dispose('during bind')),
    });
    const run = fixture.run('listen');
    await within(Promise.all([fixture.bootstrapStopping, fixture.inputStopping]));
    fixture.releaseBootstrap();
    await expectPending(disposing.promise);
    fixture.releaseInput();
    expect(await failureOf(disposing.promise)).to.equal(cleanupFailure);
    expect(await failureOf(run)).to.equal(cleanupFailure);
    expect(fixture.exits).to.eql([]);
    fixture.assertReleased();
  });

  it('calls at disposal start and after disposal do not acquire stdin', async () => {
    await using fixture = await setup({ holdCleanup: true });
    const reentered = Promise.withResolvers<Promise<void>[]>();
    fixture.server.dispose$.pipe(Rx.take(1)).subscribe(() => {
      reentered.resolve([fixture.run('listen'), fixture.run('keyboard')]);
    });
    const disposal = fixture.server.dispose();
    const runs = await within(reentered.promise);
    await Time.wait(0);
    expect(fixture.acquisitions).to.eql(0);
    fixture.releaseBootstrap();
    await within(Promise.all([disposal, ...runs]));
    await within(fixture.run('keyboard'));
    expect(fixture.acquisitions).to.eql(0);
    expect(fixture.exits).to.eql([]);
  });

  it('non-TTY listen waits through server disposal', async () => {
    await using fixture = await setup({ terminal: false, holdCleanup: true });
    const run = fixture.run('listen');
    await expectPending(run);
    const disposal = fixture.server.dispose();
    await within(fixture.bootstrapStopping);
    await expectPending(run);
    fixture.releaseBootstrap();
    await within(Promise.all([run, disposal]));
    expect(fixture.exits).to.eql([]);
  });

  for (const failedGate of ['server', 'input'] as const) {
    it(`quit with failed ${failedGate} cleanup rejects without a successful exit`, async () => {
      const cleanupFailure = new Error('server cleanup failed');
      await using fixture = await setup({
        cleanupFailure: failedGate === 'server' ? cleanupFailure : undefined,
        failRelease: failedGate === 'input' ? 'error' : undefined,
      });
      const run = fixture.run('keyboard');
      await within(fixture.bindingAttempted);
      fixture.emit('q');
      const cause = await failureOf(run);
      if (failedGate === 'server') expect(cause).to.equal(cleanupFailure);
      else expect(cause).to.have.property('message', 'Keyboard disposal failed.');
      expect(fixture.exits).to.eql([]);
      fixture.assertReleased();
    });
  }

  it('quit preserves a recovered synchronous release failure', async () => {
    await using fixture = await setup({ failRelease: 'data', holdCleanup: true });
    const entries = [fixture.run('listen'), fixture.run('keyboard')];
    const binding = await within(fixture.bindingAttempted);
    if (!binding) throw new Error('Expected terminal binding');
    fixture.emit('q');
    await within(Promise.all([fixture.inputStopping, fixture.bootstrapStopping]));
    await Time.wait(0); // Both stop requests precede completion of the native pause barrier.
    fixture.releaseBootstrap();
    fixture.releaseInput();
    await within(binding.finished); // The binding recovered; its retained failure must still win.
    expect(binding.releaseFailure).to.have.property('message', 'Keyboard disposal failed.');
    for (const run of entries) {
      expect(await failureOf(run)).to.have.property('message', 'Keyboard disposal failed.');
    }
    expect(fixture.exits).to.eql([]);
    fixture.assertReleased();
  });

  it('redraw and cleanup throw → surface the original redraw failure', async () => {
    const redrawFailure = new Error('ENOTTY redraw failed');
    await using fixture = await setup({
      redraw: () => {
        throw redrawFailure;
      },
      cleanupFailure: new Error('server cleanup failed'),
      failRelease: 'error',
    });
    const run = fixture.run('listen');
    await within(fixture.bindingAttempted);
    fixture.emit('r');
    expect(await failureOf(run)).to.equal(redrawFailure);
    expect(fixture.bootstrapDisposals).to.eql(1);
    expect(fixture.exits).to.eql([]);
    fixture.assertReleased();
  });
});

async function setup(options: {
  terminal?: boolean;
  holdCleanup?: boolean;
  reporter?: 'raw' | 'screen';
  onBind?: () => void;
  redraw?: () => void;
  cleanupFailure?: Error;
  failRelease?: 'error' | 'data';
} = {}) {
  const input = inputFixture(options.failRelease);
  type Binding = ReturnType<typeof bindKeyboardInput>;
  const bindingAttempted = Promise.withResolvers<Binding | undefined>();
  const opened = Promise.withResolvers<void>();
  const bootstrapStopping = Promise.withResolvers<void>();
  const bootstrapRelease = Promise.withResolvers<void>();
  if (!options.holdCleanup) {
    bootstrapRelease.resolve();
    input.release();
  }
  const runs: Promise<void>[] = [];
  const opens: string[] = [];
  const exits: number[] = [];
  let bootstrapDisposals = 0;
  const deps = createDevStartupFixtures(async () => {
    bootstrapDisposals++;
    bootstrapStopping.resolve();
    await bootstrapRelease.promise;
    if (options.cleanupFailure) throw options.cleanupFailure;
  });
  const keyboard: typeof keyboardFactory = (args) => {
    return keyboardFactory(args, {
      bind(optionsForBinding) {
        const binding = options.terminal === false
          ? undefined
          : bindKeyboardInput(optionsForBinding, input.deps);
        options.onBind?.();
        bindingAttempted.resolve(binding);
        return binding;
      },
      open(url) {
        opens.push(url);
        opened.resolve();
      },
      exit: (code) => exits.push(code),
    });
  };
  const reporter = options.reporter ?? 'screen';
  const server = await devWithDeps({ pkg: pkg(), paths: paths(), reporter }, {
    ...deps,
    keyboardFactory: keyboard,
    createScreen: () => ({
      outputChanged() {},
      ready() {},
      dispose() {},
      redraw: options.redraw ?? (() => {}),
    }),
  });
  return {
    server,
    opens,
    exits,
    get acquisitions() {
      return input.acquisitions;
    },
    get bootstrapDisposals() {
      return bootstrapDisposals;
    },
    bindingAttempted: bindingAttempted.promise,
    opened: opened.promise,
    bootstrapStopping: bootstrapStopping.promise,
    inputStopping: input.stopping,
    emit: input.emit,
    assertReleased: input.assertReleased,
    releaseInput: input.release,
    releaseBootstrap: () => bootstrapRelease.resolve(),
    run(method: 'listen' | 'keyboard') {
      const run = server[method]();
      runs.push(run);
      void run.catch(() => undefined);
      return run;
    },
    async [Symbol.asyncDispose]() {
      bootstrapRelease.resolve();
      input.release();
      await within(Promise.allSettled([server.dispose(), ...runs]));
    },
  };
}

function inputFixture(failRelease?: 'data' | 'error') {
  const emitter = new EventEmitter();
  const stopping = Promise.withResolvers<void>();
  const barriers: (() => void)[] = [];
  let acquisitions = 0;
  let reading = false;
  let raw = false;
  let hold = true;
  const deps: Parameters<typeof bindKeyboardInput>[1] = {
    stdin() {
      acquisitions++;
      return {
        get isRaw() {
          return raw;
        },
        setRawMode: (value) => raw = value,
        on: (event, fn) => emitter.on(event, fn),
        removeListener(event, fn) {
          if (event === failRelease) {
            failRelease = undefined;
            throw new Error('injected input release failure');
          }
          emitter.removeListener(event, fn);
        },
        pause: () => reading = false,
        resume: () => reading = true,
      };
    },
    afterPause(callback) {
      stopping.resolve();
      if (hold) barriers.push(callback);
      else queueMicrotask(callback);
    },
  };
  return {
    deps,
    get acquisitions() {
      return acquisitions;
    },
    stopping: stopping.promise,
    emit: (bytes: string) => emitter.emit('data', new TextEncoder().encode(bytes)),
    release() {
      hold = false;
      for (const callback of barriers.splice(0)) callback();
    },
    assertReleased() {
      expect(raw).to.eql(false);
      expect(reading).to.eql(false);
      expect(emitter.eventNames()).to.eql([]);
    },
  };
}

async function expectPending(promise: Promise<void>) {
  let settled = false;
  const mark = () => settled = true;
  void promise.then(mark, mark);
  await Time.wait(0);
  expect(settled).to.eql(false);
}

async function failureOf(promise: Promise<void>): Promise<unknown> {
  const [result] = await within(Promise.allSettled([promise]));
  if (result.status === 'fulfilled') throw new Error('Expected rejection');
  return result.reason;
}

async function within<T>(promise: Promise<T>): Promise<T> {
  const deadline = Time.wait(1_000);
  try {
    return await Promise.race([
      promise,
      deadline.then(() => {
        throw new Error('Keyboard fixture did not settle before its deadline');
      }),
    ]);
  } finally {
    deadline.cancel();
  }
}
