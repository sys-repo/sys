import {
  describe,
  expect,
  type FsRooted,
  it,
  type TBootstrapStatus as BootstrapStatus,
  WebFixture,
} from '../../../-test.ts';
import { Fs, Json, type t } from '../common.ts';
import { PiFs } from '../../u.fs.ts';
import { start, type StartGuiDependencies, type StartGuiInput } from '../u.start/u.gui.ts';
import { snapshotApplicationOwner } from '../u.start/u.identity.ts';
import { prepareReleaseOwner } from '../u.start/u.materialize.ts';
import type { BootState, BootStateSource } from '../u.start/u.state.ts';
import { START_GUI_SERVICE, type StartGuiEvidence } from '../u/u.start.gui.service.ts';
import {
  appliedBrowserPolicyFixture,
  asProfileRoot,
  deferred,
  fakeGeneration,
  rejectionOf,
  type Started,
  startedFixture,
} from './u.fixture.start.gui.ts';

const ROOT = '/tmp/driver-pi-supervisor-test' as t.StringDir;
const OWNER_ROOT = '/tmp/driver-pi-supervisor-test/.pi/@sys/dist' as t.StringAbsoluteDir;
const STATUS_URL = 'http://127.0.0.1:45000/0123456789abcdefghijklmnopqrstuvwxyzabcd' as t.StringUrl;
const APP_ORIGIN = 'http://127.0.0.1:45001' as t.StringUrl;
const APPLICATION_EXPECTATION = Object.freeze({
  integrity: START_GUI_SERVICE.source.integrity,
  expectedPkg: START_GUI_SERVICE.source.expectedPkg,
});

describe('@sys/driver-pi start:gui boot supervisor', () => {
  it('projects one release boot state and closes app, lease, then status exactly once', async () => {
    const harness = createHarness();
    const run = startInput(harness);

    const ready = await harness.waitFor((projection) => projection.kind === 'redirect');
    expect(ready).to.eql({ kind: 'redirect', origin: APP_ORIGIN });
    expect(harness.opened).to.eql([STATUS_URL]);
    expect(harness.pages).to.eql([
      'preparing',
      'starting-app-host',
      'failed-configuration-invalid',
      'failed-source-unavailable',
      'failed-artifact-refused',
      'failed-repair-required',
      'failed-local-failure',
      'failed-cancelled',
      'stopping',
    ]);
    expect(harness.states.map((state) => state.kind)).to.eql([
      'preparing',
      'starting-app-host',
      'ready',
    ]);
    expect(harness.leaseMode).to.eql('shared');
    expect(harness.materializeCalls).to.eql(1);
    expect(harness.applicationStarts).to.eql(1);

    await harness.quit();
    await run;

    expect(harness.states.map((state) => state.kind)).to.eql([
      'preparing',
      'starting-app-host',
      'ready',
      'stopping',
    ]);
    expect(count(harness.events, 'app.close')).to.eql(1);
    expect(count(harness.events, 'lease.release')).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);
    expect(harness.events.indexOf('app.close')).to.be.lessThan(
      harness.events.indexOf('lease.release'),
    );
    expect(harness.events.indexOf('lease.release')).to.be.lessThan(
      harness.events.indexOf('status.close'),
    );
  });

  it('holds the real shared owner lease through application close', async () => {
    const temporary = (await Fs.makeTempDir({ prefix: 'driver-pi.supervisor.lease.' }))
      .absolute as t.StringDir;
    const root = await Fs.realPath(temporary) as t.StringDir;
    const harness = createHarness();
    let run: Promise<void> | undefined;
    let exclusive: FsRooted.Lease | undefined;

    try {
      run = start({
        cwd: asProfileRoot(root),
        deps: {
          ...harness.deps,
          ensureDir: Fs.ensureDir,
          createRooted: Fs.Capability.Rooted.create,
          start: () => Promise.resolve(startedFixture()),
        },
      });
      await harness.waitFor((projection) => projection.kind === 'redirect');

      const parent = Fs.join(root, '.pi/@sys/dist') as t.StringDir;
      const rooted = await Fs.Capability.Rooted.create({ root: parent });
      const admitted = await rooted.admit([
        { path: '@sys.driver-pi', kind: 'directory' },
      ]);
      const target = admitted.targets[0];
      expect(await rooted.acquireLease([target], { mode: 'exclusive' })).to.include({
        kind: 'busy',
      });

      await harness.quit();
      await run;
      run = undefined;

      const acquired = await rooted.acquireLease([target], { mode: 'exclusive' });
      expect(acquired.kind).to.eql('acquired');
      if (acquired.kind === 'acquired') exclusive = acquired.lease;
    } finally {
      if (run) {
        await harness.quit().catch(() => undefined);
        await run.catch(() => undefined);
      }
      await exclusive?.release();
      await Fs.remove(temporary);
    }
  });

  it('strongly retains the real shared lease after unresolved application cleanup returns', async () => {
    const temporary = (await Fs.makeTempDir({ prefix: 'driver-pi.supervisor.retained-lease.' }))
      .absolute as t.StringDir;
    const root = await Fs.realPath(temporary) as t.StringDir;
    const harness = createHarness();
    const listenerFinished = deferred();
    let run: Promise<void> | undefined;
    let exclusive: FsRooted.Lease | undefined;

    try {
      run = start({
        cwd: asProfileRoot(root),
        deps: {
          ...harness.deps,
          ensureDir: Fs.ensureDir,
          createRooted: Fs.Capability.Rooted.create,
          start: () =>
            Promise.resolve(startedFixture({
              finished: listenerFinished.promise,
              close: () => Promise.reject(new Error('application close failed')),
            })),
        },
      });
      await harness.waitFor((projection) => projection.kind === 'redirect');
      await harness.quit();
      const error = await rejectionOf(() => run!);
      run = undefined;
      expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
        kind: 'cleanup-failed',
        issues: [
          { resource: 'application-listener', state: 'unresolved' },
          { resource: 'generation-lease', state: 'unresolved' },
        ],
      });

      const parent = Fs.join(root, '.pi/@sys/dist') as t.StringDir;
      const rooted = await Fs.Capability.Rooted.create({ root: parent });
      const admitted = await rooted.admit([
        { path: '@sys.driver-pi', kind: 'directory' },
      ]);
      const target = admitted.targets[0];
      expect(await rooted.acquireLease([target], { mode: 'exclusive' })).to.include({
        kind: 'busy',
      });

      listenerFinished.resolve();
      const acquired = await rooted.acquireLease([target], {
        mode: 'exclusive',
        wait: true,
      });
      expect(acquired.kind).to.eql('acquired');
      if (acquired.kind === 'acquired') exclusive = acquired.lease;
    } finally {
      listenerFinished.resolve();
      if (run) {
        await harness.quit().catch(() => undefined);
        await run.catch(() => undefined);
      }
      await exclusive?.release();
      await Fs.remove(temporary);
    }
  });

  it('starts status and opens once before retaining malformed authority in foreground', async () => {
    const harness = createHarness();
    const run = startInput(
      harness,
      null as unknown as StartGuiEvidence,
    );
    const rejected = rejectionOf(() => run);

    const failed = await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-configuration-invalid'
    );
    expect(failed).to.eql({ kind: 'page', key: 'failed-configuration-invalid' });
    expect(harness.opened).to.eql([STATUS_URL]);
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);

    await expectPending(rejected);

    await harness.quit();
    const error = await rejected;
    expect(error.message).to.eql('start:gui refused GUI Dist package identity.');
    expect(harness.states.map((state) => state.kind)).to.eql([
      'preparing',
      'failed',
      'stopping',
    ]);
  });

  it('publishes queued screen failure before malformed authority settlement', async () => {
    const harness = createHarness();
    const screenFailure = new Error('screen failed before authority settlement');
    const run = start({
      cwd: asProfileRoot(ROOT),
      source: null as unknown as StartGuiEvidence,
      deps: {
        ...harness.deps,
        createScreen: (input) => {
          const release = harness.trackState(input.state);
          return {
            kind: 'acquired',
            failure: Promise.reject(screenFailure),
            warnOpen() {},
            dispose: release,
          };
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);

    await harness.quit();
    const error = await rejected;
    expect(error).not.to.equal(screenFailure);
    expect(error.message).to.eql('start:gui screen failed.');
  });

  it('blocks browser open and authority work for an already-settled status listener', async () => {
    const harness = createHarness();
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    harness.finishStatus();

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    expect(harness.opened).to.eql([]);
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);
    await harness.quit();
    expect((await rejected).message).to.eql('start:gui bootstrap listener stopped.');
  });

  it('contains hostile control-setup throws and still closes the acquired status owner', async () => {
    let trapCalls = 0;
    const hostile = new Proxy({}, {
      getPrototypeOf() {
        trapCalls += 1;
        throw new Error('proxy trap must not run');
      },
    });
    const harness = createHarness();
    const error = await rejectionOf(() =>
      start({
        cwd: asProfileRoot(ROOT),
        deps: {
          ...harness.deps,
          bindKeyboard: () => {
            throw hostile;
          },
        },
      })
    );

    expect(error.message).to.eql('start:gui controls failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'keyboard', state: 'unresolved' }],
    });
    expect(trapCalls).to.eql(0);
    expect(harness.opened).to.eql([]);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('retains unresolved controls through captured Array authority', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(Array.prototype, 'some');
    if (!descriptor) throw new Error('Expected Array.prototype.some descriptor.');
    const harness = createHarness();
    let ambientCalls = 0;
    let error: Error;

    try {
      Object.defineProperty(Array.prototype, 'some', {
        ...descriptor,
        value() {
          ambientCalls += 1;
          return true;
        },
      });
      error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(ROOT),
          deps: {
            ...harness.deps,
            bindKeyboard: () => {
              throw new Error('keyboard acquisition escaped without a handle');
            },
          },
        })
      );
    } finally {
      Object.defineProperty(Array.prototype, 'some', descriptor);
    }

    expect(ambientCalls).to.eql(0);
    expect(error.message).to.eql('start:gui controls failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'keyboard', state: 'unresolved' }],
    });
  });

  it('retains unresolved screen ownership after a side-effecting setup throw', async () => {
    let trapCalls = 0;
    let hiddenScreenOwnerActive = false;
    const hostile = new Proxy({}, {
      getPrototypeOf() {
        trapCalls += 1;
        throw new Error('proxy trap must not run');
      },
    });
    const harness = createHarness();
    const error = await rejectionOf(() =>
      start({
        cwd: asProfileRoot(ROOT),
        deps: {
          ...harness.deps,
          createScreen: () => {
            hiddenScreenOwnerActive = true;
            throw hostile;
          },
        },
      })
    );

    expect(error.message).to.eql('start:gui controls failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'screen', state: 'unresolved' }],
    });
    expect({ trapCalls, hiddenScreenOwnerActive }).to.eql({
      trapCalls: 0,
      hiddenScreenOwnerActive: true,
    });
    expect(harness.opened).to.eql([]);
    expect(count(harness.events, 'keyboard.dispose')).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('contains hostile application rejection values and still closes every acquired owner', async () => {
    let trapCalls = 0;
    const hostile = new Proxy({}, {
      getPrototypeOf() {
        trapCalls += 1;
        throw new Error('proxy trap must not run');
      },
    });
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () => Promise.reject(hostile),
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    expect(trapCalls).to.eql(0);
    await harness.quit();

    const error = await rejected;
    expect(error.message).to.eql('start:gui application-host failed.');
    expect(count(harness.events, 'screen.dispose')).to.eql(1);
    expect(count(harness.events, 'keyboard.dispose')).to.eql(1);
    expect(count(harness.events, 'lease.release')).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('replaces caller-owned native errors without reading hostile accessors', async () => {
    const hostile = hostileNativeError();
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () => Promise.reject(hostile.error),
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    await harness.quit();

    const error = await rejected;
    expect(error).not.to.equal(hostile.error);
    expect(error.message).to.eql('start:gui application-host failed.');
    expect(hostile.calls).to.eql(0);
    expect(count(harness.events, 'screen.dispose')).to.eql(1);
    expect(count(harness.events, 'keyboard.dispose')).to.eql(1);
    expect(count(harness.events, 'lease.release')).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('sanitizes caller-native application listener rejection after cleanup', async () => {
    const hostile = hostileNativeError();
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () =>
          Promise.resolve(startedFixture({
            finished: Promise.reject(hostile.error),
          })),
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    await harness.quit();

    const error = await rejected;
    expect(error).not.to.equal(hostile.error);
    expect(error.message).to.eql('start:gui application listener stopped.');
    expect(hostile.calls).to.eql(0);
  });

  it('sanitizes caller-native application close rejection without retaining it', async () => {
    const hostile = hostileNativeError();
    const listener = deferred();
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () =>
          Promise.resolve(startedFixture({
            finished: listener.promise,
            close: () => Promise.reject(hostile.error),
          })),
      },
    });
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    await harness.quit();
    const error = await rejected;

    expect(error).not.to.equal(hostile.error);
    expect(error.message).to.eql('start:gui cleanup failed.');
    expect(hostile.calls).to.eql(0);
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [
        { resource: 'application-listener', state: 'unresolved' },
        { resource: 'generation-lease', state: 'unresolved' },
      ],
    });
    listener.resolve();
  });

  it('contains hostile screen rejection values without an unowned observer rejection', async () => {
    let trapCalls = 0;
    const hostile = new Proxy({}, {
      getPrototypeOf() {
        trapCalls += 1;
        throw new Error('proxy trap must not run');
      },
    });
    const harness = createHarness();
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    harness.failScreen(hostile);
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    expect(trapCalls).to.eql(0);
    await harness.quit();

    expect((await rejected).message).to.eql('start:gui screen failed.');
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('treats clean keyboard-owner settlement as controls failure, not trusted intent', async () => {
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        bindKeyboard: () => ({
          finished: Promise.resolve(),
          dispose() {},
        }),
      },
    });
    const error = await rejectionOf(() => run);

    expect(harness.opened).to.eql([]);
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);
    expect(error.message).to.eql('start:gui keyboard lifecycle failed.');
  });

  it('fails unavailable screen ownership before browser or artifact work', async () => {
    const harness = createHarness();
    let disposalCalls = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        createScreen: () => ({
          kind: 'unavailable',
          failure: new Promise<never>(() => undefined),
          warnOpen() {},
          dispose() {
            disposalCalls += 1;
          },
        }),
      },
    });

    const error = await rejectionOf(() => run);
    expect(error.message).to.eql('start:gui screen unavailable.');
    expect(harness.opened).to.eql([]);
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);
    expect(disposalCalls).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('transfers screen cleanup before rejecting accessor and Proxy handles', async () => {
    for (const variant of ['accessor', 'proxy'] as const) {
      const harness = createHarness();
      let kindReads = 0;
      let proxyTraps = 0;
      let disposalCalls = 0;
      const target = {
        kind: 'acquired' as const,
        failure: new Promise<never>(() => undefined),
        warnOpen() {},
        dispose() {
          disposalCalls += 1;
        },
      };
      const returned = variant === 'accessor'
        ? Object.defineProperty(target, 'kind', {
          enumerable: true,
          get() {
            kindReads += 1;
            return 'acquired';
          },
        })
        : new Proxy(target, {
          get(source, key, receiver) {
            proxyTraps += 1;
            return Reflect.get(source, key, receiver);
          },
          getOwnPropertyDescriptor(source, key) {
            proxyTraps += 1;
            return Reflect.getOwnPropertyDescriptor(source, key);
          },
        });
      const error = await rejectionOf(() =>
        start({
          cwd: asProfileRoot(ROOT),
          deps: {
            ...harness.deps,
            createScreen: () => returned,
          },
        })
      );

      expect(error.message).to.eql('start:gui screen invalid.');
      expect({ kindReads, proxyTraps }).to.eql({ kindReads: 0, proxyTraps: 0 });
      if (variant === 'accessor') {
        expect(disposalCalls).to.eql(1);
      } else {
        expect(disposalCalls).to.eql(0);
        expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
          kind: 'cleanup-failed',
          issues: [{ resource: 'screen', state: 'unresolved' }],
        });
      }
      expect(harness.opened).to.eql([]);
      expect(harness.materializeCalls).to.eql(0);
      expect(harness.applicationStarts).to.eql(0);
    }
  });

  it('uses one copied screen variant after the returned handle mutates', async () => {
    const harness = createHarness();
    const screen = {
      kind: 'acquired' as 'acquired' | 'unavailable',
      failure: new Promise<never>(() => undefined),
      warnOpen() {},
      dispose() {},
    };
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        createScreen: () => {
          queueMicrotask(() => void (screen.kind = 'unavailable'));
          return screen;
        },
      },
    });

    await harness.waitForEvent('app.start');
    expect(screen.kind).to.eql('unavailable');
    expect(harness.opened).to.eql([STATUS_URL]);
    expect(harness.applicationStarts).to.eql(1);
    await harness.quit();
    await run;
  });

  it('contains hostile keyboard rejection values and retains fixed lifecycle evidence', async () => {
    let trapCalls = 0;
    const hostile = new Proxy({}, {
      getPrototypeOf() {
        trapCalls += 1;
        throw new Error('proxy trap must not run');
      },
    });
    const keyboard = Promise.withResolvers<void>();
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        bindKeyboard: () => ({
          finished: keyboard.promise,
          dispose() {},
        }),
      },
    });
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    keyboard.reject(hostile);
    const error = await rejected;
    expect(trapCalls).to.eql(0);
    expect(error.message).to.eql('start:gui keyboard lifecycle failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'keyboard', state: 'failed' }],
    });
  });

  it('blocks browser and release-owner work after nested same-turn cancellation', async () => {
    const stop = new AbortController();
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: {
        ...harness.deps,
        createScreen: (input) => {
          queueMicrotask(() => queueMicrotask(() => stop.abort('nested cancellation')));
          return harness.deps.createScreen(input);
        },
      },
    });

    await run;

    expect(harness.opened).to.eql([]);
    expect(count(harness.events, 'store.ensure')).to.eql(0);
    expect(count(harness.events, 'rooted.create')).to.eql(0);
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);
  });

  it('stops release-owner acquisition between lower filesystem steps', async () => {
    const stop = new AbortController();
    const ensureEntered = deferred();
    const ensureRelease = deferred();
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: {
        ...harness.deps,
        ensureDir: async () => {
          harness.events.push('delayed-store.ensure');
          ensureEntered.resolve();
          await ensureRelease.promise;
        },
      },
    });

    await ensureEntered.promise;
    const abortedDescriptor = Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted');
    if (!abortedDescriptor) throw new Error('Expected AbortSignal.aborted descriptor.');
    try {
      Object.defineProperty(AbortSignal.prototype, 'aborted', {
        ...abortedDescriptor,
        get() {
          return false;
        },
      });
      stop.abort('cancel owner acquisition');
      ensureRelease.resolve();
      await run;
    } finally {
      Object.defineProperty(AbortSignal.prototype, 'aborted', abortedDescriptor);
    }

    expect(count(harness.events, 'rooted.create')).to.eql(0);
    expect(count(harness.events, 'lease.acquire')).to.eql(0);
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);
  });

  it('validates release-owner paths before acquiring the shared lease', async () => {
    const harness = createHarness();
    const target = Object.freeze({
      kind: 'directory' as const,
      path: '@sys.driver-pi' as t.StringRelativePath,
    }) as FsRooted.Target<'directory'>;
    let acquireCalls = 0;
    const rooted = {
      get path(): t.StringAbsoluteDir {
        throw new Error('path failed before acquisition');
      },
      admit: () => Promise.resolve(Object.freeze({ targets: Object.freeze([target]) })),
      acquireLease: () => {
        acquireCalls += 1;
        return Promise.resolve(Object.freeze({ kind: 'busy' as const }));
      },
    } as unknown as FsRooted.Instance;

    const error = await rejectionOf(() =>
      prepareReleaseOwner({
        root: ROOT,
        until: new AbortController().signal,
        deps: {
          ...harness.deps,
          ensureDir: () => Promise.resolve(),
          createRooted: () => Promise.resolve(rooted),
        },
      })
    );

    expect(error.message).to.eql('start:gui materialization failed: storage/filesystem-failure');
    expect((error as Error & { materialization?: unknown }).materialization).to.eql({
      stage: 'storage',
      reason: 'filesystem-failure',
      cleanup: 'not-needed',
    });
    expect(acquireCalls).to.eql(0);
  });

  it('keeps generation-store authority fixed across PiFs mutation in every lower callback', async () => {
    const harness = createHarness();
    const mutablePiFs = PiFs as unknown as {
      root: string;
      sysDirSegments: string[];
    };
    const originalRoot = mutablePiFs.root;
    const originalSegments = mutablePiFs.sysDirSegments;
    const originalSegmentValues = [originalSegments[0], originalSegments[1]];
    const ensured: string[] = [];
    const rootedAt: string[] = [];
    const admitted: string[] = [];
    const leased: string[] = [];
    const stores: string[] = [];
    let mutations = 0;
    const mutatePiFs = () => {
      mutations += 1;
      mutablePiFs.root = `attacker-${mutations}`;
      mutablePiFs.sysDirSegments = [`outside-${mutations}`, `escape-${mutations}`];
      originalSegments[0] = `mutated-${mutations}`;
      originalSegments[1] = `redirected-${mutations}`;
    };
    let projection: BootstrapStatus.Projection<string> | undefined;
    let run: Promise<void> | undefined;
    let error: Error | undefined;

    try {
      run = start({
        cwd: asProfileRoot(ROOT),
        deps: {
          ...harness.deps,
          open: (cwd, url) => {
            mutatePiFs();
            harness.deps.open(cwd, url);
          },
          ensureDir: (path) => {
            if (typeof path !== 'string') throw new Error('Expected string store path.');
            ensured.push(path);
            mutatePiFs();
            return Promise.resolve();
          },
          createRooted: async (options) => {
            rootedAt.push(options.root);
            mutatePiFs();
            const rooted = await harness.deps.createRooted(options);
            return Object.freeze({
              path: rooted.path,
              admit: async (...args: Parameters<typeof rooted.admit>) => {
                admitted.push(args[0][0]?.path ?? 'missing');
                mutatePiFs();
                return await rooted.admit(...args);
              },
              acquireLease: (...args: Parameters<typeof rooted.acquireLease>) => {
                leased.push(args[0][0]?.path ?? 'missing');
                mutatePiFs();
                return rooted.acquireLease(...args);
              },
            }) as FsRooted.Instance;
          },
          materialize: (input) => {
            stores.push(input.storeDir);
            mutatePiFs();
            return harness.deps.materialize(input);
          },
        },
      });
      projection = await harness.waitFor((value) =>
        value.kind === 'redirect' ||
        (value.kind === 'page' && value.key.startsWith('failed-'))
      );
      await harness.quit();
      if (projection.kind === 'redirect') await run;
      else error = await rejectionOf(() => run!);
    } finally {
      mutablePiFs.root = originalRoot;
      mutablePiFs.sysDirSegments = originalSegments;
      originalSegments[0] = originalSegmentValues[0];
      originalSegments[1] = originalSegmentValues[1];
    }

    expect({ projection, error }).to.eql({
      projection: { kind: 'redirect', origin: APP_ORIGIN },
      error: undefined,
    });
    expect({ ensured, rootedAt, admitted, leased, stores }).to.eql({
      ensured: [OWNER_ROOT],
      rootedAt: [OWNER_ROOT],
      admitted: [originalRoot],
      leased: [originalRoot],
      stores: [`${OWNER_ROOT}/${originalRoot}`],
    });
    expect(mutations).to.eql(6);
  });

  it('rejects a Rooted owner outside the independently canonical store parent', async () => {
    const harness = createHarness();
    let admitCalls = 0;
    let acquireCalls = 0;
    const rooted = Object.freeze({
      path: '/attacker-selected-root' as t.StringAbsoluteDir,
      admit() {
        admitCalls += 1;
        return Promise.resolve(Object.freeze({ targets: Object.freeze([]) }));
      },
      acquireLease() {
        acquireCalls += 1;
        return Promise.resolve(Object.freeze({ kind: 'busy' as const }));
      },
    }) as unknown as FsRooted.Instance;

    const error = await rejectionOf(() =>
      prepareReleaseOwner({
        root: ROOT,
        until: new AbortController().signal,
        deps: {
          ...harness.deps,
          ensureDir: () => Promise.resolve(),
          createRooted: () => Promise.resolve(rooted),
        },
      })
    );

    expect(error.message).to.eql('start:gui materialization failed: storage/filesystem-failure');
    expect((error as Error & { materialization?: unknown }).materialization).to.eql({
      stage: 'storage',
      reason: 'filesystem-failure',
      cleanup: 'not-needed',
    });
    expect({ admitCalls, acquireCalls }).to.eql({ admitCalls: 0, acquireCalls: 0 });
  });

  it('retains lease results with mismatched mode or target evidence', async () => {
    const variants = ['mode', 'target', 'mutable', 'busy-target'] as const;

    for (const variant of variants) {
      const harness = createHarness();
      const target = Object.freeze({
        kind: 'directory' as const,
        path: '@sys.driver-pi' as t.StringRelativePath,
      }) as FsRooted.Target<'directory'>;
      const otherTarget = Object.freeze({
        kind: 'directory' as const,
        path: 'other' as t.StringRelativePath,
      }) as FsRooted.Target<'directory'>;
      let releaseCalls = 0;
      const release = () => {
        releaseCalls += 1;
        return Promise.resolve();
      };
      const lease = variant === 'mutable'
        ? {
          mode: 'shared' as const,
          targets: Object.freeze([target]),
          release,
          [Symbol.asyncDispose]: release,
        }
        : Object.freeze({
          mode: variant === 'mode' ? 'exclusive' as const : 'shared' as const,
          targets: Object.freeze([variant === 'target' ? otherTarget : target]),
          release,
          [Symbol.asyncDispose]: release,
        });
      const result = variant === 'busy-target'
        ? Object.freeze({ kind: 'busy' as const, target: otherTarget })
        : Object.freeze({ kind: 'acquired' as const, lease });
      const rooted = Object.freeze({
        path: OWNER_ROOT,
        admit: () => Promise.resolve(Object.freeze({ targets: Object.freeze([target]) })),
        acquireLease: () => Promise.resolve(result as FsRooted.LeaseResult),
      }) as unknown as FsRooted.Instance;

      const error = await rejectionOf(() =>
        prepareReleaseOwner({
          root: ROOT,
          until: new AbortController().signal,
          deps: {
            ...harness.deps,
            ensureDir: () => Promise.resolve(),
            createRooted: () => Promise.resolve(rooted),
          },
        })
      );

      expect((error as Error & { materialization?: unknown }).materialization).to.eql({
        stage: 'storage',
        reason: 'filesystem-failure',
        cleanup: 'pending',
      });
      expect({ variant, releaseCalls }).to.eql({ variant, releaseCalls: 0 });
    }
  });

  it('reports pending cleanup when a release-owner operation throws after invocation', async () => {
    const harness = createHarness();
    const failure = new Error('ensure directory threw without a transport');

    const error = await rejectionOf(() =>
      prepareReleaseOwner({
        root: ROOT,
        until: new AbortController().signal,
        deps: {
          ...harness.deps,
          ensureDir: () => {
            throw failure;
          },
        },
      })
    );

    expect(error).not.to.equal(failure);
    expect(error.message).to.eql('start:gui materialization failed: storage/filesystem-failure');
    expect((error as Error & { materialization?: unknown }).materialization).to.eql({
      stage: 'storage',
      reason: 'filesystem-failure',
      cleanup: 'pending',
    });
  });

  it('reports pending cleanup for an unobservable acquired-lease transport', async () => {
    const harness = createHarness();
    const target = Object.freeze({
      kind: 'directory' as const,
      path: '@sys.driver-pi' as t.StringRelativePath,
    }) as FsRooted.Target<'directory'>;
    let constructorReads = 0;
    let releaseCalls = 0;
    const lease = Object.freeze({
      mode: 'shared' as const,
      targets: Object.freeze([target]),
      release() {
        releaseCalls += 1;
        return Promise.resolve();
      },
      [Symbol.asyncDispose]() {
        return this.release();
      },
    }) as FsRooted.Lease;
    const acquired = Object.freeze({ kind: 'acquired' as const, lease });
    const transport = Promise.resolve(acquired);
    const testCleanup = transport.then((result) => result.lease);
    Object.defineProperty(transport, 'constructor', {
      configurable: true,
      get() {
        constructorReads += 1;
        throw new Error('acquired lease constructor invoked');
      },
    });
    const rooted = Object.freeze({
      path: OWNER_ROOT,
      admit: () => Promise.resolve(Object.freeze({ targets: Object.freeze([target]) })),
      acquireLease: () => transport,
    }) as unknown as FsRooted.Instance;

    const error = await rejectionOf(() =>
      prepareReleaseOwner({
        root: ROOT,
        until: new AbortController().signal,
        deps: {
          ...harness.deps,
          ensureDir: () => Promise.resolve(),
          createRooted: () => Promise.resolve(rooted),
        },
      })
    );

    expect(error.message).to.eql('start:gui materialization failed: storage/filesystem-failure');
    expect((error as Error & { materialization?: unknown }).materialization).to.eql({
      stage: 'storage',
      reason: 'filesystem-failure',
      cleanup: 'pending',
    });
    expect({ constructorReads, releaseCalls }).to.eql({ constructorReads: 0, releaseCalls: 0 });
    await (await testCleanup).release();
    expect(releaseCalls).to.eql(1);
  });

  it('retains malformed acquired-lease results without accessor or Proxy observation', async () => {
    const variants = ['accessor', 'proxy', 'mutated'] as const;

    for (const variant of variants) {
      const temporary = (await Fs.makeTempDir({
        prefix: `driver-pi.owner-result-${variant}.`,
      })).absolute as t.StringDir;
      const root = await Fs.realPath(temporary) as t.StringDir;
      let shared: FsRooted.Lease | undefined;
      let exclusive: FsRooted.Lease | undefined;
      let accessorReads = 0;
      let proxyTraps = 0;
      let transportThenReads = 0;

      try {
        const error = await rejectionOf(() =>
          prepareReleaseOwner({
            root,
            until: new AbortController().signal,
            deps: {
              ...createHarness().deps,
              ensureDir: Fs.ensureDir,
              createRooted: async (options) => {
                const rooted = await Fs.Capability.Rooted.create(options);
                return Object.freeze({
                  path: rooted.path,
                  admit: (...args: Parameters<typeof rooted.admit>) => rooted.admit(...args),
                  acquireLease: async (...args: Parameters<typeof rooted.acquireLease>) => {
                    const result = await rooted.acquireLease(...args);
                    if (result.kind !== 'acquired') throw new Error('Expected shared lease.');
                    shared = result.lease;

                    if (variant === 'accessor') {
                      const malformed = {};
                      Object.defineProperty(malformed, 'kind', {
                        enumerable: true,
                        get() {
                          accessorReads += 1;
                          void shared;
                          return 'acquired';
                        },
                      });
                      return malformed as FsRooted.LeaseResult;
                    }
                    if (variant === 'proxy') {
                      return new Proxy({ kind: 'acquired', lease: shared }, {
                        get(target, key, receiver) {
                          if (key === 'then') {
                            transportThenReads += 1;
                            return undefined;
                          }
                          proxyTraps += 1;
                          return Reflect.get(target, key, receiver);
                        },
                        getOwnPropertyDescriptor(target, key) {
                          proxyTraps += 1;
                          return Reflect.getOwnPropertyDescriptor(target, key);
                        },
                        ownKeys(target) {
                          proxyTraps += 1;
                          return Reflect.ownKeys(target);
                        },
                      }) as FsRooted.LeaseResult;
                    }

                    const mutable = {
                      kind: 'acquired' as 'acquired' | 'busy',
                      lease: shared,
                    };
                    queueMicrotask(() => void (mutable.kind = 'busy'));
                    return mutable as unknown as FsRooted.LeaseResult;
                  },
                }) as FsRooted.Instance;
              },
            },
          })
        );

        expect(error.message).to.eql(
          'start:gui materialization failed: storage/filesystem-failure',
        );
        expect((error as Error & { materialization?: unknown }).materialization).to.eql({
          stage: 'storage',
          reason: 'filesystem-failure',
          cleanup: 'pending',
        });
        expect({ accessorReads, proxyTraps }).to.eql({ accessorReads: 0, proxyTraps: 0 });
        expect(transportThenReads).to.eql(variant === 'proxy' ? 1 : 0);
        if (!shared) throw new Error('Expected retained shared lease.');

        const parent = Fs.join(root, '.pi/@sys/dist') as t.StringDir;
        const contender = await Fs.Capability.Rooted.create({ root: parent });
        const admitted = await contender.admit([
          { path: '@sys.driver-pi', kind: 'directory' },
        ]);
        expect(await contender.acquireLease(admitted.targets, { mode: 'exclusive' })).to.include({
          kind: 'busy',
        });

        await shared.release();
        const acquired = await contender.acquireLease(admitted.targets, { mode: 'exclusive' });
        expect(acquired.kind).to.eql('acquired');
        if (acquired.kind === 'acquired') exclusive = acquired.lease;
      } finally {
        await shared?.release();
        await exclusive?.release();
        await Fs.remove(temporary);
      }
    }
  });

  it('rolls back an acquired release-owner lease when cancellation wins transfer', async () => {
    const harness = createHarness();
    const stop = new AbortController();
    const target = Object.freeze({
      kind: 'directory' as const,
      path: '@sys.driver-pi' as t.StringRelativePath,
    }) as FsRooted.Target<'directory'>;
    let releaseCalls = 0;
    const lease = Object.freeze({
      mode: 'shared' as const,
      targets: Object.freeze([target]),
      release() {
        releaseCalls += 1;
        return Promise.resolve();
      },
      [Symbol.asyncDispose]() {
        return this.release();
      },
    }) as FsRooted.Lease;
    const rooted = Object.freeze({
      path: OWNER_ROOT,
      admit: () => Promise.resolve(Object.freeze({ targets: Object.freeze([target]) })),
      acquireLease: () => {
        stop.abort('cancel after acquisition');
        return Promise.resolve(Object.freeze({ kind: 'acquired' as const, lease }));
      },
    }) as unknown as FsRooted.Instance;

    const error = await rejectionOf(() =>
      prepareReleaseOwner({
        root: ROOT,
        until: stop.signal,
        deps: {
          ...harness.deps,
          ensureDir: () => Promise.resolve(),
          createRooted: () => Promise.resolve(rooted),
        },
      })
    );

    expect(error.message).to.eql('start:gui materialization failed: storage/filesystem-failure');
    expect((error as Error & { materialization?: unknown }).materialization).to.eql({
      stage: 'storage',
      reason: 'filesystem-failure',
      cleanup: 'complete',
    });
    expect(releaseCalls).to.eql(1);
  });

  it('keeps trusted stop ahead of a later synchronous screen failure publication', async () => {
    const harness = createHarness();
    let publishScreenFailure: ((cause: unknown) => void) | undefined;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        createScreen: (input) => {
          publishScreenFailure = input.onFailure;
          return harness.deps.createScreen(input);
        },
      },
    });
    await harness.waitFor((projection) => projection.kind === 'redirect');

    const quitting = harness.quit();
    publishScreenFailure?.(new Error('later synchronous screen failure'));
    await quitting;
    await run;

    expect(harness.states.some((state) => state.kind === 'failed')).to.eql(false);
  });

  it('keeps a public quit callback ahead of a later keyboard lifecycle accessor throw', async () => {
    const harness = createHarness();
    let finishedReads = 0;
    let disposalCalls = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        bindKeyboard: (options) => {
          options.onQuit?.();
          return Object.defineProperty(
            {
              dispose() {
                disposalCalls += 1;
              },
            },
            'finished',
            {
              enumerable: true,
              get() {
                finishedReads += 1;
                throw new Error('keyboard lifecycle accessor failed after quit');
              },
            },
          ) as ReturnType<StartGuiDependencies['bindKeyboard']>;
        },
      },
    });

    const error = await rejectionOf(() => run);

    expect(error.message).to.eql('start:gui cleanup failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'keyboard', state: 'unresolved' }],
    });
    expect(harness.states.some((state) => state.kind === 'failed')).to.eql(false);
    expect({ finishedReads, disposalCalls }).to.eql({ finishedReads: 0, disposalCalls: 1 });
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('rejects a Proxy keyboard handle without invoking traps or losing ownership truth', async () => {
    const harness = createHarness();
    let proxyTraps = 0;
    let disposalCalls = 0;
    const keyboard = new Proxy({
      finished: new Promise<void>(() => undefined),
      dispose() {
        disposalCalls += 1;
      },
    }, {
      get(target, key, receiver) {
        proxyTraps += 1;
        return Reflect.get(target, key, receiver);
      },
      getOwnPropertyDescriptor(target, key) {
        proxyTraps += 1;
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    });

    const error = await rejectionOf(() =>
      start({
        cwd: asProfileRoot(ROOT),
        deps: {
          ...harness.deps,
          bindKeyboard: () => keyboard,
        },
      })
    );

    expect(error.message).to.eql('start:gui keyboard invalid.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'keyboard', state: 'unresolved' }],
    });
    expect({ proxyTraps, disposalCalls }).to.eql({ proxyTraps: 0, disposalCalls: 0 });
    expect(harness.opened).to.eql([]);
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);
  });

  it('blocks browser open after a chained package-screen failure publication', async () => {
    const screenFailure = new Error('chained screen failure');
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        createScreen: (input) => {
          queueMicrotask(() => queueMicrotask(() => input.onFailure(screenFailure)));
          return harness.deps.createScreen(input);
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    expect(harness.opened).to.eql([]);
    expect(harness.materializeCalls).to.eql(0);
    await harness.quit();
    const error = await rejected;
    expect(error).not.to.equal(screenFailure);
    expect(error.message).to.eql('start:gui screen failed.');
  });

  it('attaches application failure observation before lower-queued cancellation', async () => {
    const stop = new AbortController();
    const failure = new Error('application failed before cancellation');
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: {
        ...harness.deps,
        start: () => {
          harness.events.push('race-app.start');
          const rejected = Promise.reject<Started>(failure);
          queueMicrotask(() => stop.abort('later queued cancellation'));
          return rejected;
        },
      },
    });

    const error = await rejectionOf(() => run);
    expect(error).not.to.equal(failure);
    expect(error.message).to.eql('start:gui application-host failed.');
    expect(
      harness.states.some((state) =>
        state.kind === 'failed' && state.safeEvidence.kind === 'cancellation'
      ),
    ).to.eql(false);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('publishes a synchronous application throw before lower-queued cancellation', async () => {
    const stop = new AbortController();
    const failure = new Error('application threw before cancellation');
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: {
        ...harness.deps,
        start: () => {
          queueMicrotask(() => stop.abort('later queued cancellation'));
          throw failure;
        },
      },
    });

    const error = await rejectionOf(() => run);
    expect(error).not.to.equal(failure);
    expect(error.message).to.eql('start:gui application-host failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [
        { resource: 'application-host', state: 'unresolved' },
        { resource: 'generation-lease', state: 'unresolved' },
      ],
    });
    expect(count(harness.events, 'lease.release')).to.eql(0);
    expect(
      harness.states.some((state) =>
        state.kind === 'failed' && state.safeEvidence.kind === 'cancellation'
      ),
    ).to.eql(false);
  });

  it('linearizes same-turn cancellation before a later application rejection', async () => {
    const application = Promise.withResolvers<Started>();
    const startEntered = deferred();
    const stop = new AbortController();
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: {
        ...harness.deps,
        start: () => {
          harness.events.push('race-app.start');
          startEntered.resolve();
          return application.promise;
        },
      },
    });
    await startEntered.promise;

    stop.abort('earlier same-turn cancellation');
    application.reject(new Error('application failed after cancellation'));
    await run;

    expect(
      harness.states.some((state) =>
        state.kind === 'failed' && state.safeEvidence.kind === 'cancellation'
      ),
    ).to.eql(true);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('attaches materialization settlement observation before lower-queued cancellation', async () => {
    const stop = new AbortController();
    const harness = createHarness();
    const failure = Object.freeze({
      kind: 'failed' as const,
      stage: 'manifest-fetch' as const,
      reason: 'resource-failure' as const,
      cleanup: 'not-needed' as const,
    });
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: {
        ...harness.deps,
        materialize: () => {
          harness.events.push('race-materialize');
          const settled = Promise.resolve(failure);
          queueMicrotask(() => stop.abort('later queued cancellation'));
          return settled;
        },
      },
    });

    const error = await rejectionOf(() => run);
    expect(error.message).to.eql(
      'start:gui materialization failed: manifest-fetch/resource-failure',
    );
    expect(
      harness.states.some((state) =>
        state.kind === 'failed' && state.safeEvidence.kind === 'cancellation'
      ),
    ).to.eql(false);
  });

  it('retains the shared lease when materialization throws after invocation', async () => {
    const harness = createHarness();
    const failure = new Error('materialization threw without a transport');
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        materialize: () => {
          harness.events.push('materialize.throw');
          throw failure;
        },
      },
    });
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    await harness.quit();
    const error = await rejected;

    expect(error).not.to.equal(failure);
    expect(error.message).to.eql('start:gui release-owner failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [
        { resource: 'materialization', state: 'unresolved', cleanup: 'pending' },
        { resource: 'generation-lease', state: 'unresolved' },
      ],
    });
    expect(count(harness.events, 'lease.release')).to.eql(0);
  });

  it('retains the shared lease for an unobservable materialization transport', async () => {
    const harness = createHarness();
    const materialization = Promise.withResolvers<t.Dist.MaterializeResult>();
    let constructorReads = 0;
    Object.defineProperty(materialization.promise, 'constructor', {
      configurable: true,
      get() {
        constructorReads += 1;
        throw new Error('materialization constructor invoked');
      },
    });
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        materialize: () => materialization.promise,
      },
    });
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    await harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui release-owner failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [
        { resource: 'materialization', state: 'unresolved', cleanup: 'pending' },
        { resource: 'generation-lease', state: 'unresolved' },
      ],
    });
    expect(constructorReads).to.eql(0);
    expect(count(harness.events, 'lease.release')).to.eql(0);
    materialization.resolve(fakeGeneration());
  });

  it('keeps a real shared lease contended after unobservable materialization returns', async () => {
    const temporary = (await Fs.makeTempDir({
      prefix: 'driver-pi.supervisor.unobservable-materialization.',
    })).absolute as t.StringDir;
    const root = await Fs.realPath(temporary) as t.StringDir;
    const harness = createHarness();
    const materialization = Promise.withResolvers<t.Dist.MaterializeResult>();
    const entered = deferred();
    Object.defineProperty(materialization.promise, 'constructor', {
      configurable: true,
      get() {
        throw new Error('unobservable materialization constructor invoked');
      },
    });
    let shared: FsRooted.Lease | undefined;
    let exclusive: FsRooted.Lease | undefined;
    let run: Promise<void> | undefined;

    try {
      run = start({
        cwd: asProfileRoot(root),
        deps: {
          ...harness.deps,
          ensureDir: Fs.ensureDir,
          createRooted: async (options) => {
            const rooted = await Fs.Capability.Rooted.create(options);
            return Object.freeze({
              path: rooted.path,
              admit: (...args: Parameters<typeof rooted.admit>) => rooted.admit(...args),
              acquireLease: async (...args: Parameters<typeof rooted.acquireLease>) => {
                const result = await rooted.acquireLease(...args);
                if (result.kind === 'acquired') shared = result.lease;
                return result;
              },
            }) as FsRooted.Instance;
          },
          materialize: () => {
            entered.resolve();
            return materialization.promise;
          },
        },
      });
      const rejected = rejectionOf(() => run!);
      await entered.promise;
      await harness.waitFor((projection) =>
        projection.kind === 'page' && projection.key === 'failed-local-failure'
      );
      await harness.quit();
      const error = await rejected;
      run = undefined;

      expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
        kind: 'cleanup-failed',
        issues: [
          { resource: 'materialization', state: 'unresolved', cleanup: 'pending' },
          { resource: 'generation-lease', state: 'unresolved' },
        ],
      });
      if (!shared) throw new Error('Expected captured shared generation lease.');

      const parent = Fs.join(root, '.pi/@sys/dist') as t.StringDir;
      const rooted = await Fs.Capability.Rooted.create({ root: parent });
      const admitted = await rooted.admit([
        { path: '@sys.driver-pi', kind: 'directory' },
      ]);
      const target = admitted.targets[0];
      expect(await rooted.acquireLease([target], { mode: 'exclusive' })).to.include({
        kind: 'busy',
      });

      await shared.release();
      const acquired = await rooted.acquireLease([target], { mode: 'exclusive' });
      expect(acquired.kind).to.eql('acquired');
      if (acquired.kind === 'acquired') exclusive = acquired.lease;
    } finally {
      materialization.resolve(fakeGeneration());
      if (run) {
        await harness.quit().catch(() => undefined);
        await run.catch(() => undefined);
      }
      await shared?.release();
      await exclusive?.release();
      await Fs.remove(temporary);
    }
  });

  it('retains the shared lease for an unobservable application transport', async () => {
    const harness = createHarness();
    const application = Promise.withResolvers<Started>();
    let constructorReads = 0;
    Object.defineProperty(application.promise, 'constructor', {
      configurable: true,
      get() {
        constructorReads += 1;
        throw new Error('application constructor invoked');
      },
    });
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () => application.promise,
      },
    });
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    await harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui application-host failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [
        { resource: 'application-host', state: 'unresolved' },
        { resource: 'generation-lease', state: 'unresolved' },
      ],
    });
    expect(constructorReads).to.eql(0);
    expect(count(harness.events, 'lease.release')).to.eql(0);
    application.resolve(startedFixture());
  });

  it('linearizes a settled status listener before same-turn trusted quit', async () => {
    const harness = createHarness();
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    harness.finishStatus();
    await harness.quit();

    expect((await rejected).message).to.eql('start:gui bootstrap listener stopped.');
    expect(
      harness.states.some((state) =>
        state.kind === 'failed' && state.safeEvidence.kind === 'local' &&
        state.safeEvidence.operation === 'status-listener'
      ),
    ).to.eql(true);
  });

  it('linearizes a settled application listener before same-turn trusted quit', async () => {
    const harness = createHarness();
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    harness.finishApplication();
    await harness.quit();

    expect((await rejected).message).to.eql('start:gui application listener stopped.');
  });

  it('linearizes trusted quit before later same-turn application settlement', async () => {
    const harness = createHarness();
    const run = startInput(harness);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    const quitting = harness.quit();
    harness.finishApplication();
    await quitting;
    await run;

    expect(
      harness.states.some((state) =>
        state.kind === 'failed' && state.safeEvidence.kind === 'local' &&
        state.safeEvidence.operation === 'application-listener'
      ),
    ).to.eql(false);
  });

  it('blocks application startup after a state-driven screen failure is queued', async () => {
    const harness = createHarness();
    const screenFailure = new Error('starting state repaint failed');
    let applicationStarts = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () => {
          applicationStarts += 1;
          return Promise.resolve(startedFixture());
        },
        createScreen: (input) => {
          const failure = Promise.withResolvers<never>();
          const releaseTracking = harness.trackState(input.state);
          const releaseObserver = input.state.subscribe((state) => {
            if (state.kind === 'starting-app-host') failure.reject(screenFailure);
          });
          return {
            kind: 'acquired',
            failure: failure.promise,
            warnOpen() {},
            dispose() {
              releaseObserver();
              releaseTracking();
            },
          };
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    expect(applicationStarts).to.eql(0);
    await harness.quit();
    const error = await rejected;
    expect(error).not.to.equal(screenFailure);
    expect(error.message).to.eql('start:gui screen failed.');
  });

  it('refuses inherited Promise mutation from a state observer before application startup', async () => {
    const harness = createHarness();
    const descriptor = Object.getOwnPropertyDescriptor(Promise.prototype, 'constructor');
    if (!descriptor) throw new Error('Expected Promise.prototype.constructor descriptor.');
    let constructorReads = 0;
    let poisoned = false;
    let applicationStarts = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () => {
          applicationStarts += 1;
          return Promise.resolve(startedFixture());
        },
        createScreen: (input) => {
          const screen = harness.deps.createScreen(input);
          const release = input.state.subscribe((state) => {
            if (poisoned || state.kind !== 'starting-app-host') return;
            poisoned = true;
            Object.defineProperty(Promise.prototype, 'constructor', {
              configurable: true,
              get() {
                constructorReads += 1;
                throw new Error('inherited Promise constructor invoked');
              },
            });
          });
          return {
            kind: screen.kind,
            failure: screen.failure,
            warnOpen: () => screen.warnOpen(),
            dispose() {
              release();
              screen.dispose();
            },
          };
        },
      },
    });
    const rejected = rejectionOf(() => run);

    let error: Error;
    try {
      error = await rejected;
    } finally {
      Object.defineProperty(Promise.prototype, 'constructor', descriptor);
    }

    expect(error.message).to.eql('start:gui Promise transport unavailable.');
    expect(constructorReads).to.eql(0);
    expect(applicationStarts).to.eql(0);
  });

  it('rejects an application listener accessor without invoking it and retains ownership', async () => {
    const harness = createHarness();
    const descriptor = Object.getOwnPropertyDescriptor(Promise.prototype, 'constructor');
    if (!descriptor) throw new Error('Expected Promise.prototype.constructor descriptor.');
    const applicationDone = deferred();
    const started = startedFixture({ finished: applicationDone.promise });
    let constructorReads = 0;
    let finishedReads = 0;
    let applicationStarts = 0;
    let closeCalls = 0;
    Object.defineProperty(started, 'finished', {
      configurable: true,
      enumerable: true,
      get() {
        finishedReads += 1;
        Object.defineProperty(Promise.prototype, 'constructor', {
          configurable: true,
          get() {
            constructorReads += 1;
            throw new Error('application listener Promise constructor invoked');
          },
        });
        return applicationDone.promise;
      },
    });
    started.close = () => {
      closeCalls += 1;
      applicationDone.resolve();
      return applicationDone.promise;
    };
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () => {
          applicationStarts += 1;
          return Promise.resolve(started);
        },
      },
    });
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    await harness.quit();

    let error: Error;
    try {
      error = await rejected;
    } finally {
      Object.defineProperty(Promise.prototype, 'constructor', descriptor);
    }

    expect(error.message).to.eql('start:gui application host invalid.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [
        { resource: 'application-listener', state: 'unresolved' },
        { resource: 'generation-lease', state: 'unresolved' },
      ],
    });
    expect({ constructorReads, finishedReads }).to.eql({
      constructorReads: 0,
      finishedReads: 0,
    });
    expect(applicationStarts).to.eql(1);
    expect(closeCalls).to.eql(1);
    expect(count(harness.events, 'lease.release')).to.eql(0);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('rejects every mismatched or mutable applied browser-policy dimension', () => {
    const policy = appliedBrowserPolicyFixture(APP_ORIGIN);
    let accessorCalls = 0;
    let proxyTrapCalls = 0;
    const accessorFetchMetadata = Object.freeze(Object.defineProperty(
      { crossSite: 'deny' },
      'missing',
      {
        enumerable: true,
        get() {
          accessorCalls += 1;
          return 'allow';
        },
      },
    ));
    const proxiedHeaders = new Proxy(policy.headers, {
      getPrototypeOf() {
        proxyTrapCalls += 1;
        throw new Error('browser-policy proxy trap');
      },
    });
    const variants: readonly unknown[] = [
      Object.freeze({ ...policy, host: 'attacker.example' }),
      Object.freeze({
        ...policy,
        dedicatedWorkers: Object.freeze([{ kind: 'blob', worker: 'worker.js' }]),
      }),
      Object.freeze({
        ...policy,
        serviceWorker: Object.freeze({ kind: 'deny' }),
      }),
      Object.freeze({
        ...policy,
        fetchMetadata: Object.freeze({ crossSite: 'allow', missing: 'allow' }),
      }),
      Object.freeze({
        ...policy,
        headers: Object.freeze({ ...policy.headers, xFrameOptions: 'SAMEORIGIN' }),
      }),
      { ...policy },
      Object.freeze({ ...policy, serviceWorker: { kind: 'tombstone', path: 'sw.js' } }),
      Object.freeze({ ...policy, fetchMetadata: accessorFetchMetadata }),
      Object.freeze({ ...policy, headers: proxiedHeaders }),
    ];

    for (const browserPolicy of variants) {
      const started = startedFixture();
      Object.defineProperty(started, 'browserPolicy', {
        configurable: true,
        enumerable: true,
        value: browserPolicy,
        writable: true,
      });
      const snapshot = snapshotApplicationOwner(started, APPLICATION_EXPECTATION);
      expect(snapshot.kind).to.eql('invalid');
      expect(snapshot.owner).not.to.eql(undefined);
    }
    expect({ accessorCalls, proxyTrapCalls }).to.eql({ accessorCalls: 0, proxyTrapCalls: 0 });
  });

  it('rejects absent, zero, IPv6, and internally inconsistent listener authority', () => {
    const variants: readonly Readonly<Record<string, unknown>>[] = [
      {
        origin: 'http://127.0.0.1:0',
        hostname: '127.0.0.1',
        port: 0,
        addr: { transport: 'tcp', hostname: '127.0.0.1', port: 0 },
        browserPolicy: appliedBrowserPolicyFixture('http://127.0.0.1:0' as t.StringUrl),
      },
      {
        origin: 'http://127.0.0.1',
        hostname: '127.0.0.1',
        port: 80,
        addr: { transport: 'tcp', hostname: '127.0.0.1', port: 80 },
        browserPolicy: appliedBrowserPolicyFixture('http://127.0.0.1' as t.StringUrl),
      },
      {
        origin: 'http://[::1]:1234',
        hostname: '::1',
        port: 1234,
        addr: { transport: 'tcp', hostname: '::1', port: 1234 },
        browserPolicy: appliedBrowserPolicyFixture('http://[::1]:1234' as t.StringUrl),
      },
      { port: 4321 },
      { hostname: 'localhost' },
      { addr: { transport: 'tcp', hostname: '127.0.0.1', port: 4321 } },
    ];

    for (const patch of variants) {
      const started = { ...startedFixture(), ...patch };
      const snapshot = snapshotApplicationOwner(started, APPLICATION_EXPECTATION);
      expect(snapshot.kind).to.eql('invalid');
      expect(snapshot.owner).not.to.eql(undefined);
    }
  });

  it('admits the native listener record and refuses inexact addresses without invoking traps', () => {
    let accessorCalls = 0;
    let proxyTrapCalls = 0;
    const accessorAddress = {
      get transport() {
        accessorCalls += 1;
        throw new Error('listener transport accessor invoked');
      },
      hostname: '127.0.0.1',
      port: 1234,
    };
    const proxyAddress = new Proxy(
      { transport: 'tcp', hostname: '127.0.0.1', port: 1234 },
      {
        get() {
          proxyTrapCalls += 1;
          throw new Error('listener address Proxy get invoked');
        },
        getOwnPropertyDescriptor() {
          proxyTrapCalls += 1;
          throw new Error('listener address Proxy descriptor invoked');
        },
        getPrototypeOf() {
          proxyTrapCalls += 1;
          throw new Error('listener address Proxy prototype invoked');
        },
        ownKeys() {
          proxyTrapCalls += 1;
          throw new Error('listener address Proxy keys invoked');
        },
      },
    );
    const customPrototypeAddress = Object.assign(Object.create({}), {
      transport: 'tcp',
      hostname: '127.0.0.1',
      port: 1234,
    });
    const residue = Symbol('listener-address-residue');
    const variants: readonly unknown[] = [
      { transport: 'udp', hostname: '127.0.0.1', port: 1234 },
      { hostname: '127.0.0.1', port: 1234 },
      accessorAddress,
      proxyAddress,
      customPrototypeAddress,
      { transport: 'tcp', hostname: '127.0.0.1', port: 1234, extra: true },
      { transport: 'tcp', hostname: '127.0.0.1', port: 1234, [residue]: true },
    ];

    for (const addr of variants) {
      const started = startedFixture();
      Object.defineProperty(started, 'addr', {
        configurable: true,
        enumerable: true,
        value: addr,
        writable: true,
      });
      const snapshot = snapshotApplicationOwner(started, APPLICATION_EXPECTATION);
      expect(snapshot.kind).to.eql('invalid');
      expect(snapshot.owner).not.to.eql(undefined);
    }

    const nativeAddress = Object.assign(Object.create(null), {
      transport: 'tcp',
      hostname: '127.0.0.1',
      port: 1234,
    });
    const nativeStarted = startedFixture();
    Object.defineProperty(nativeStarted, 'addr', {
      configurable: true,
      enumerable: true,
      value: nativeAddress,
      writable: true,
    });
    expect(snapshotApplicationOwner(nativeStarted, APPLICATION_EXPECTATION).kind).to.eql(
      'admitted',
    );
    expect({ accessorCalls, proxyTrapCalls }).to.eql({ accessorCalls: 0, proxyTrapCalls: 0 });
  });

  it('closes an application owner whose applied browser policy mismatches', async () => {
    const harness = createHarness();
    let closeCalls = 0;
    const started = startedFixture({
      close() {
        closeCalls += 1;
        return Promise.resolve();
      },
    });
    Object.defineProperty(started, 'browserPolicy', {
      configurable: true,
      enumerable: true,
      value: Object.freeze({
        ...appliedBrowserPolicyFixture(APP_ORIGIN),
        host: 'attacker.example',
      }),
      writable: true,
    });
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () => Promise.resolve(started),
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    await harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui application host invalid.');
    expect(harness.states.some((state) => state.kind === 'ready')).to.eql(false);
    expect(closeCalls).to.eql(1);
    expect(count(harness.events, 'lease.release')).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('closes malformed listener address evidence in release and development modes', async () => {
    const modes: readonly Readonly<{
      label: string;
      source?: StartGuiEvidence;
    }>[] = [
      { label: 'release' },
      {
        label: 'development',
        source: Object.freeze({
          kind: 'development',
          dir: '/tmp/driver-pi-development' as t.StringAbsoluteDir,
          integrity: START_GUI_SERVICE.source.integrity,
          expectedPkg: START_GUI_SERVICE.source.expectedPkg,
        }),
      },
    ];

    for (const mode of modes) {
      const harness = createHarness();
      let closeCalls = 0;
      const started = startedFixture({
        close() {
          closeCalls += 1;
          return Promise.resolve();
        },
      });
      Object.defineProperty(started, 'addr', {
        configurable: true,
        enumerable: true,
        value: { transport: 'udp', hostname: '127.0.0.1', port: 1234 },
        writable: true,
      });
      const run = start({
        cwd: asProfileRoot(ROOT),
        ...(mode.source ? { source: mode.source } : {}),
        deps: {
          ...harness.deps,
          start: () => Promise.resolve(started),
        },
      });
      const rejected = rejectionOf(() => run);

      await harness.waitFor((projection) =>
        projection.kind === 'page' && projection.key === 'failed-local-failure'
      );
      await harness.quit();
      const error = await rejected;

      expect({ label: mode.label, message: error.message, closeCalls }).to.eql({
        label: mode.label,
        message: 'start:gui application host invalid.',
        closeCalls: 1,
      });
      expect(harness.states.some((state) => state.kind === 'ready')).to.eql(false);
      expect(count(harness.events, 'status.close')).to.eql(1);
      expect(count(harness.events, 'lease.release')).to.eql(mode.label === 'release' ? 1 : 0);
    }
  });

  it('closes mismatched pinned application evidence in release and development modes', async () => {
    const modes: readonly Readonly<{
      label: string;
      source?: StartGuiEvidence;
    }>[] = [
      { label: 'release' },
      {
        label: 'development',
        source: Object.freeze({
          kind: 'development',
          dir: '/tmp/driver-pi-development' as t.StringAbsoluteDir,
          integrity: START_GUI_SERVICE.source.integrity,
          expectedPkg: START_GUI_SERVICE.source.expectedPkg,
        }),
      },
    ];

    for (const mode of modes) {
      const harness = createHarness();
      let closeCalls = 0;
      const started = startedFixture({
        close() {
          closeCalls += 1;
          harness.events.push('refused.app.close');
          return Promise.resolve();
        },
      });
      Object.defineProperty(started, 'authority', {
        configurable: true,
        enumerable: true,
        value: Object.freeze({
          kind: 'pinned',
          integrity: 'sha256-1111111111111111111111111111111111111111111111111111111111111111',
        }),
      });
      const run = start({
        cwd: asProfileRoot(ROOT),
        ...(mode.source ? { source: mode.source } : {}),
        deps: {
          ...harness.deps,
          start: () => Promise.resolve(started),
        },
      });
      const rejected = rejectionOf(() => run);

      await harness.waitFor((projection) =>
        projection.kind === 'page' && projection.key === 'failed-artifact-refused'
      );
      await harness.quit();
      const error = await rejected;

      expect({ label: mode.label, message: error.message, closeCalls }).to.eql({
        label: mode.label,
        message: 'start:gui refused GUI Dist package identity.',
        closeCalls: 1,
      });
      expect(harness.states.some((state) => state.kind === 'ready')).to.eql(false);
      if (mode.label === 'release') {
        expect(harness.events.indexOf('refused.app.close')).to.be.lessThan(
          harness.events.indexOf('lease.release'),
        );
      }
    }
  });

  it('refuses a listener origin mutated before application admission', async () => {
    const harness = createHarness();
    const applicationDone = deferred();
    const started = startedFixture({ finished: applicationDone.promise });
    const attackerOrigin = 'http://127.0.0.1:59999' as t.StringUrl;
    let closeCalls = 0;
    started.close = () => {
      closeCalls += 1;
      applicationDone.resolve();
      return applicationDone.promise;
    };

    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () => {
          const transport = Promise.resolve(started);
          queueMicrotask(() => {
            Object.defineProperty(started, 'origin', {
              configurable: true,
              enumerable: true,
              value: attackerOrigin,
              writable: true,
            });
          });
          return transport;
        },
      },
    });
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    await harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui application host invalid.');
    expect(harness.states.some((state) => state.kind === 'ready')).to.eql(false);
    expect(Json.stringify(harness.states)).not.to.include(attackerOrigin);
    expect(closeCalls).to.eql(1);
    expect(count(harness.events, 'lease.release')).to.eql(1);
  });

  it('keeps copied ready authority after the lower application owner mutates', async () => {
    const harness = createHarness();
    const started = startedFixture();
    const attackerOrigin = 'http://127.0.0.1:59999' as t.StringUrl;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () => Promise.resolve(started),
      },
    });

    expect(await harness.waitFor((projection) => projection.kind === 'redirect')).to.eql({
      kind: 'redirect',
      origin: 'http://127.0.0.1:1234',
    });
    Object.defineProperties(started, {
      origin: {
        configurable: true,
        enumerable: true,
        value: attackerOrigin,
        writable: true,
      },
      browserPolicy: {
        configurable: true,
        enumerable: true,
        value: appliedBrowserPolicyFixture(attackerOrigin),
        writable: true,
      },
    });

    expect(await harness.waitFor((projection) => projection.kind === 'redirect')).to.eql({
      kind: 'redirect',
      origin: 'http://127.0.0.1:1234',
    });
    expect(Json.stringify(harness.states)).not.to.include(attackerOrigin);

    await harness.quit();
    await run;
  });

  it('owns a synchronous boot-state observer throw and blocks application startup', async () => {
    let applicationStarts = 0;
    let trapCalls = 0;
    const harness = createHarness();
    const hostile = new Proxy({}, {
      getPrototypeOf() {
        trapCalls += 1;
        throw new Error('observer failure proxy trap');
      },
    });
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () => {
          applicationStarts += 1;
          return Promise.resolve(startedFixture());
        },
        createScreen: (input) => {
          const releaseTracking = harness.trackState(input.state);
          const releaseObserver = input.state.subscribe((state) => {
            if (state.kind === 'starting-app-host') throw hostile;
          });
          return {
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            warnOpen() {},
            dispose() {
              releaseObserver();
              releaseTracking();
            },
          };
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    expect(applicationStarts).to.eql(0);
    await harness.quit();

    const error = await rejected;
    expect(error.message).to.eql('start:gui boot-state observer failed.');
    expect(trapCalls).to.eql(0);
  });

  it('retains a synchronous state-observer failure after trusted stop', async () => {
    let trapCalls = 0;
    const hostile = new Proxy({}, {
      getPrototypeOf() {
        trapCalls += 1;
        throw new Error('observer failure proxy trap');
      },
    });
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        createScreen: (input) => {
          const releaseTracking = harness.trackState(input.state);
          const releaseObserver = input.state.subscribe((state) => {
            if (state.kind === 'stopping') throw hostile;
          });
          return {
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            warnOpen() {},
            dispose() {
              releaseObserver();
              releaseTracking();
            },
          };
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) => projection.kind === 'redirect');
    await harness.quit();

    const error = await rejected;
    expect(error.message).to.eql('start:gui cleanup failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'state-observer', state: 'failed' }],
    });
    expect(trapCalls).to.eql(0);
  });

  it('refuses ready when the admitted application listener is already settled', async () => {
    const harness = createHarness();
    let applicationCloses = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () =>
          Promise.resolve(startedFixture({
            finished: Promise.resolve(),
            close: () => {
              applicationCloses += 1;
              return Promise.resolve();
            },
          })),
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    expect(harness.states.some((state) => state.kind === 'ready')).to.eql(false);
    expect(applicationCloses).to.eql(1);
    await harness.quit();
    expect((await rejected).message).to.eql('start:gui application listener stopped.');
  });

  it('retains no-application materialization failure and preserves primary cleanup precedence', async () => {
    const failure = Object.freeze({
      kind: 'failed' as const,
      stage: 'manifest-fetch' as const,
      reason: 'resource-failure' as const,
      cleanup: 'pending' as const,
    });
    const harness = createHarness({
      materialization: failure,
      statusCloseFailure: new Error('raw status close failure'),
    });
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);

    expect(
      await harness.waitFor((projection) =>
        projection.kind === 'page' && projection.key === 'failed-source-unavailable'
      ),
    ).to.eql({ kind: 'page', key: 'failed-source-unavailable' });
    expect(harness.applicationStarts).to.eql(0);
    expect(harness.states.at(-1)).to.eql({
      kind: 'failed',
      category: 'source-unavailable',
      safeEvidence: {
        kind: 'materialization',
        stage: 'manifest-fetch',
        reason: 'resource-failure',
        cleanup: 'pending',
      },
    });
    await expectPending(rejected);

    await harness.quit();
    const error = await rejected;
    expect(error.message).to.eql(
      'start:gui materialization failed: manifest-fetch/resource-failure',
    );
    expect((error as Error & { materialization?: unknown }).materialization).to.eql({
      stage: 'manifest-fetch',
      reason: 'resource-failure',
      cleanup: 'pending',
    });
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'status-listener', state: 'failed' }],
    });
    expect(count(harness.events, 'lease.release')).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('retains pending successful-generation cleanup when package identity is refused', async () => {
    const harness = createHarness({
      materialization: fakeGeneration(
        Object.freeze({ name: '@other/package', version: '1.0.0' }),
        { cleanup: 'pending' },
      ),
    });
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-artifact-refused'
    );
    expect(harness.applicationStarts).to.eql(0);
    await harness.quit();

    const error = await rejected;
    expect(error.message).to.eql('start:gui refused GUI Dist package identity.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'materialization', state: 'unresolved', cleanup: 'pending' }],
    });
  });

  it('retains pending private-stage cleanup from an admitted successful generation', async () => {
    const harness = createHarness({
      materialization: fakeGeneration(undefined, { cleanup: 'pending' }),
    });
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) => projection.kind === 'redirect');
    expect(harness.applicationStarts).to.eql(1);
    await harness.quit();

    const error = await rejected;
    expect(error.message).to.eql('start:gui cleanup failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'materialization', state: 'unresolved', cleanup: 'pending' }],
    });
  });

  it('retains pending materializer cleanup after external cancellation wins', async () => {
    const materialization = Promise.withResolvers<t.Dist.MaterializeResult>();
    const materializeEntered = deferred();
    const stop = new AbortController();
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: {
        ...harness.deps,
        materialize: () => {
          harness.events.push('pending-cleanup.materialize');
          materializeEntered.resolve();
          return materialization.promise;
        },
      },
    });
    const rejected = rejectionOf(() => run);
    await materializeEntered.promise;

    stop.abort('external cancellation first');
    await Promise.resolve();
    materialization.resolve(Object.freeze({
      kind: 'failed',
      stage: 'resource-pull',
      reason: 'cancelled',
      cleanup: 'pending',
      publication: 'committed',
    }));

    const error = await rejected;
    expect(error.message).to.eql('start:gui cleanup failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{
        resource: 'materialization',
        state: 'unresolved',
        stage: 'resource-pull',
        reason: 'cancelled',
        cleanup: 'pending',
        publication: 'committed',
      }],
    });
    expect((error as Error & { materialization?: unknown }).materialization).to.eql({
      kind: 'materialization',
      stage: 'resource-pull',
      reason: 'cancelled',
      cleanup: 'pending',
      publication: 'committed',
    });
    expect(harness.applicationStarts).to.eql(0);
  });

  it('retains pending materializer cleanup behind an earlier screen failure', async () => {
    const materialization = Promise.withResolvers<t.Dist.MaterializeResult>();
    const materializeEntered = deferred();
    const screenFailure = new Error('screen failed before lower settlement');
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        materialize: () => {
          harness.events.push('secondary-cleanup.materialize');
          materializeEntered.resolve();
          return materialization.promise;
        },
      },
    });
    const rejected = rejectionOf(() => run);
    await materializeEntered.promise;

    harness.failScreen(screenFailure);
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    materialization.resolve(Object.freeze({
      kind: 'failed',
      stage: 'resource-pull',
      reason: 'cancelled',
      cleanup: 'pending',
    }));
    await harness.quit();

    const error = await rejected;
    expect(error).not.to.equal(screenFailure);
    expect(error.message).to.eql('start:gui screen failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{
        resource: 'materialization',
        state: 'unresolved',
        stage: 'resource-pull',
        reason: 'cancelled',
        cleanup: 'pending',
      }],
    });
    expect((error as Error & { materialization?: unknown }).materialization).to.eql({
      kind: 'materialization',
      stage: 'resource-pull',
      reason: 'cancelled',
      cleanup: 'pending',
    });
  });

  it('retains publication truth after cancellation without claiming cleanup failure', async () => {
    const materialization = Promise.withResolvers<t.Dist.MaterializeResult>();
    const materializeEntered = deferred();
    const stop = new AbortController();
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: {
        ...harness.deps,
        materialize: () => {
          harness.events.push('publication-evidence.materialize');
          materializeEntered.resolve();
          return materialization.promise;
        },
      },
    });
    const rejected = rejectionOf(() => run);
    await materializeEntered.promise;

    stop.abort('external cancellation first');
    await Promise.resolve();
    materialization.resolve(Object.freeze({
      kind: 'failed',
      stage: 'existing-verification',
      reason: 'verification-failure',
      cleanup: 'complete',
      publication: 'occupied',
    }));

    const error = await rejected;
    expect(error.message).to.eql('start:gui retained secondary materialization evidence.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql(undefined);
    expect((error as Error & { materialization?: unknown }).materialization).to.eql({
      kind: 'materialization',
      stage: 'existing-verification',
      reason: 'verification-failure',
      cleanup: 'complete',
      publication: 'occupied',
    });
  });

  it('maps only occupied invalid-generation evidence to repair-required', async () => {
    const harness = createHarness({
      materialization: Object.freeze({
        kind: 'failed',
        stage: 'existing-verification',
        reason: 'verification-failure',
        cleanup: 'not-needed',
        publication: 'occupied',
      }),
    });
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-repair-required'
    );
    await harness.quit();
    await rejected;
  });

  it('keeps an unexplained lower cancelled result as a primary failure', async () => {
    const harness = createHarness({
      materialization: Object.freeze({
        kind: 'failed',
        stage: 'resource-pull',
        reason: 'cancelled',
        cleanup: 'complete',
      }),
    });
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-cancelled'
    );
    await harness.quit();

    const error = await rejected;
    expect(error.message).to.eql('start:gui materialization failed: resource-pull/cancelled');
  });

  it('does not bind controls, open, or settle authority when bootstrap startup fails', async () => {
    const harness = createHarness();
    const failure = new Error('bootstrap bind failed');
    const error = await rejectionOf(() =>
      start({
        cwd: asProfileRoot(ROOT),
        source: null as unknown as StartGuiEvidence,
        deps: {
          ...harness.deps,
          startStatus: () => Promise.reject(failure),
        },
      })
    );

    expect(error).not.to.equal(failure);
    expect(error.message).to.eql('start:gui bootstrap startup failed.');
    expect(harness.events).to.eql([]);
    expect(harness.opened).to.eql([]);
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);
  });

  it('retains unresolved status truth when startup throws without a transport', async () => {
    const harness = createHarness();
    const failure = new Error('bootstrap startup threw without a transport');
    let starts = 0;
    const error = await rejectionOf(() =>
      start({
        cwd: asProfileRoot(ROOT),
        deps: {
          ...harness.deps,
          startStatus: () => {
            starts += 1;
            throw failure;
          },
        },
      })
    );

    expect(error).not.to.equal(failure);
    expect(error.message).to.eql('start:gui bootstrap startup failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'status-listener', state: 'unresolved' }],
    });
    expect(starts).to.eql(1);
    expect(harness.events).to.eql([]);
  });

  it('settles pre-aborted cancellation without opening or starting artifact work', async () => {
    const harness = createHarness();
    const cancelled = new AbortController();
    cancelled.abort('already cancelled');

    await start({
      cwd: asProfileRoot(ROOT),
      until: cancelled.signal,
      deps: harness.deps,
    });

    expect(harness.opened).to.eql([]);
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);
    expect(harness.states).to.eql([]);
    expect(count(harness.events, 'keyboard.bind')).to.eql(0);
    expect(count(harness.events, 'screen.create')).to.eql(0);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('honors pre-aborted cancellation through captured microtask authority', async () => {
    const harness = createHarness();
    const cancelled = new AbortController();
    cancelled.abort('already cancelled');
    let ambientQueueCalls = 0;
    let run: Promise<void>;

    {
      using _mock = WebFixture.Property.mock([{
        target: globalThis,
        key: 'queueMicrotask',
        descriptor: {
          configurable: true,
          writable: true,
          value() {
            ambientQueueCalls += 1;
          },
        },
      }]);
      run = start({
        cwd: asProfileRoot(ROOT),
        until: cancelled.signal,
        deps: harness.deps,
      });
    }

    await run!;
    expect(ambientQueueCalls).to.eql(0);
    expect(harness.opened).to.eql([]);
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);
    expect(count(harness.events, 'keyboard.bind')).to.eql(0);
    expect(count(harness.events, 'screen.create')).to.eql(0);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('observes cancellation through captured AbortSignal and EventTarget authority', async () => {
    const harness = createHarness();
    const cancelled = new AbortController();
    const statusInvoked = deferred();
    const statusTransport = Promise.withResolvers<BootstrapStatus.Started>();
    const statusDone = deferred();
    const addDescriptor = Object.getOwnPropertyDescriptor(
      EventTarget.prototype,
      'addEventListener',
    );
    const abortedDescriptor = Object.getOwnPropertyDescriptor(
      AbortSignal.prototype,
      'aborted',
    );
    if (!addDescriptor || !abortedDescriptor) throw new Error('Expected abort descriptors.');
    let ambientAddCalls = 0;
    let ambientAbortedReads = 0;
    let statusCloseCalls = 0;
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      Object.defineProperty(EventTarget.prototype, 'addEventListener', addDescriptor);
      Object.defineProperty(AbortSignal.prototype, 'aborted', abortedDescriptor);
    };
    const status = {
      url: STATUS_URL,
      finished: statusDone.promise,
      close() {
        statusCloseCalls += 1;
        statusDone.resolve();
        return Promise.resolve();
      },
    } as BootstrapStatus.Started;

    const run = start({
      cwd: asProfileRoot(ROOT),
      until: cancelled.signal,
      deps: {
        ...harness.deps,
        startStatus: () => {
          statusInvoked.resolve();
          return statusTransport.promise;
        },
        bindKeyboard: (input) => {
          restore();
          cancelled.abort('captured cancellation');
          return harness.deps.bindKeyboard(input);
        },
      },
    });
    await statusInvoked.promise;

    try {
      Object.defineProperty(EventTarget.prototype, 'addEventListener', {
        ...addDescriptor,
        value() {
          ambientAddCalls += 1;
        },
      });
      Object.defineProperty(AbortSignal.prototype, 'aborted', {
        ...abortedDescriptor,
        get() {
          ambientAbortedReads += 1;
          return false;
        },
      });
      statusTransport.resolve(status);
      await run;
    } finally {
      restore();
    }

    expect({ ambientAddCalls, ambientAbortedReads }).to.eql({
      ambientAddCalls: 0,
      ambientAbortedReads: 0,
    });
    expect(harness.opened).to.eql([]);
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);
    expect(count(harness.events, 'keyboard.bind')).to.eql(1);
    expect(count(harness.events, 'keyboard.dispose')).to.eql(1);
    expect(count(harness.events, 'screen.create')).to.eql(0);
    expect(statusCloseCalls).to.eql(1);
  });

  it('cancels in-flight materialization through the owned signal and releases its lease', async () => {
    const harness = createHarness();
    const cancelled = new AbortController();
    const entered = deferred();
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: cancelled.signal,
      deps: {
        ...harness.deps,
        materialize: (input) => {
          entered.resolve();
          const signal = input.until as AbortSignal;
          return new Promise((resolve) => {
            signal.addEventListener('abort', () =>
              resolve(Object.freeze({
                kind: 'failed',
                stage: 'resource-pull',
                reason: 'cancelled',
                cleanup: 'complete',
              })), { once: true });
          });
        },
      },
    });

    await entered.promise;
    cancelled.abort('cancel during materialization');
    await run;

    expect(harness.applicationStarts).to.eql(0);
    expect(count(harness.events, 'lease.release')).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);
    const failed = harness.states.find((state) => state.kind === 'failed');
    expect(failed).to.eql({
      kind: 'failed',
      category: 'cancelled',
      safeEvidence: { kind: 'cancellation' },
    });
  });

  it('retains pre-ready screen failure without cancellation overwrite', async () => {
    const harness = createHarness();
    const entered = deferred();
    const screenFailure = new Error('screen failed during materialization');
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        materialize: (input) => {
          entered.resolve();
          return new Promise((resolve) => {
            (input.until as AbortSignal).addEventListener('abort', () => {
              resolve(Object.freeze({
                kind: 'failed',
                stage: 'resource-pull',
                reason: 'cancelled',
                cleanup: 'complete',
              }));
            }, { once: true });
          });
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await entered.promise;
    harness.failScreen(screenFailure);
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );

    await expectPending(rejected);
    expect(harness.states.at(-1)).to.eql({
      kind: 'failed',
      category: 'local-failure',
      safeEvidence: { kind: 'local', operation: 'screen' },
    });
    expect(
      harness.states.some((state) => state.kind === 'failed' && state.category === 'cancelled'),
    ).to.eql(false);
    expect(harness.applicationStarts).to.eql(0);

    await harness.quit();
    const error = await rejected;
    expect(error).not.to.equal(screenFailure);
    expect(error.message).to.eql('start:gui screen failed.');
  });

  it('retains pre-ready status-listener death without cancellation overwrite', async () => {
    const harness = createHarness();
    const entered = deferred();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        materialize: (input) => {
          entered.resolve();
          return new Promise((resolve) => {
            (input.until as AbortSignal).addEventListener('abort', () => {
              resolve(Object.freeze({
                kind: 'failed',
                stage: 'resource-pull',
                reason: 'cancelled',
                cleanup: 'complete',
              }));
            }, { once: true });
          });
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await entered.promise;
    harness.finishStatus();
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );

    await expectPending(rejected);
    expect(harness.states.at(-1)).to.eql({
      kind: 'failed',
      category: 'local-failure',
      safeEvidence: { kind: 'local', operation: 'status-listener' },
    });
    expect(
      harness.states.some((state) => state.kind === 'failed' && state.category === 'cancelled'),
    ).to.eql(false);
    expect(harness.applicationStarts).to.eql(0);

    await harness.quit();
    expect((await rejected).message).to.eql('start:gui bootstrap listener stopped.');
  });

  it('owns and closes an application host returned after pre-ready failure', async () => {
    const harness = createHarness();
    const startEntered = deferred();
    const lateApplicationClosed = deferred();
    const lateApplication = Promise.withResolvers<Started>();
    const screenFailure = new Error('screen failed during application start');
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: () => {
          harness.events.push('late-app.start');
          startEntered.resolve();
          return lateApplication.promise;
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await startEntered.promise;
    harness.failScreen(screenFailure);
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    const abortedDescriptor = Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted');
    if (!abortedDescriptor) throw new Error('Expected AbortSignal.aborted descriptor.');
    let ambientAbortedReads = 0;
    try {
      Object.defineProperty(AbortSignal.prototype, 'aborted', {
        ...abortedDescriptor,
        get() {
          ambientAbortedReads += 1;
          return false;
        },
      });
      lateApplication.resolve(startedFixture({
        close: () => {
          harness.events.push('late-app.close');
          lateApplicationClosed.resolve();
          return Promise.resolve();
        },
      }));
      await lateApplicationClosed.promise;
    } finally {
      Object.defineProperty(AbortSignal.prototype, 'aborted', abortedDescriptor);
    }

    expect(ambientAbortedReads).to.eql(0);
    expect(count(harness.events, 'late-app.close')).to.eql(1);
    expect(harness.states.some((state) => state.kind === 'ready')).to.eql(false);
    await expectPending(rejected);

    await harness.quit();
    const error = await rejected;
    expect(error).not.to.equal(screenFailure);
    expect(error.message).to.eql('start:gui screen failed.');
    expect(count(harness.events, 'late-app.close')).to.eql(1);
  });

  it('continues to ready after one failed opener attempt and keeps the warning terminal-only', async () => {
    const harness = createHarness({ openFailure: new Error('opener failed') });
    const run = startInput(harness);

    expect(await harness.waitFor((projection) => projection.kind === 'redirect')).to.eql({
      kind: 'redirect',
      origin: APP_ORIGIN,
    });
    expect(harness.opened).to.eql([STATUS_URL]);
    expect(harness.openWarnings).to.eql(1);
    expect(harness.applicationStarts).to.eql(1);

    await harness.quit();
    await run;
  });

  it('closes unsafe application work but retains screen failure after ready until trusted quit', async () => {
    const harness = createHarness();
    const screenFailure = new Error('screen failed after ready');
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    harness.failScreen(screenFailure);
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );

    await expectPending(rejected);
    expect(count(harness.events, 'app.close')).to.eql(1);
    expect(count(harness.events, 'lease.release')).to.eql(0);
    expect(count(harness.events, 'status.close')).to.eql(0);
    expect(harness.states.at(-1)).to.eql({
      kind: 'failed',
      category: 'local-failure',
      safeEvidence: { kind: 'local', operation: 'screen' },
    });

    await harness.quit();
    const error = await rejected;
    expect(error).not.to.equal(screenFailure);
    expect(error.message).to.eql('start:gui screen failed.');
    expect(count(harness.events, 'app.close')).to.eql(1);
    expect(count(harness.events, 'lease.release')).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('leaves an earlier failure foreground when the keyboard owner disappears', async () => {
    const harness = createHarness();
    const screenFailure = new Error('screen failed before keyboard loss');
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    harness.failScreen(screenFailure);
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    await expectPending(rejected);

    harness.finishKeyboard();
    const error = await rejected;
    expect(error).not.to.equal(screenFailure);
    expect(error.message).to.eql('start:gui screen failed.');
    expect(count(harness.events, 'app.close')).to.eql(1);
    expect(count(harness.events, 'lease.release')).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('preserves first failure over simultaneous unresolved cleanup evidence', async () => {
    const screenFailure = new Error('screen failed first');
    const harness = createHarness({
      appCloseFailure: new Error('raw application close failure'),
      statusCloseFailure: new Error('raw status close failure'),
    });
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    harness.failScreen(screenFailure);
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );
    await harness.quit();
    const error = await rejected;

    expect(error).not.to.equal(screenFailure);
    expect(error.message).to.eql('start:gui screen failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [
        { resource: 'application-listener', state: 'unresolved' },
        { resource: 'generation-lease', state: 'unresolved' },
        { resource: 'status-listener', state: 'failed' },
      ],
    });
    expect(count(harness.events, 'app.close')).to.eql(1);
    expect(count(harness.events, 'lease.release')).to.eql(0);
    expect(count(harness.events, 'status.close')).to.eql(1);

    harness.finishApplication();
    await harness.waitForEvent('lease.release');
    expect(count(harness.events, 'lease.release')).to.eql(1);
  });

  it('reports unresolved screen and keyboard owners without blocking lower cleanup', async () => {
    const stop = new AbortController();
    const keyboardFinished = deferred();
    const harness = createHarness();
    let keyboardDisposals = 0;
    let screenDisposals = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: {
        ...harness.deps,
        bindKeyboard: () => ({
          finished: keyboardFinished.promise,
          dispose() {
            keyboardDisposals += 1;
            throw new Error('keyboard disposal failed');
          },
        }),
        createScreen: (input) => {
          const release = harness.trackState(input.state);
          return {
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            warnOpen() {},
            dispose() {
              release();
              screenDisposals += 1;
              throw new Error('screen disposal failed');
            },
          };
        },
      },
    });
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    stop.abort('presentation cleanup test');
    const error = await rejected;

    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [
        { resource: 'screen', state: 'unresolved' },
        { resource: 'keyboard', state: 'unresolved' },
      ],
    });
    expect(keyboardDisposals).to.be.greaterThan(0);
    expect(screenDisposals).to.be.greaterThan(0);
    expect(count(harness.events, 'app.close')).to.eql(1);
    expect(count(harness.events, 'lease.release')).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);
    keyboardFinished.resolve();
  });

  it('waits for delayed keyboard settlement after disposal is accepted exactly once', async () => {
    const stop = new AbortController();
    const keyboardFinished = deferred();
    const keyboardDisposed = deferred();
    const harness = createHarness();
    let disposeCalls = 0;
    let runSettled = false;
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: {
        ...harness.deps,
        bindKeyboard: () => ({
          finished: keyboardFinished.promise,
          dispose() {
            disposeCalls += 1;
            keyboardDisposed.resolve();
          },
        }),
      },
    });
    void run.then(
      () => void (runSettled = true),
      () => void (runSettled = true),
    );

    try {
      await harness.waitFor((projection) => projection.kind === 'redirect');
      stop.abort('delayed keyboard listener termination');
      await keyboardDisposed.promise;

      expect({ disposeCalls, runSettled }).to.eql({ disposeCalls: 1, runSettled: false });

      keyboardFinished.resolve();
      await run;
      expect({ disposeCalls, runSettled }).to.eql({ disposeCalls: 1, runSettled: true });
    } finally {
      keyboardFinished.resolve();
      await run.catch(() => undefined);
    }
  });

  it('retries unresolved keyboard disposal when delayed listener work terminates', async () => {
    const stop = new AbortController();
    const keyboardFinished = deferred();
    const harness = createHarness();
    let disposeCalls = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: {
        ...harness.deps,
        bindKeyboard: () => ({
          finished: keyboardFinished.promise,
          dispose() {
            disposeCalls += 1;
            if (disposeCalls < 3) throw new Error('keyboard disposal not yet accepted');
          },
        }),
      },
    });
    const rejected = rejectionOf(() => run);

    try {
      await harness.waitFor((projection) => projection.kind === 'redirect');
      stop.abort('retry keyboard disposal after listener termination');
      const error = await rejected;

      expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
        kind: 'cleanup-failed',
        issues: [{ resource: 'keyboard', state: 'unresolved' }],
      });
      expect(disposeCalls).to.eql(2);

      keyboardFinished.resolve();
      await keyboardFinished.promise;
      await Promise.resolve();
      expect(disposeCalls).to.eql(3);
    } finally {
      keyboardFinished.resolve();
      await run.catch(() => undefined);
    }
  });

  it('retains and retries a screen owner after initial disposal failure', async () => {
    const stop = new AbortController();
    let disposeCalls = 0;
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: {
        ...harness.deps,
        createScreen: (input) => {
          const release = harness.trackState(input.state);
          return {
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            warnOpen() {},
            dispose() {
              release();
              disposeCalls += 1;
              if (disposeCalls === 1) throw new Error('first screen disposal failed');
            },
          };
        },
      },
    });
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    stop.abort('screen cleanup retry');
    const error = await rejected;

    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'screen', state: 'failed' }],
    });
    expect(disposeCalls).to.eql(2);
  });

  it('retains and retries keyboard disposal even after its listener already failed', async () => {
    const keyboardFailure = new Error('keyboard listener failed');
    let disposeCalls = 0;
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        bindKeyboard: () => ({
          finished: Promise.reject(keyboardFailure),
          dispose() {
            disposeCalls += 1;
            if (disposeCalls === 1) throw new Error('first keyboard disposal failed');
          },
        }),
      },
    });
    const error = await rejectionOf(() => run);

    expect(error.message).to.eql('start:gui keyboard lifecycle failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'keyboard', state: 'failed' }],
    });
    expect(disposeCalls).to.eql(2);
  });

  it('retains application-listener death after ready until trusted quit', async () => {
    const harness = createHarness();
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    harness.finishApplication();
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );

    await expectPending(rejected);
    expect(count(harness.events, 'status.close')).to.eql(0);
    expect(harness.states.map((state) => state.kind)).to.eql([
      'preparing',
      'starting-app-host',
      'ready',
      'failed',
    ]);
    expect(harness.states.at(-1)).to.eql({
      kind: 'failed',
      category: 'local-failure',
      safeEvidence: { kind: 'local', operation: 'application-listener' },
    });

    await harness.quit();
    const error = await rejected;
    expect(error.message).to.eql('start:gui application listener stopped.');
    expect(harness.states.at(-1)?.kind).to.eql('stopping');
  });

  it('closes unsafe application work but retains status-listener death until trusted quit', async () => {
    const harness = createHarness();
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    harness.finishStatus();
    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-local-failure'
    );

    await expectPending(rejected);
    expect(count(harness.events, 'app.close')).to.eql(1);
    expect(harness.states.at(-1)).to.eql({
      kind: 'failed',
      category: 'local-failure',
      safeEvidence: { kind: 'local', operation: 'status-listener' },
    });

    await harness.quit();
    const error = await rejected;
    expect(error.message).to.eql('start:gui bootstrap listener stopped.');
    expect(count(harness.events, 'app.close')).to.eql(1);
  });

  it('retains the lease after rejected app close, while still closing status', async () => {
    const harness = createHarness({ appCloseFailure: new Error('raw close failure') });
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    await harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui cleanup failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [
        { resource: 'application-listener', state: 'unresolved' },
        { resource: 'generation-lease', state: 'unresolved' },
      ],
    });
    expect(count(harness.events, 'lease.release')).to.eql(0);
    expect(count(harness.events, 'status.close')).to.eql(1);

    harness.finishApplication();
    await harness.waitForEvent('lease.release');
    expect(count(harness.events, 'lease.release')).to.eql(1);
  });

  it('reports and retains a listener left pending by successful application close', async () => {
    const harness = createHarness({ appCloseLeavesListener: true });
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    await harness.quit();
    const error = await rejected;

    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [
        { resource: 'application-listener', state: 'unresolved' },
        { resource: 'generation-lease', state: 'unresolved' },
      ],
    });
    expect(count(harness.events, 'lease.release')).to.eql(0);
    expect(count(harness.events, 'status.close')).to.eql(1);

    harness.finishApplication();
    await harness.waitForEvent('lease.release');
    expect(count(harness.events, 'lease.release')).to.eql(1);
  });

  it('refuses mixed release and development authority without fallback or field merge', async () => {
    const mixed = Object.freeze({
      kind: 'development',
      dir: '/tmp/driver-pi-development-dist',
      manifestUrl: START_GUI_SERVICE.source.manifestUrl,
      integrity: START_GUI_SERVICE.source.integrity,
      expectedPkg: START_GUI_SERVICE.source.expectedPkg,
    }) as unknown as StartGuiEvidence;
    const harness = createHarness();
    const run = startInput(harness, mixed);
    const rejected = rejectionOf(() => run);

    await harness.waitFor((projection) =>
      projection.kind === 'page' && projection.key === 'failed-configuration-invalid'
    );
    expect(harness.materializeCalls).to.eql(0);
    expect(harness.applicationStarts).to.eql(0);

    await harness.quit();
    expect((await rejected).message).to.eql(
      'start:gui refused GUI Dist package identity.',
    );
  });

  it('closes status after unresolved lease release without claiming lease absence', async () => {
    const harness = createHarness({
      leaseReleaseFailure: new Error('raw lease release failure'),
    });
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    await harness.quit();
    const error = await rejected;

    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'generation-lease', state: 'unresolved' }],
    });
    expect(count(harness.events, 'lease.release')).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);
  });

  it('starts status closure while independent lease release remains pending', async () => {
    const release = deferred();
    const harness = createHarness({ leaseReleaseWait: release.promise });
    const run = startInput(harness);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    await harness.quit();
    await harness.waitForEvent('status.close');

    await expectPending(run);
    expect(count(harness.events, 'lease.release')).to.eql(1);
    expect(count(harness.events, 'status.close')).to.eql(1);

    release.resolve();
    await run;
  });

  it('reports a status listener left pending by successful status close', async () => {
    const harness = createHarness({ statusCloseLeavesListener: true });
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    await harness.quit();
    const error = await rejected;

    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'status-listener', state: 'unresolved' }],
    });
    expect(count(harness.events, 'status.close')).to.eql(1);
    harness.finishStatus();
  });

  it('retains a pending status listener after rejected status close', async () => {
    const harness = createHarness({
      statusCloseFailure: new Error('raw status close failure'),
      statusCloseLeavesListener: true,
    });
    const run = startInput(harness);
    const rejected = rejectionOf(() => run);
    await harness.waitFor((projection) => projection.kind === 'redirect');

    await harness.quit();
    const error = await rejected;

    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'status-listener', state: 'unresolved' }],
    });
    expect(count(harness.events, 'status.close')).to.eql(1);
    harness.finishStatus();
  });

  it('hosts development evidence directly and admits verified package identity before ready', async () => {
    const source: StartGuiEvidence = Object.freeze({
      kind: 'development',
      dir: '/tmp/driver-pi-development-dist' as t.StringAbsoluteDir,
      integrity: START_GUI_SERVICE.source.integrity,
      expectedPkg: START_GUI_SERVICE.source.expectedPkg,
    });
    const harness = createHarness();
    const run = startInput(harness, source);

    expect(await harness.waitFor((projection) => projection.kind === 'redirect')).to.eql({
      kind: 'redirect',
      origin: APP_ORIGIN,
    });
    expect(harness.materializeCalls).to.eql(0);
    expect(count(harness.events, 'lease.acquire')).to.eql(0);
    expect(harness.applicationStarts).to.eql(1);
    expect(harness.screenRoot).to.eql(source.dir);

    await harness.quit();
    await run;
  });

  it('closes a development host whose verified package identity is refused without ready', async () => {
    const source: StartGuiEvidence = Object.freeze({
      kind: 'development',
      dir: '/tmp/driver-pi-development-dist' as t.StringAbsoluteDir,
      integrity: START_GUI_SERVICE.source.integrity,
      expectedPkg: START_GUI_SERVICE.source.expectedPkg,
    });
    const harness = createHarness({
      appPkg: Object.freeze({ name: '@other/package', version: '1.0.0' }),
    });
    const run = startInput(harness, source);
    const rejected = rejectionOf(() => run);

    expect(
      await harness.waitFor((projection) =>
        projection.kind === 'page' && projection.key === 'failed-artifact-refused'
      ),
    ).to.eql({ kind: 'page', key: 'failed-artifact-refused' });
    expect(harness.states.some((state) => state.kind === 'ready')).to.eql(false);
    expect(harness.applicationStarts).to.eql(1);
    expect(count(harness.events, 'app.close')).to.eql(1);

    await harness.quit();
    const error = await rejected;
    expect(error.message).to.eql('start:gui refused GUI Dist package identity.');
    expect(count(harness.events, 'app.close')).to.eql(1);
  });
});

type HarnessOptions = Readonly<{
  openFailure?: Error;
  appCloseFailure?: Error;
  appCloseLeavesListener?: boolean;
  leaseReleaseFailure?: Error;
  leaseReleaseWait?: Promise<void>;
  statusCloseFailure?: Error;
  statusCloseLeavesListener?: boolean;
  materialization?: t.Dist.MaterializeResult;
  appPkg?: Readonly<t.Pkg>;
}>;

function createHarness(options: HarnessOptions = {}) {
  const events: string[] = [];
  const eventWaiters = new Map<
    string,
    Set<{ readonly occurrence: number; readonly resolve: () => void }>
  >();
  const emit = (event: string) => {
    events.push(event);
    const waiters = eventWaiters.get(event);
    if (!waiters) return;
    for (const waiter of [...waiters]) {
      if (count(events, event) < waiter.occurrence) continue;
      waiters.delete(waiter);
      waiter.resolve();
    }
    if (waiters.size === 0) eventWaiters.delete(event);
  };
  const waitForEvent = (event: string, occurrence = 1): Promise<void> => {
    if (count(events, event) >= occurrence) return Promise.resolve();
    const pending = Promise.withResolvers<void>();
    const waiters = eventWaiters.get(event) ?? new Set();
    waiters.add({ occurrence, resolve: pending.resolve });
    eventWaiters.set(event, waiters);
    return pending.promise;
  };
  const states: BootState[] = [];
  const opened: t.StringUrl[] = [];
  const statusDone = deferred();
  const keyboardDone = deferred();
  const applicationDone = deferred();
  const screenFailure = Promise.withResolvers<never>();
  let resolver: BootstrapStatus.Resolver<string> | undefined;
  const projectionWaiters = new Set<{
    readonly predicate: (projection: BootstrapStatus.Projection<string>) => boolean;
    readonly resolve: (projection: BootstrapStatus.Projection<string>) => void;
    readonly reject: (cause: unknown) => void;
  }>();
  const settleProjectionWaiters = () => {
    let projection: BootstrapStatus.Projection<string> | undefined;
    try {
      projection = resolver?.();
    } catch (cause) {
      for (const waiter of projectionWaiters) waiter.reject(cause);
      projectionWaiters.clear();
      return;
    }
    if (!projection) return;
    for (const waiter of [...projectionWaiters]) {
      try {
        if (!waiter.predicate(projection)) continue;
        projectionWaiters.delete(waiter);
        waiter.resolve(projection);
      } catch (cause) {
        projectionWaiters.delete(waiter);
        waiter.reject(cause);
      }
    }
  };
  const trackState = (source: BootStateSource): () => void => {
    states.push(source.current);
    const release = source.subscribe((state) => {
      states.push(state);
      settleProjectionWaiters();
    });
    settleProjectionWaiters();
    return release;
  };
  let statusPages: string[] = [];
  let onQuit: (() => void | Promise<void>) | undefined;
  let statusDisposed = false;
  let statusClose: Promise<void> | undefined;
  let leaseRelease: Promise<void> | undefined;
  let releaseState: (() => void) | undefined;
  let materializeCalls = 0;
  let applicationStarts = 0;
  let openWarnings = 0;
  let screenRoot: t.StringAbsoluteDir | undefined;
  let leaseMode: FsRooted.LeaseMode | undefined;

  const target = Object.freeze({
    kind: 'directory' as const,
    path: '@sys.driver-pi' as t.StringRelativePath,
  }) as FsRooted.Target<'directory'>;
  const lease = Object.freeze({
    mode: 'shared' as const,
    targets: Object.freeze([target]),
    release() {
      leaseRelease ??= Promise.resolve().then(async () => {
        emit('lease.release');
        await options.leaseReleaseWait;
        if (options.leaseReleaseFailure) throw options.leaseReleaseFailure;
      });
      return leaseRelease;
    },
    [Symbol.asyncDispose]() {
      return this.release();
    },
  }) as FsRooted.Lease;

  const startStatus = <K extends string>(
    input: BootstrapStatus.StartOptions<K>,
  ): Promise<BootstrapStatus.Started> => {
    emit('status.start');
    statusPages = input.pages.map((item) => item.key);
    resolver = input.resolve as BootstrapStatus.Resolver<string>;
    settleProjectionWaiters();
    const closeStatus = (): Promise<void> => {
      statusClose ??= Promise.resolve().then(() => {
        emit('status.close');
        statusDisposed = true;
        if (!options.statusCloseLeavesListener) statusDone.resolve();
        if (options.statusCloseFailure) throw options.statusCloseFailure;
      });
      return statusClose;
    };
    return Promise.resolve(Object.freeze({
      url: STATUS_URL,
      finished: statusDone.promise,
      get disposed() {
        return statusDisposed;
      },
      close: closeStatus,
      [Symbol.asyncDispose]: () => closeStatus(),
    }));
  };

  const deps: StartGuiDependencies = {
    ensureDir: () => {
      emit('store.ensure');
      return Promise.resolve();
    },
    createRooted: () => {
      emit('rooted.create');
      return Promise.resolve(Object.freeze({
        path: OWNER_ROOT,
        admit: () => {
          emit('rooted.admit');
          return Promise.resolve(Object.freeze({ targets: Object.freeze([target]) }));
        },
        acquireLease: (
          _targets: readonly FsRooted.Target<'directory'>[],
          input: FsRooted.LeaseOptions,
        ) => {
          emit('lease.acquire');
          leaseMode = input.mode;
          return Promise.resolve(Object.freeze({ kind: 'acquired', lease }));
        },
      } as unknown as FsRooted.Instance));
    },
    materialize: () => {
      emit('materialize');
      materializeCalls += 1;
      return Promise.resolve(options.materialization ?? fakeGeneration());
    },
    startStatus,
    start: () => {
      emit('app.start');
      applicationStarts += 1;
      const generation = fakeGeneration(options.appPkg);
      return Promise.resolve({
        addr: { transport: 'tcp', hostname: '127.0.0.1', port: 45001 },
        hostname: '127.0.0.1',
        port: 45001,
        origin: APP_ORIGIN,
        finished: applicationDone.promise,
        close() {
          emit('app.close');
          if (options.appCloseFailure) return Promise.reject(options.appCloseFailure);
          if (!options.appCloseLeavesListener) applicationDone.resolve();
          return Promise.resolve();
        },
        authority: Object.freeze({
          kind: 'pinned',
          integrity: START_GUI_SERVICE.source.integrity,
        }),
        verification: generation.verification,
        browserPolicy: appliedBrowserPolicyFixture(APP_ORIGIN),
      } as Started);
    },
    open: (_cwd, url) => {
      emit('open');
      opened.push(url);
      if (options.openFailure) throw options.openFailure;
    },
    bindKeyboard: (input) => {
      emit('keyboard.bind');
      onQuit = input.onQuit;
      return {
        finished: keyboardDone.promise,
        dispose() {
          emit('keyboard.dispose');
          keyboardDone.resolve();
        },
      };
    },
    createScreen: (input) => {
      emit('screen.create');
      screenRoot = input.root;
      releaseState = trackState(input.state);
      return {
        kind: 'acquired',
        failure: screenFailure.promise,
        warnOpen() {
          openWarnings += 1;
        },
        dispose() {
          emit('screen.dispose');
          releaseState?.();
          releaseState = undefined;
        },
      };
    },
  };

  return {
    deps,
    events,
    states,
    opened,
    get pages() {
      return statusPages;
    },
    get materializeCalls() {
      return materializeCalls;
    },
    get applicationStarts() {
      return applicationStarts;
    },
    get openWarnings() {
      return openWarnings;
    },
    get screenRoot() {
      return screenRoot;
    },
    get leaseMode() {
      return leaseMode;
    },
    waitFor(
      predicate: (projection: BootstrapStatus.Projection<string>) => boolean,
    ): Promise<BootstrapStatus.Projection<string>> {
      const pending = Promise.withResolvers<BootstrapStatus.Projection<string>>();
      try {
        const projection = resolver?.();
        if (projection && predicate(projection)) {
          pending.resolve(projection);
        } else {
          projectionWaiters.add({
            predicate,
            resolve: pending.resolve,
            reject: pending.reject,
          });
        }
      } catch (cause) {
        pending.reject(cause);
      }
      return pending.promise;
    },
    waitForEvent,
    trackState,
    async quit() {
      if (!onQuit) throw new Error('Expected bound quit callback.');
      await onQuit();
      keyboardDone.resolve();
    },
    finishApplication() {
      applicationDone.resolve();
    },
    finishKeyboard() {
      keyboardDone.resolve();
    },
    finishStatus() {
      statusDone.resolve();
    },
    failScreen(cause: unknown) {
      screenFailure.reject(cause);
    },
  } as const;
}

function startInput(
  harness: ReturnType<typeof createHarness>,
  source?: StartGuiEvidence,
): Promise<void> {
  const input: StartGuiInput = {
    cwd: asProfileRoot(ROOT),
    deps: harness.deps,
    ...(source === undefined ? {} : { source }),
  };
  return start(input);
}

async function expectPending(promise: Promise<unknown>): Promise<void> {
  const barrier = Promise.withResolvers<'pending'>();
  queueMicrotask(() => barrier.resolve('pending'));
  const outcome = await Promise.race([
    promise.then(() => 'settled' as const, () => 'settled' as const),
    barrier.promise,
  ]);
  expect(outcome).to.eql('pending');
}

function count(values: readonly string[], value: string): number {
  return values.filter((item) => item === value).length;
}

function hostileNativeError() {
  let calls = 0;
  const error = new Error('untrusted native error');
  for (const key of ['message', 'name', 'stack', 'cause', 'extra']) {
    Object.defineProperty(error, key, {
      configurable: true,
      enumerable: true,
      get() {
        calls += 1;
        throw new Error(`hostile ${key} accessor`);
      },
    });
  }
  return {
    error,
    get calls() {
      return calls;
    },
  } as const;
}
