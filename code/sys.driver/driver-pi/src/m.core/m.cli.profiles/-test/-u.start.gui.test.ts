import { describe, expect, it } from '../../../-test.ts';
import { Fs, Is, type t } from '../common.ts';
import { DistServer } from '../u.start/common.ts';
import { VERIFIED_LOOPBACK_BROWSER_POLICY } from '../u.start/u.browser.ts';
import { start, type StartGuiDependencies } from '../u.start/u.gui/mod.ts';
import type { BootState } from '../u.start/u.state.ts';
import { isCliSettledFailure, startGuiCompletionKind } from '../u/u.start.gui.settlement.ts';
import { START_GUI_SERVICE, type StartGuiEvidence } from '../u/u.start.gui.service.ts';
import {
  asProfileRoot,
  bootstrapStatusFixture,
  deferred,
  failedGenerationFixture,
  fakeGeneration,
  openedGenerationFixture,
  rejectionOf,
  startedFixture,
} from './u.fixture.start.gui.ts';

const ROOT = '/tmp/driver-pi-start-gui-test' as t.StringDir;
const STATUS_URL = 'http://127.0.0.1:45000/0123456789abcdefghijklmnopqrstuvwxyzabcd' as t.StringUrl;
const APP_ORIGIN = 'http://127.0.0.1:1234' as t.StringUrl;

describe('@sys/driver-pi start:gui package composition', () => {
  it('applies release policy, presents readiness, and closes app, Generation, then status', async () => {
    const harness = createHarness();
    const run = start({ cwd: asProfileRoot(ROOT), deps: harness.deps });

    await harness.ready.promise;
    expect(harness.opened).to.eql([STATUS_URL]);
    expect(harness.states.map((state) => state.kind)).to.eql([
      'preparing',
      'starting-app-host',
      'ready',
    ]);
    expect(harness.states.at(-1)).to.eql({
      kind: 'ready',
      origin: APP_ORIGIN,
      digest: harness.digest,
      directoryHref: Fs.Path.toFileUrl(
        Fs.join(
          ROOT,
          '.pi/@sys/dist/@sys.driver-pi',
          START_GUI_SERVICE.source.integrity,
        ),
      ).href,
    });
    expect(harness.generationArgs?.store).to.eql({
      root: Fs.join(ROOT, '.pi/@sys/dist'),
      target: '@sys.driver-pi',
    });
    expect(harness.generationArgs?.manifestUrl).to.eql(START_GUI_SERVICE.source.manifestUrl);
    expect(harness.generationArgs?.integrity).to.eql(START_GUI_SERVICE.source.integrity);
    expect(harness.generationArgs?.policy.manifest.sourceOrigins).to.eql([
      'http://localhost:8080',
    ]);
    expect(harness.startArgs).to.include({
      dir: Fs.join(
        ROOT,
        '.pi/@sys/dist/@sys.driver-pi',
        START_GUI_SERVICE.source.integrity,
      ),
      integrity: START_GUI_SERVICE.source.integrity,
      hostname: '127.0.0.1',
      port: 0,
      silent: true,
    });
    expect(harness.startArgs?.browserPolicy).to.equal(VERIFIED_LOOPBACK_BROWSER_POLICY);
    expect(harness.startArgs?.until).to.equal(harness.generationArgs?.until);
    expect(harness.screen?.manifestUrl).to.eql(START_GUI_SERVICE.source.manifestUrl);
    expect(harness.screen?.recovery).to.equal(START_GUI_SERVICE.recovery);

    harness.quit();
    const completion = await run;

    expect(startGuiCompletionKind(completion)).to.eql('quit');
    expect(harness.states.map((state) => state.kind)).to.eql([
      'preparing',
      'starting-app-host',
      'ready',
      'stopping',
    ]);
    expect(harness.events).to.eql([
      'screen.dispose',
      'keyboard.dispose',
      'application.close',
      'generation.release',
      'status.close',
    ]);
    expect((harness.startArgs?.until as AbortSignal).reason).to.eql(
      'start:gui.trusted-control',
    );
  });

  it('defers Generation release until an application with failed close settles', async () => {
    const harness = createHarness();
    const applicationFinished = deferred();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: (input) => {
          harness.recordStart(input);
          return Promise.resolve(startedFixture({
            finished: applicationFinished.promise,
            close: () => {
              harness.recordEvent('application.close');
              return Promise.reject(new Error('application close failed'));
            },
          }));
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.ready.promise;
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui cleanup failed.');
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [
        { resource: 'application-listener', state: 'failed' },
        { resource: 'release', state: 'unresolved' },
      ],
    });
    expect(harness.events).to.eql([
      'screen.dispose',
      'keyboard.dispose',
      'application.close',
      'status.close',
    ]);

    applicationFinished.resolve();
    await Promise.resolve();
    expect(harness.events).to.eql([
      'screen.dispose',
      'keyboard.dispose',
      'application.close',
      'status.close',
      'generation.release',
    ]);
  });

  it('hosts development evidence directly without opening a release Generation', async () => {
    const integrity = `sha256-${'b'.repeat(64)}` as t.StringHash;
    const source: StartGuiEvidence = Object.freeze({
      kind: 'development',
      dir: '/tmp/driver-pi-development-dist' as t.StringAbsoluteDir,
      integrity,
      expectedPkg: START_GUI_SERVICE.source.expectedPkg,
    });
    const harness = createHarness();
    let generationCalls = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      source,
      deps: {
        ...harness.deps,
        openGeneration: (input) => {
          generationCalls += 1;
          return Promise.resolve(openedGenerationFixture(input));
        },
        start: (input) => {
          harness.recordStart(input);
          return Promise.resolve(startedFixture({ integrity }));
        },
      },
    });

    await harness.ready.promise;
    harness.quit();
    await run;

    expect(generationCalls).to.eql(0);
    expect(harness.startArgs).to.include({ dir: source.dir, integrity });
    expect(harness.screen?.root).to.eql(source.dir);
    expect(harness.screen?.manifestUrl).to.eql(undefined);
    expect(harness.events).not.to.include('generation.release');
  });

  it('refuses a mismatched Generation package before application startup', async () => {
    const harness = createHarness();
    let applicationStarts = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        openGeneration: (input) =>
          Promise.resolve(openedGenerationFixture(
            input,
            fakeGeneration(Object.freeze({
              name: '@other/driver-pi',
              version: START_GUI_SERVICE.source.expectedPkg.version,
            })),
            harness.releaseGeneration,
          )),
        start: (input) => {
          applicationStarts += 1;
          return harness.deps.start(input);
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.failed.promise;
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui refused GUI Dist package identity.');
    expect((error as Error & { identity?: unknown }).identity).to.eql({
      kind: 'refused',
      manifestUrl: START_GUI_SERVICE.source.manifestUrl,
      integrity: START_GUI_SERVICE.source.integrity,
    });
    expect(applicationStarts).to.eql(0);
    expect(harness.events).to.include('generation.release');
  });

  it('refuses a mismatched package from the freshly verified application', async () => {
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: (input) => {
          harness.recordStart(input);
          return Promise.resolve(startedFixture({
            pkg: Object.freeze({
              name: '@other/driver-pi',
              version: START_GUI_SERVICE.source.expectedPkg.version,
            }),
            close: () => {
              harness.recordEvent('application.close');
              return Promise.resolve();
            },
          }));
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.failed.promise;
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui refused GUI Dist package identity.');
    expect((error as Error & { identity?: unknown }).identity).to.eql({
      kind: 'refused',
      manifestUrl: START_GUI_SERVICE.source.manifestUrl,
      integrity: START_GUI_SERVICE.source.integrity,
    });
    expect(harness.events).to.include('application.close');
    expect(harness.events).to.include('generation.release');
    expect(harness.events.indexOf('application.close')).to.be.lessThan(
      harness.events.indexOf('generation.release'),
    );
  });

  it('does not start the application after starting-state presentation fails', async () => {
    const harness = createHarness();
    let applicationStarts = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        createScreen: (input) => {
          harness.recordScreen(input);
          const release = input.state.subscribe((state) => {
            if (state.kind === 'starting-app-host') {
              input.onFailure(new Error('starting-state presentation failed'));
            }
          });
          return {
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            redraw() {},
            warnOpen() {},
            dispose() {
              release();
              harness.recordEvent('screen.dispose');
            },
          };
        },
        start: (input) => {
          applicationStarts += 1;
          return harness.deps.start(input);
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.failed.promise;
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui screen failed.');
    expect(applicationStarts).to.eql(0);
    expect(harness.states.some((state) => state.kind === 'ready')).to.eql(false);
    expect(harness.events).to.include('generation.release');
  });

  it('does not publish ready from an application whose listener is already settled', async () => {
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: (input) => {
          harness.recordStart(input);
          return Promise.resolve(startedFixture({
            finished: Promise.resolve(),
            close: () => {
              harness.recordEvent('application.close');
              return Promise.resolve();
            },
          }));
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.failed.promise;
    expect(harness.states.some((state) => state.kind === 'ready')).to.eql(false);
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui application listener stopped.');
    expect(harness.events).to.include('application.close');
    expect(harness.events).to.include('generation.release');
  });

  it('keeps an earlier queued status failure ahead of a later same-turn quit', async () => {
    const harness = createHarness();
    const run = start({ cwd: asProfileRoot(ROOT), deps: harness.deps });
    const rejected = rejectionOf(() => run);

    await harness.ready.promise;
    harness.finishStatus();
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui bootstrap listener stopped.');
    expect(isCliSettledFailure(error)).to.eql(true);
  });

  it('keeps an earlier queued application failure ahead of a later same-turn quit', async () => {
    const harness = createHarness();
    const run = start({ cwd: asProfileRoot(ROOT), deps: harness.deps });
    const rejected = rejectionOf(() => run);

    await harness.ready.promise;
    harness.finishApplication();
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui application listener stopped.');
    expect(isCliSettledFailure(error)).to.eql(true);
  });

  it('keeps an earlier quit ahead of later same-turn owner settlements', async () => {
    const harness = createHarness();
    const run = start({ cwd: asProfileRoot(ROOT), deps: harness.deps });

    await harness.ready.promise;
    harness.quit();
    harness.finishStatus();
    harness.finishApplication();
    const completion = await run;

    expect(startGuiCompletionKind(completion)).to.eql('quit');
    expect(harness.states.some((state) => state.kind === 'failed')).to.eql(false);
  });

  it('keeps an earlier Generation rejection ahead of a later same-turn quit', async () => {
    const harness = createHarness();
    const opening = Promise.withResolvers<t.Dist.Generation.Open.Result>();
    const entered = deferred();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        openGeneration: () => {
          entered.resolve();
          return opening.promise;
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await entered.promise;
    opening.reject(new Error('Generation opening failed before quit'));
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui release-owner failed.');
    expect(isCliSettledFailure(error)).to.eql(true);
    expect(harness.events).not.to.include('generation.release');
  });

  it('keeps an earlier host-start rejection ahead of a later same-turn quit', async () => {
    const harness = createHarness();
    const starting = Promise.withResolvers<t.DistServer.Started>();
    const entered = deferred();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        start: (input) => {
          harness.recordStart(input);
          entered.resolve();
          return starting.promise;
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await entered.promise;
    starting.reject(new Error('application host failed before quit'));
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui application-host failed.');
    expect(isCliSettledFailure(error)).to.eql(true);
    expect(harness.events.filter((event) => event === 'generation.release').length).to.eql(1);
  });

  it('keeps an earlier Generation package refusal ahead of a later same-turn quit', async () => {
    const harness = createHarness();
    const opening = Promise.withResolvers<t.Dist.Generation.Open.Result>();
    const entered = deferred();
    let result: t.Dist.Generation.Open.Success | undefined;
    let applicationStarts = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        openGeneration: (input) => {
          result = openedGenerationFixture(
            input,
            fakeGeneration(Object.freeze({
              name: '@other/driver-pi',
              version: START_GUI_SERVICE.source.expectedPkg.version,
            })),
            harness.releaseGeneration,
          );
          entered.resolve();
          return opening.promise;
        },
        start: (input) => {
          applicationStarts += 1;
          return harness.deps.start(input);
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await entered.promise;
    if (!result) throw new Error('Expected Generation-open result.');
    opening.resolve(result);
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui refused GUI Dist package identity.');
    expect(isCliSettledFailure(error)).to.eql(true);
    expect(applicationStarts).to.eql(0);
    expect(harness.events.filter((event) => event === 'generation.release').length).to.eql(1);
  });

  it('presents package-owned materialization failure without starting the host', async () => {
    const harness = createHarness();
    let applicationStarts = 0;
    const generation = Object.freeze({
      kind: 'failed',
      stage: 'manifest-fetch',
      reason: 'resource-failure',
      cleanup: 'pending',
    }) as t.Dist.Failed;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        openGeneration: () => Promise.resolve(failedGenerationFixture(generation, 'pending')),
        start: (input) => {
          applicationStarts += 1;
          return harness.deps.start(input);
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.failed.promise;
    expect(harness.states.at(-1)).to.include({ kind: 'failed', category: 'source-unavailable' });
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql(
      'start:gui materialization failed: manifest-fetch/resource-failure',
    );
    expect((error as Error & { materialization?: unknown }).materialization).to.eql({
      stage: 'manifest-fetch',
      reason: 'resource-failure',
      cleanup: 'pending',
    });
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql(undefined);
    expect(applicationStarts).to.eql(0);
    expect(harness.events).not.to.include('generation.release');
  });

  it('passes one cancellation signal through lower package boundaries', async () => {
    const harness = createHarness();
    const stop = new AbortController();
    const run = start({
      cwd: asProfileRoot(ROOT),
      until: stop.signal,
      deps: harness.deps,
    });

    await harness.ready.promise;
    stop.abort(new Error('caller-owned cancellation reason'));
    const completion = await run;

    expect(startGuiCompletionKind(completion)).to.eql('external-cancellation');
    expect(harness.generationArgs?.until).to.equal(harness.startArgs?.until);
    expect((harness.generationArgs?.until as AbortSignal).aborted).to.eql(true);
    expect((harness.generationArgs?.until as AbortSignal).reason).to.eql(
      'start:gui.external-cancellation',
    );
    expect(harness.events).to.eql([
      'screen.dispose',
      'keyboard.dispose',
      'application.close',
      'generation.release',
      'status.close',
    ]);
  });

  it('releases a Generation that commits after trusted cancellation while opening is pending', async () => {
    const harness = createHarness();
    const opening = Promise.withResolvers<t.Dist.Generation.Open.Result>();
    const called = deferred();
    let openingArgs: t.Dist.Generation.Open.Args | undefined;
    let signal: AbortSignal | undefined;
    let applicationStarts = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        openGeneration: (input) => {
          if (!Is.abortSignal(input.until)) {
            throw new Error('Expected one AbortSignal for Generation opening.');
          }
          openingArgs = input;
          signal = input.until;
          called.resolve();
          return opening.promise;
        },
        start: (input) => {
          applicationStarts += 1;
          return harness.deps.start(input);
        },
      },
    });

    await called.promise;
    harness.quit();
    expect(signal?.aborted).to.eql(true);
    expect(await pending(run)).to.eql(true);
    if (!openingArgs) throw new Error('Expected Generation opening arguments.');
    opening.resolve(
      openedGenerationFixture(openingArgs, fakeGeneration(), harness.releaseGeneration),
    );
    const completion = await run;

    expect(startGuiCompletionKind(completion)).to.eql('quit');
    expect(applicationStarts).to.eql(0);
    expect(harness.events).to.include('generation.release');
  });

  it('settles a presented frozen host failure even when cleanup adds final evidence', async () => {
    const harness = createHarness();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        startStatus: () =>
          Promise.resolve(bootstrapStatusFixture({
            close: () => Promise.reject(new Error('status cleanup failed')),
          })),
        start: (input) => DistServer.start({ ...input, hostname: 'example.com' }),
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.failed.promise;
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('DistServer.start: hostname must be loopback.');
    expect(isCliSettledFailure(error)).to.eql(true);
    expect((error as Error & { cleanup?: unknown }).cleanup).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'status-listener', state: 'failed' }],
    });
  });

  it('warns when the browser cannot open while boot and cleanup still succeed', async () => {
    const harness = createHarness();
    let warnings = 0;
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        open: () => {
          throw new Error('browser unavailable');
        },
        createScreen: (input) => {
          harness.recordScreen(input);
          return {
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            redraw() {},
            warnOpen() {
              warnings += 1;
            },
            dispose() {
              harness.recordEvent('screen.dispose');
            },
          };
        },
      },
    });
    await harness.ready.promise;
    harness.quit();
    const completion = await run;

    expect(warnings).to.eql(1);
    expect(startGuiCompletionKind(completion)).to.eql('quit');
    expect(harness.events).to.include('application.close');
    expect(harness.events).to.include('generation.release');
  });

  it('warns for an opaque browser opener result without assimilating thenables', async () => {
    const harness = createHarness();
    let thenReads = 0;
    let warnings = 0;
    const opaque = Object.defineProperty({}, 'then', {
      get() {
        thenReads += 1;
        throw new Error('opaque then accessor must not be read');
      },
    });
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        open: () => opaque,
        createScreen: (input) => {
          harness.recordScreen(input);
          return {
            kind: 'acquired',
            failure: new Promise<never>(() => undefined),
            redraw() {},
            warnOpen() {
              warnings += 1;
            },
            dispose() {
              harness.recordEvent('screen.dispose');
            },
          };
        },
      },
    });

    await harness.ready.promise;
    harness.quit();
    const completion = await run;

    expect(thenReads).to.eql(0);
    expect(warnings).to.eql(1);
    expect(startGuiCompletionKind(completion)).to.eql('quit');
  });

  it('keeps a presented runtime failure visible until trusted keyboard dismissal', async () => {
    const harness = createHarness();
    const screenFailure = Promise.withResolvers<never>();
    const run = start({
      cwd: asProfileRoot(ROOT),
      deps: {
        ...harness.deps,
        createScreen: (input) => {
          harness.recordScreen(input);
          return {
            kind: 'acquired',
            failure: screenFailure.promise,
            redraw() {},
            warnOpen() {},
            dispose() {
              harness.recordEvent('screen.dispose');
            },
          };
        },
      },
    });
    const rejected = rejectionOf(() => run);

    await harness.ready.promise;
    screenFailure.reject(new Error('untrusted screen failure'));
    await harness.failed.promise;
    expect(await pending(rejected)).to.eql(true);
    harness.quit();
    const error = await rejected;

    expect(error.message).to.eql('start:gui screen failed.');
    expect(harness.events).to.include('application.close');
    expect(harness.events).to.include('generation.release');
  });
});

function createHarness() {
  const states: BootState[] = [];
  const events: string[] = [];
  const opened: t.StringUrl[] = [];
  const ready = deferred();
  const failed = deferred();
  const keyboardFinished = deferred();
  const statusFinished = deferred();
  const applicationFinished = deferred();
  let quit: (() => void | Promise<void>) | undefined;
  let generationArgs: t.Dist.Generation.Open.Args | undefined;
  let startArgs: t.DistServer.Start.Args | undefined;
  let screen: Parameters<StartGuiDependencies['createScreen']>[0] | undefined;
  const digest = fakeGeneration().verification.dist.hash.digest;

  const recordEvent = (event: string): void => {
    events.push(event);
  };
  const releaseGeneration = (): Promise<void> => {
    recordEvent('generation.release');
    return Promise.resolve();
  };
  const recordStart = (input: t.DistServer.Start.Args) => {
    startArgs = input;
  };
  const recordScreen = (input: Parameters<StartGuiDependencies['createScreen']>[0]) => {
    screen = input;
    const record = (state: BootState) => {
      states.push(state);
      if (state.kind === 'ready') ready.resolve();
      if (state.kind === 'failed') failed.resolve();
    };
    record(input.state.current);
    input.state.subscribe(record);
  };

  const deps: StartGuiDependencies = {
    startStatus: () =>
      Promise.resolve(bootstrapStatusFixture({
        url: STATUS_URL,
        finished: statusFinished.promise,
        close: () => {
          recordEvent('status.close');
          statusFinished.resolve();
        },
      })),
    bindKeyboard(input) {
      quit = input.onQuit;
      return {
        finished: keyboardFinished.promise,
        dispose() {
          recordEvent('keyboard.dispose');
          keyboardFinished.resolve();
        },
      };
    },
    createScreen(input) {
      recordScreen(input);
      return {
        kind: 'acquired',
        failure: new Promise<never>(() => undefined),
        redraw() {},
        warnOpen() {},
        dispose() {
          recordEvent('screen.dispose');
        },
      };
    },
    openGeneration(input) {
      generationArgs = input;
      return Promise.resolve(openedGenerationFixture(input, fakeGeneration(), releaseGeneration));
    },
    start(input) {
      recordStart(input);
      return Promise.resolve(startedFixture({
        finished: applicationFinished.promise,
        close: () => {
          recordEvent('application.close');
          applicationFinished.resolve();
          return Promise.resolve();
        },
      }));
    },
    open(_cwd, url) {
      opened.push(url);
    },
  };

  return {
    deps,
    states,
    events,
    opened,
    ready,
    failed,
    finishStatus() {
      statusFinished.resolve();
    },
    finishApplication() {
      applicationFinished.resolve();
    },
    digest,
    releaseGeneration,
    recordEvent,
    recordStart,
    recordScreen,
    get generationArgs() {
      return generationArgs;
    },
    get startArgs() {
      return startArgs;
    },
    get screen() {
      return screen;
    },
    quit() {
      if (!quit) throw new Error('Expected keyboard quit callback.');
      void quit();
    },
  };
}

async function pending(input: Promise<unknown>): Promise<boolean> {
  const marker = Symbol('pending');
  return (await Promise.race([input, Promise.resolve(marker)])) === marker;
}
