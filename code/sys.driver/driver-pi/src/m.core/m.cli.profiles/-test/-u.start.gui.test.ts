import { describe, expect, Is, it, type t } from '../../../-test.ts';
import { Cli } from '../common.ts';
import { startDevelopmentWith, startWith } from '../u.start/u.gui/mod.ts';
import type { Start } from '../u.start/u.gui/t.ts';
import { StartGuiPresentation } from '../u.start/u.gui/u.presentation.ts';
import { generationOpenArgs, START_GUI_SERVICE } from '../u/u.start.gui.service.ts';
import {
  asProfileRoot,
  bootstrapStatusFixture,
  deferred,
  failedGenerationFixture,
  fakeGeneration,
  GENERATION_DIR,
  openedGenerationFixture,
  rejectionOf,
  startedFixture,
} from './u.fixture.start.gui.ts';

const ROOT: t.StringDir = '/tmp/driver-pi-gui-session';
const CWD = asProfileRoot(ROOT);
const DEVELOPMENT: Start.Gui.Development.Evidence = Object.freeze({
  kind: 'development',
  dir: GENERATION_DIR,
  integrity: START_GUI_SERVICE.source.integrity,
  expectedPkg: START_GUI_SERVICE.source.expectedPkg,
});

type Controls = Readonly<{
  back(): void;
  quit(): void;
  dismiss(): void;
}>;

type KeyPress = Parameters<NonNullable<t.Cli.Keyboard.Bind.Options['onKey']>>[0];

const REDRAW: KeyPress = Object.assign(new Event('keydown'), {
  key: 'r',
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  shiftKey: false,
  repeat: false,
});

type HarnessOptions = Readonly<{
  status?: t.BootstrapStatus.Started;
  startStatus?: Start.Gui.Dependencies['startStatus'];
  openGeneration?: Start.Gui.Dependencies['openGeneration'];
  startApplication?: Start.Gui.Dependencies['startApplication'];
  isHostError?: Start.Gui.Dependencies['isHostError'];
  application?: Start.Gui.Application.Owner;
  presentation?: Start.Gui.Dependencies['presentation'];
  presentationClose?: () => Promise<void>;
  statusFinished?: Promise<void>;
  statusClose?: (reason?: unknown) => void | Promise<void>;
  statusCloseFailure?: unknown;
  generationRelease?: () => Promise<void>;
  autoReady?: 'back' | 'quit' | false;
  autoFailure?: boolean;
  openBrowser?: Start.Gui.Dependencies['openBrowser'];
}>;

type Harness = Readonly<{
  deps: Start.Gui.Dependencies;
  controls: Controls;
  events: string[];
  failures: Start.Gui.Failure[];
  generationArgs: t.Dist.Generation.Open.Args[];
  applicationArgs: t.DistServer.Start.Args[];
  ready: PromiseWithResolvers<void>;
  failed: PromiseWithResolvers<void>;
  applicationStarted: PromiseWithResolvers<void>;
  applicationClosed: PromiseWithResolvers<void>;
  generationReleased: PromiseWithResolvers<void>;
  statusClosed: PromiseWithResolvers<void>;
}>;

type ProductionPresentationOptions = Readonly<{
  screenReleaseFailure?: Error;
}>;

describe('@sys/driver-pi start:gui direct composition', () => {
  it('returns one terminal Generation release operation through both owner methods', async () => {
    let releases = 0;
    const opened = openedGenerationFixture(
      { store: { root: ROOT, target: START_GUI_SERVICE.store.target } },
      fakeGeneration(),
      () => {
        releases += 1;
        return Promise.resolve();
      },
    );

    const release = opened.owner.release();
    const disposal = opened.owner[Symbol.asyncDispose]();

    expect(disposal).to.equal(release);
    expect(releases).to.eql(1);
    await release;
    expect(opened.owner.release()).to.equal(release);
    expect(releases).to.eql(1);
  });

  it('runs canonical release policy and settles package owners in dependency order', async () => {
    const harness = createHarness();
    const result = await startWith({ cwd: CWD }, harness.deps);

    expect(result).to.eql('quit');
    expect(harness.generationArgs).to.have.length(1);
    const until = harness.generationArgs[0].until;
    if (!Is.abortSignal(until)) throw new Error('Expected Generation cancellation authority.');
    const expected = generationOpenArgs(
      ROOT,
      Object.freeze({
        kind: 'release',
        source: Object.freeze({
          href: START_GUI_SERVICE.source.manifestUrl,
          origin: new URL(START_GUI_SERVICE.source.manifestUrl).origin,
        }),
        integrity: START_GUI_SERVICE.source.integrity,
        expectedPkg: START_GUI_SERVICE.source.expectedPkg,
      }),
      until,
    );
    expect(harness.generationArgs[0]).to.eql(expected);
    expect(harness.applicationArgs).to.have.length(1);
    expect(harness.applicationArgs[0].limits).to.equal(START_GUI_SERVICE.limits);
    expect(harness.applicationArgs[0].browserPolicy).to.equal(START_GUI_SERVICE.browserPolicy);
    expect(harness.events.indexOf('browser.open')).to.be.lessThan(
      harness.events.indexOf('generation.open'),
    );
    expect(cleanupEvents(harness.events)).to.eql([
      'presentation.shutdown',
      'application.close',
      'generation.release',
      'status.close',
    ]);
  });

  it('uses the separate locally verified preview path without release acquisition', async () => {
    const harness = createHarness({ autoReady: 'back' });
    const result = await startDevelopmentWith({ cwd: CWD, source: DEVELOPMENT }, harness.deps);

    expect(result).to.eql('back');
    expect(harness.generationArgs).to.have.length(0);
    expect(harness.applicationArgs).to.have.length(1);
    expect(harness.applicationArgs[0].integrity).to.eql(DEVELOPMENT.integrity);
    expect(harness.applicationArgs[0].dir).to.eql(GENERATION_DIR);
    expect(cleanupEvents(harness.events)).to.eql([
      'presentation.shutdown',
      'application.close',
      'status.close',
    ]);
  });

  it('refuses a mismatched Generation before hosting and foregrounds bounded failure', async () => {
    let hostCalls = 0;
    const mismatch = fakeGeneration(Object.freeze({ name: '@other/gui', version: '1.0.0' }));
    const harness = createHarness({
      openGeneration: (input) =>
        Promise.resolve(openedGenerationFixture(input, mismatch, () => {
          harness.events.push('generation.release');
          harness.generationReleased.resolve();
          return Promise.resolve();
        })),
      startApplication() {
        hostCalls += 1;
        return Promise.resolve(startedFixture());
      },
    });

    const result = await startWith({ cwd: CWD }, harness.deps);
    expect(result).to.eql('failed');
    expect(hostCalls).to.eql(0);
    expect(harness.failures[0]?.category).to.eql('artifact-refused');
    expect(cleanupEvents(harness.events)).to.eql([
      'generation.release',
      'presentation.shutdown',
      'status.close',
    ]);
  });

  it('closes a refused hosted package before waiting for failure dismissal', async () => {
    const closeCalled = deferred();
    const mismatched = startedFixture({
      pkg: Object.freeze({ name: '@other/gui', version: '1.0.0' }),
      close() {
        closeCalled.resolve();
        return Promise.resolve();
      },
    });
    const harness = createHarness({ application: mismatched, autoFailure: false });
    const run = startWith({ cwd: CWD }, harness.deps);

    await harness.failed.promise;
    await closeCalled.promise;
    expect(harness.events).to.contain('application.close');
    expect(harness.events).not.to.contain('status.close');
    harness.controls.dismiss();

    expect(await run).to.eql('failed');
    expect(harness.failures[0]?.category).to.eql('artifact-refused');
    expect(cleanupEvents(harness.events)).to.eql([
      'application.close',
      'generation.release',
      'presentation.shutdown',
      'status.close',
    ]);
  });

  it('does not publish readiness after the returned application already terminated', async () => {
    const harness = createHarness({ application: startedFixture({ finished: Promise.resolve() }) });

    expect(await startWith({ cwd: CWD }, harness.deps)).to.eql('failed');
    expect(harness.events).not.to.contain('presentation.ready');
    expect(harness.failures[0]?.evidence).to.eql({
      kind: 'local',
      operation: 'application-listener',
    });
    expect(cleanupEvents(harness.events)).to.eql([
      'application.close',
      'generation.release',
      'presentation.shutdown',
      'status.close',
    ]);
  });

  it('requests presentation shutdown before aborting and draining Generation opening', async () => {
    const started = deferred();
    const harness = createHarness({
      autoReady: false,
      openGeneration(input) {
        started.resolve();
        return new Promise((resolve) => {
          if (!Is.abortSignal(input.until)) {
            throw new Error('Expected Generation cancellation authority.');
          }
          input.until.addEventListener('abort', () => {
            harness.events.push('generation.abort');
            resolve(Object.freeze({
              kind: 'failed',
              phase: 'input',
              reason: 'cancelled',
              ownership: 'not-acquired',
            }));
          }, { once: true });
        });
      },
    });
    const run = startWith({ cwd: CWD }, harness.deps);

    await started.promise;
    harness.controls.back();
    expect(await run).to.eql('back');
    expect(cleanupEvents(harness.events)).to.eql([
      'presentation.shutdown',
      'generation.abort',
      'status.close',
    ]);
  });

  it('retains Generation while a cancelled host startup drains', async () => {
    const hostStarted = deferred();
    const cancelled: t.DistServer.StartError = Object.freeze({
      name: 'DistServer.StartError',
      message: 'cancelled',
      reason: 'cancelled',
    });
    const harness = createHarness({
      autoReady: false,
      isHostError: (cause): cause is t.DistServer.StartError => cause === cancelled,
      startApplication(input) {
        hostStarted.resolve();
        return new Promise((_, reject) => {
          if (!Is.abortSignal(input.until)) {
            throw new Error('Expected application cancellation authority.');
          }
          input.until.addEventListener('abort', () => {
            harness.events.push('application-start.abort');
            reject(cancelled);
          }, { once: true });
        });
      },
    });
    const run = startWith({ cwd: CWD }, harness.deps);

    await hostStarted.promise;
    harness.controls.quit();
    expect(await run).to.eql('quit');
    expect(cleanupEvents(harness.events)).to.eql([
      'presentation.shutdown',
      'application-start.abort',
      'generation.release',
      'status.close',
    ]);
  });

  it('drains late BootstrapStatus startup after external cancellation', async () => {
    const statusOperation = Promise.withResolvers<t.BootstrapStatus.Started>();
    const abort = new AbortController();
    const harness = createHarness({ startStatus: () => statusOperation.promise });
    let settled = false;
    const run = startWith({ cwd: CWD, until: abort.signal }, harness.deps);
    void run.then(() => (settled = true), () => (settled = true));

    abort.abort();
    await Promise.resolve();
    expect(settled).to.eql(false);
    expect(harness.events).not.to.contain('status.close');
    statusOperation.resolve(createStatus(harness));

    expect(await run).to.eql('external-cancellation');
    expect(cleanupEvents(harness.events)).to.eql(['status.close']);
  });

  it('lets application termination release Generation while close remains pending', async () => {
    const close = deferred();
    const finished = deferred();
    const application = startedFixture({
      finished: finished.promise,
      close() {
        return close.promise;
      },
    });
    const harness = createHarness({ application });
    let settled = false;
    const run = startWith({ cwd: CWD }, harness.deps);
    void run.then(() => (settled = true), () => (settled = true));

    await harness.applicationClosed.promise;
    finished.resolve();
    await harness.generationReleased.promise;
    expect(settled).to.eql(false);
    expect(harness.events).not.to.contain('status.close');
    close.resolve();

    expect(await run).to.eql('quit');
    expect(cleanupEvents(harness.events)).to.eql([
      'presentation.shutdown',
      'application.close',
      'generation.release',
      'status.close',
    ]);
  });

  it('keeps status open while presentation shutdown remains pending', async () => {
    const presentationClose = deferred();
    const harness = createHarness({ presentationClose: () => presentationClose.promise });
    let settled = false;
    const run = startWith({ cwd: CWD }, harness.deps);
    void run.then(() => (settled = true), () => (settled = true));

    await harness.generationReleased.promise;
    expect(settled).to.eql(false);
    expect(harness.events).not.to.contain('status.close');
    presentationClose.resolve();

    expect(await run).to.eql('quit');
    expect(harness.events.at(-1)).to.eql('status.close');
  });

  it('settles production keyboard loss through application, Generation, and status owners', async () => {
    const presentation = productionPresentationFixture();
    const keyboardFailure = new Error('keyboard listener failed');
    const harness = createHarness({
      autoReady: false,
      presentation: presentation.presentation,
    });
    const run = startWith({ cwd: CWD }, harness.deps);

    await harness.applicationStarted.promise;
    presentation.rejectKeyboard(keyboardFailure);
    const error = await rejectionOf(() => run);

    expect(error).to.be.instanceOf(SuppressedError);
    if (!(error instanceof SuppressedError)) throw error;
    if (!Is.error(error.error)) throw new Error('Expected presentation-loss error.');
    if (!Is.error(error.error.cause)) throw new Error('Expected keyboard-listener error.');
    expect(error.error.cause.cause).to.equal(keyboardFailure);
    expect(error.suppressed).to.equal(keyboardFailure);
    expect(presentation.events).to.eql(['keyboard.shutdown', 'keyboard.dispose']);
    expect(cleanupEvents(harness.events)).to.eql([
      'application.close',
      'generation.release',
      'status.close',
    ]);
  });

  it('retains status while production presentation shutdown remains pending after loss', async () => {
    const presentation = productionPresentationFixture();
    const keyboardFailure = new Error('keyboard shutdown failed');
    const harness = createHarness({
      autoReady: false,
      presentation: presentation.presentation,
    });
    let settled = false;
    const run = startWith({ cwd: CWD }, harness.deps);
    void run.then(() => (settled = true), () => (settled = true));

    await harness.applicationStarted.promise;
    presentation.loseThroughPaint();
    await harness.generationReleased.promise;
    expect(settled).to.eql(false);
    expect(harness.events).not.to.contain('status.close');
    expect(presentation.events).to.eql(['keyboard.shutdown', 'keyboard.dispose']);

    presentation.rejectKeyboard(keyboardFailure);
    const error = await rejectionOf(() => run);

    expect(error).to.be.instanceOf(SuppressedError);
    if (!(error instanceof SuppressedError)) throw error;
    if (!Is.error(error.error)) throw new Error('Expected presentation-loss error.');
    expect(error.error.cause).to.equal(presentation.paintFailure);
    expect(error.suppressed).to.equal(keyboardFailure);
    expect(harness.events.at(-1)).to.eql('status.close');
  });

  it('preserves transition and screen-release failure through owner settlement', async () => {
    const screenReleaseFailure = new Error('resize unsubscribe failed');
    const presentation = productionPresentationFixture({ screenReleaseFailure });
    const application = startedFixture();
    const harness = createHarness({
      autoReady: false,
      presentation: presentation.presentation,
      startApplication() {
        presentation.failNextPaint();
        return Promise.resolve(application);
      },
    });
    const run = startWith({ cwd: CWD }, harness.deps);

    await harness.applicationClosed.promise;
    await harness.generationReleased.promise;
    expect(harness.events).not.to.contain('status.close');
    presentation.resolveKeyboard();
    const error = await rejectionOf(() => run);

    expect(error).to.be.instanceOf(SuppressedError);
    if (!(error instanceof SuppressedError)) throw error;
    if (!Is.error(error.error)) throw new Error('Expected primary presentation error.');
    expect(error.error.cause).to.equal(presentation.paintFailure);
    expect(error.suppressed).to.equal(screenReleaseFailure);
    expect(presentation.events).to.eql(['keyboard.shutdown', 'keyboard.dispose']);
    expect(cleanupEvents(harness.events)).to.eql([
      'application.close',
      'generation.release',
      'status.close',
    ]);
    expect(harness.events.at(-1)).to.eql('status.close');
  });

  it('preserves an event-driven loss across a deferred Generation race', async () => {
    const opening = Promise.withResolvers<t.Dist.Generation.Open.Result>();
    const generationEntered = deferred();
    const screenReleaseFailure = new Error('deferred resize unsubscribe failed');
    const presentation = productionPresentationFixture({ screenReleaseFailure });
    let generationInput: t.Dist.Generation.Open.Args | undefined;
    let applicationStarts = 0;
    const harness = createHarness({
      autoReady: false,
      presentation: presentation.presentation,
      openGeneration(input) {
        generationInput = input;
        generationEntered.resolve();
        return opening.promise;
      },
      startApplication() {
        applicationStarts += 1;
        return Promise.resolve(startedFixture());
      },
    });
    const run = startWith({ cwd: CWD }, harness.deps);

    await generationEntered.promise;
    if (!generationInput) throw new Error('Expected Generation opening input.');
    opening.resolve(openedGenerationFixture(generationInput, fakeGeneration(), () => {
      harness.events.push('generation.release');
      harness.generationReleased.resolve();
      return Promise.resolve();
    }));
    const lost = rejectionOf(() => presentation.lost);
    presentation.loseThroughPaint();

    await harness.generationReleased.promise;
    expect(applicationStarts).to.eql(0);
    expect(harness.events).not.to.contain('status.close');
    presentation.resolveKeyboard();
    const [error, lostError] = await Promise.all([rejectionOf(() => run), lost]);

    expect(error).to.equal(lostError);
    expect(error).to.be.instanceOf(SuppressedError);
    if (!(error instanceof SuppressedError)) throw error;
    if (!Is.error(error.error)) throw new Error('Expected primary presentation error.');
    expect(error.error.cause).to.equal(presentation.paintFailure);
    expect(error.suppressed).to.equal(screenReleaseFailure);
    expect(presentation.events).to.eql(['keyboard.shutdown', 'keyboard.dispose']);
    expect(cleanupEvents(harness.events)).to.eql(['generation.release', 'status.close']);
    expect(harness.events.at(-1)).to.eql('status.close');
  });

  it('keeps status open through pending Generation release and close settlement', async () => {
    const release = deferred();
    const statusClose = deferred();
    const harness = createHarness({
      generationRelease: () => release.promise,
      statusClose: () => statusClose.promise,
    });
    let settled = false;
    const run = startWith({ cwd: CWD }, harness.deps);
    void run.then(() => (settled = true), () => (settled = true));

    await harness.generationReleased.promise;
    await Promise.resolve();
    expect(settled).to.eql(false);
    expect(harness.events).not.to.contain('status.close');
    release.resolve();

    await harness.statusClosed.promise;
    await Promise.resolve();
    expect(settled).to.eql(false);
    statusClose.resolve();

    expect(await run).to.eql('quit');
  });

  it('continues to status cleanup after Generation release rejects', async () => {
    const failure = new Error('release failed');
    const harness = createHarness({ generationRelease: () => Promise.reject(failure) });
    const error = await rejectionOf(() => startWith({ cwd: CWD }, harness.deps));

    expect(error).to.equal(failure);
    expect(harness.events.at(-1)).to.eql('status.close');
  });

  it('releases Generation after rejected application termination, then rejects', async () => {
    const failure = new Error('listener failed');
    const finished = deferred();
    const harness = createHarness({
      application: startedFixture({ finished: finished.promise }),
      autoReady: false,
    });
    const run = startWith({ cwd: CWD }, harness.deps);

    await harness.ready.promise;
    finished.reject(failure);
    await harness.failed.promise;
    harness.controls.dismiss();
    const error = await rejectionOf(() => run);

    expect(error).to.equal(failure);
    expect(cleanupEvents(harness.events)).to.eql([
      'application.close',
      'generation.release',
      'presentation.shutdown',
      'status.close',
    ]);
  });

  it('rejects an unexpected Generation exception after closing acquired presentation', async () => {
    const failure = new Error('unexpected generation exception');
    const harness = createHarness({
      openGeneration: () => Promise.reject(failure),
      autoFailure: false,
    });
    const error = await rejectionOf(() => startWith({ cwd: CWD }, harness.deps));

    expect(error).to.equal(failure);
    expect(harness.failures).to.eql([]);
    expect(cleanupEvents(harness.events)).to.eql([
      'presentation.shutdown',
      'status.close',
    ]);
  });

  it('preserves failed late status startup after external cancellation', async () => {
    const statusOperation = Promise.withResolvers<t.BootstrapStatus.Started>();
    const abort = new AbortController();
    const failure = new Error('late status startup failed');
    const harness = createHarness({ startStatus: () => statusOperation.promise });
    let settled = false;
    const run = startWith({ cwd: CWD, until: abort.signal }, harness.deps);
    void run.then(() => (settled = true), () => (settled = true));

    abort.abort();
    await Promise.resolve();
    expect(settled).to.eql(false);
    statusOperation.reject(failure);

    expect(await rejectionOf(() => run)).to.equal(failure);
    expect(cleanupEvents(harness.events)).to.eql([]);
  });

  it('waits for termination after application-close rejection, then closes status', async () => {
    const closeFailure = new Error('application close failed');
    const finished = deferred();
    const application = startedFixture({
      finished: finished.promise,
      close: () => Promise.reject(closeFailure),
    });
    const harness = createHarness({ application });
    let settled = false;
    const run = startWith({ cwd: CWD }, harness.deps);
    void run.then(() => (settled = true), () => (settled = true));

    await harness.applicationClosed.promise;
    await Promise.resolve();
    expect(settled).to.eql(false);
    expect(harness.events).not.to.contain('generation.release');
    expect(harness.events).not.to.contain('status.close');
    finished.resolve();

    expect(await rejectionOf(() => run)).to.equal(closeFailure);
    expect(cleanupEvents(harness.events)).to.eql([
      'presentation.shutdown',
      'application.close',
      'generation.release',
      'status.close',
    ]);
  });

  it('prefers an exact late status rejection over its derived close rejection', async () => {
    const finished = deferred();
    const finishedFailure = new Error('status finished failed');
    const closeFailure = new Error('status close derived failure');
    const harness = createHarness({
      statusFinished: finished.promise,
      statusCloseFailure: closeFailure,
    });
    let settled = false;
    const run = startWith({ cwd: CWD }, harness.deps);
    void run.then(() => (settled = true), () => (settled = true));

    await harness.statusClosed.promise;
    expect(settled).to.eql(false);
    expect(harness.events.at(-1)).to.eql('status.close');
    finished.reject(finishedFailure);

    expect(await rejectionOf(() => run)).to.equal(finishedFailure);
    expect(cleanupEvents(harness.events)).to.eql([
      'presentation.shutdown',
      'application.close',
      'generation.release',
      'status.close',
    ]);
  });

  it('retains an exact status rejection while product failure remains foregrounded', async () => {
    const finished = deferred();
    const finishedFailure = new Error('foreground status finished failed');
    const closeFailure = new Error('foreground status close derived failure');
    const materialization: t.Dist.Failed = Object.freeze({
      kind: 'failed',
      stage: 'manifest-fetch',
      reason: 'resource-failure',
      cleanup: 'not-needed',
    });
    const harness = createHarness({
      statusFinished: finished.promise,
      statusCloseFailure: closeFailure,
      openGeneration: () => Promise.resolve(failedGenerationFixture(materialization)),
      autoFailure: false,
    });
    let settled = false;
    const run = startWith({ cwd: CWD }, harness.deps);
    void run.then(() => (settled = true), () => (settled = true));

    await harness.failed.promise;
    finished.reject(finishedFailure);
    await Promise.resolve();
    expect(settled).to.eql(false);
    expect(harness.events).not.to.contain('status.close');
    harness.controls.dismiss();

    expect(await rejectionOf(() => run)).to.equal(finishedFailure);
    expect(harness.events.at(-1)).to.eql('status.close');
  });

  it('suppresses an exact late status rejection under an existing primary failure', async () => {
    const finished = deferred();
    const releaseFailure = new Error('generation release failed');
    const finishedFailure = new Error('status finished failed');
    const closeFailure = new Error('status close derived failure');
    const harness = createHarness({
      statusFinished: finished.promise,
      statusCloseFailure: closeFailure,
      generationRelease: () => Promise.reject(releaseFailure),
    });
    const run = startWith({ cwd: CWD }, harness.deps);

    await harness.statusClosed.promise;
    expect(harness.events.at(-1)).to.eql('status.close');
    finished.reject(finishedFailure);
    const error = await rejectionOf(() => run);

    expect(error).to.be.instanceOf(SuppressedError);
    expect((error as SuppressedError).error).to.equal(releaseFailure);
    expect((error as SuppressedError).suppressed).to.equal(finishedFailure);
    expect(cleanupEvents(harness.events).at(-1)).to.eql('status.close');
  });

  it('preserves Generation release as primary when status close also rejects', async () => {
    const releaseFailure = new Error('generation release failed');
    const statusFailure = new Error('status close failed');
    const harness = createHarness({
      generationRelease: () => Promise.reject(releaseFailure),
      statusClose: () => Promise.reject(statusFailure),
    });
    const error = await rejectionOf(() => startWith({ cwd: CWD }, harness.deps));

    expect(error).to.be.instanceOf(SuppressedError);
    expect((error as SuppressedError).error).to.equal(releaseFailure);
    expect((error as SuppressedError).suppressed).to.equal(statusFailure);
    expect(harness.events.at(-1)).to.eql('status.close');
  });

  it('keeps browser invocation failure nonfatal and the admitted URL visible', async () => {
    const harness = createHarness({
      openBrowser() {
        throw new Error('no browser');
      },
    });
    expect(await startWith({ cwd: CWD }, harness.deps)).to.eql('quit');
    expect(harness.events).to.contain('presentation.warn-open');
  });

  it('returns a presented materialization failure as an ordinary failed outcome', async () => {
    const materialization: t.Dist.Failed = Object.freeze({
      kind: 'failed',
      stage: 'manifest-fetch',
      reason: 'resource-failure',
      cleanup: 'not-needed',
    });
    const harness = createHarness({
      openGeneration: () => Promise.resolve(failedGenerationFixture(materialization)),
    });

    expect(await startWith({ cwd: CWD }, harness.deps)).to.eql('failed');
    expect(harness.failures[0]).to.include({ category: 'source-unavailable' });
  });
});

function productionPresentationFixture(options: ProductionPresentationOptions = {}) {
  const keyboardFinished = deferred();
  const paintFailure = new Error('presentation repaint failed');
  const events: string[] = [];
  let keyboard: t.Cli.Keyboard.Bind.Options | undefined;
  let owner: Start.Gui.Presentation.Owner | undefined;
  let failPaint = false;

  const deps: Start.Gui.Presentation.Dependencies = Object.freeze({
    isInteractive: () => true,
    size: () => Object.freeze({ width: 100, height: 18 }),
    events() {
      return {
        resize$: {
          subscribe() {
            return {
              unsubscribe() {
                if (options.screenReleaseFailure) throw options.screenReleaseFailure;
              },
            };
          },
        },
        dispose() {},
      };
    },
    repaint() {
      if (failPaint) throw paintFailure;
    },
    bindKeyboard(input) {
      keyboard = input;
      let disposed = false;
      return Object.freeze({
        finished: keyboardFinished.promise,
        dispose() {
          if (disposed) return;
          disposed = true;
          events.push('keyboard.dispose');
        },
      });
    },
    shutdownKeyboard(handle) {
      events.push('keyboard.shutdown');
      return Cli.Keyboard.shutdown(handle);
    },
  });
  const presentation: Start.Gui.Presentation.Lib = Object.freeze({
    ...StartGuiPresentation,
    prepare(input) {
      const prepared = StartGuiPresentation.prepare(input, deps);
      return Object.freeze({
        status: prepared.status,
        async acquire(url: t.StringUrl) {
          owner = await prepared.acquire(url);
          return owner;
        },
      });
    },
  });

  return Object.freeze({
    presentation,
    events,
    paintFailure,
    rejectKeyboard(cause: Error) {
      keyboardFinished.reject(cause);
    },
    resolveKeyboard() {
      keyboardFinished.resolve();
    },
    failNextPaint() {
      failPaint = true;
    },
    get lost() {
      if (!owner) throw new Error('Expected presentation ownership.');
      return owner.lost;
    },
    loseThroughPaint() {
      if (!keyboard?.onKey) throw new Error('Expected keyboard presentation ownership.');
      failPaint = true;
      try {
        keyboard.onKey(REDRAW);
      } finally {
        failPaint = false;
      }
    },
  });
}

function createHarness(options: HarnessOptions = {}): Harness {
  const events: string[] = [];
  const failures: Start.Gui.Failure[] = [];
  const generationArgs: t.Dist.Generation.Open.Args[] = [];
  const applicationArgs: t.DistServer.Start.Args[] = [];
  const ready = deferred();
  const failed = deferred();
  const applicationStarted = deferred();
  const applicationClosed = deferred();
  const generationReleased = deferred();
  const statusClosed = deferred();
  const lost = Promise.withResolvers<never>();
  let input: Start.Gui.Presentation.Input | undefined;
  let state: Start.Gui.Presentation.State = Object.freeze({ kind: 'preparing' });

  const controls: Controls = Object.freeze({
    back: () => input?.onBack(),
    quit: () => input?.onQuit(),
    dismiss: () => input?.onDismiss(),
  });

  const owner: Start.Gui.Presentation.Owner = Object.freeze({
    lost: lost.promise,
    get current() {
      return state;
    },
    starting() {
      state = Object.freeze({ kind: 'starting-app-host' });
      events.push('presentation.starting');
    },
    ready(value) {
      state = Object.freeze({ kind: 'ready', ...value });
      events.push('presentation.ready');
      ready.resolve();
      const action = options.autoReady === undefined ? 'quit' : options.autoReady;
      if (action) queueMicrotask(() => controls[action]());
    },
    failed(value) {
      state = Object.freeze({
        kind: 'failed',
        category: value.category,
        safeEvidence: value.evidence,
      });
      failures.push(value);
      events.push('presentation.failed');
      failed.resolve();
      if (options.autoFailure !== false) queueMicrotask(() => controls.dismiss());
    },
    warnOpen() {
      events.push('presentation.warn-open');
    },
    redraw() {},
    shutdown() {
      events.push('presentation.shutdown');
      state = Object.freeze({ kind: 'stopping' });
      return options.presentationClose?.() ?? Promise.resolve();
    },
  });

  const defaultPresentation: Start.Gui.Dependencies['presentation'] = Object.freeze({
    ...StartGuiPresentation,
    prepare(next: Start.Gui.Presentation.Input) {
      input = next;
      return Object.freeze({
        status: Object.freeze({
          pages: Object.freeze([]),
          resolve: () => Object.freeze({ kind: 'page', key: 'preparing' }),
        }),
        acquire: () => Promise.resolve(owner),
      });
    },
  });

  const status = options.status ?? bootstrapStatusFixture({
    finished: options.statusFinished,
    close(reason) {
      events.push('status.close');
      statusClosed.resolve();
      return options.statusClose?.(reason);
    },
    closeFailure: options.statusCloseFailure,
  });
  const application = options.application ?? startedFixture();
  const wrapApplication = (
    started: Start.Gui.Application.Owner,
  ): Start.Gui.Application.Owner =>
    Object.freeze({
      ...started,
      close(reason?: unknown) {
        events.push('application.close');
        applicationClosed.resolve();
        return started.close(reason);
      },
    });
  const startApplication: Start.Gui.Dependencies['startApplication'] = async (args) => {
    const started = options.startApplication
      ? await options.startApplication(args)
      : await Promise.resolve(application);
    if (!options.startApplication) {
      applicationArgs.push(args);
      events.push('application.start');
    }
    applicationStarted.resolve();
    return wrapApplication(started);
  };
  const deps: Start.Gui.Dependencies = Object.freeze({
    runtimeRoot: () => ROOT,
    startStatus: options.startStatus ?? (() => Promise.resolve(status)),
    openGeneration: options.openGeneration ?? ((args) => {
      generationArgs.push(args);
      events.push('generation.open');
      return Promise.resolve(openedGenerationFixture(args, fakeGeneration(), async () => {
        events.push('generation.release');
        generationReleased.resolve();
        await options.generationRelease?.();
      }));
    }),
    startApplication,
    isHostError: options.isHostError ?? ((_): _ is t.DistServer.StartError => false),
    openBrowser: options.openBrowser ?? (() => events.push('browser.open')),
    presentation: options.presentation ?? defaultPresentation,
  });

  return {
    deps,
    controls,
    events,
    failures,
    generationArgs,
    applicationArgs,
    ready,
    failed,
    applicationStarted,
    applicationClosed,
    generationReleased,
    statusClosed,
  };
}

function createStatus(harness: Pick<Harness, 'events' | 'statusClosed'>) {
  return bootstrapStatusFixture({
    close() {
      harness.events.push('status.close');
      harness.statusClosed.resolve();
    },
  });
}

function cleanupEvents(events: readonly string[]): readonly string[] {
  const selected = new Set([
    'presentation.shutdown',
    'application.close',
    'application-start.abort',
    'generation.abort',
    'generation.release',
    'status.close',
  ]);
  return events.filter((event) => selected.has(event));
}
