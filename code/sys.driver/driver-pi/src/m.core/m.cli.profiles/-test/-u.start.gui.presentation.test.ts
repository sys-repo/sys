import { describe, expect, it, type t } from '../../../-test.ts';
import { Cli, Err, Is } from '../common.ts';
import type { Start } from '../u.start/u.gui/t.ts';
import { StartGuiPresentation } from '../u.start/u.gui/u.presentation.ts';
import { snapshotReleaseAuthority, START_GUI_SERVICE } from '../u/u.start.gui.service.ts';
import { deferred, GENERATION_DIR } from './u.fixture.start.gui.ts';

type PresentationHarnessOptions = Readonly<{
  interactive?: boolean;
  keyboardFinished?: PromiseWithResolvers<void>;
  transitionPaintFailure?: Error;
  screenReleaseFailure?: Error;
}>;

type KeyPress = Parameters<NonNullable<t.Cli.Keyboard.Bind.Options['onKey']>>[0];

const STATUS: t.StringUrl = 'http://127.0.0.1:45000/0123456789abcdefghijklmnopqrstuvwxyzabcd';
const APPLICATION: t.StringUrl = 'http://127.0.0.1:45001';
const DIGEST: t.StringHash = `sha256-${'d'.repeat(64)}`;
const BACK: KeyPress = Object.assign(new Event('keydown'), {
  key: 'left',
  ctrlKey: true,
  altKey: false,
  metaKey: false,
  shiftKey: false,
  repeat: false,
});
const REDRAW: KeyPress = Object.assign(new Event('keydown'), {
  key: 'r',
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  shiftKey: false,
  repeat: false,
});
const FAILURE: Start.Gui.Failure = Object.freeze({
  category: 'local-failure',
  evidence: Object.freeze({ kind: 'local', operation: 'application-host' }),
  error: new Error('host failed'),
});

describe('@sys/driver-pi start:gui presentation', () => {
  it('projects bootstrap pages and redirects only after admitted readiness', async () => {
    const harness = createPresentationHarness();
    const prepared = StartGuiPresentation.prepare(harness.input, harness.deps);
    expect(prepared.status.resolve()).to.eql({ kind: 'page', key: 'preparing' });
    expect(prepared.status.pages.map((page) => page.key)).to.include.members([
      'preparing',
      'starting-app-host',
      'failed-artifact-refused',
      'stopping',
    ]);

    const presentation = await prepared.acquire(STATUS);
    presentation.starting();
    expect(prepared.status.resolve()).to.eql({ kind: 'page', key: 'starting-app-host' });
    presentation.ready({ origin: APPLICATION, digest: DIGEST, dir: GENERATION_DIR });
    expect(prepared.status.resolve()).to.eql({ kind: 'redirect', origin: APPLICATION });
    presentation.failed(FAILURE);
    expect(prepared.status.resolve()).to.eql({ kind: 'page', key: 'failed-local-failure' });
    await presentation.shutdown();
    expect(prepared.status.resolve()).to.eql({ kind: 'page', key: 'stopping' });
  });

  it('maps keyboard controls against the current finite state', async () => {
    const harness = createPresentationHarness();
    const prepared = StartGuiPresentation.prepare(harness.input, harness.deps);
    const presentation = await prepared.acquire(STATUS);

    harness.keyboard?.onKey?.(BACK);
    expect(harness.calls.back).to.eql(1);
    presentation.failed(FAILURE);
    harness.keyboard?.onKey?.(BACK);
    expect(harness.calls.back).to.eql(1);
    await harness.keyboard?.onQuit();
    expect(harness.calls.dismiss).to.eql(1);

    presentation.ready({ origin: APPLICATION, digest: DIGEST, dir: GENERATION_DIR });
    await harness.keyboard?.onQuit();
    expect(harness.calls.quit).to.eql(1);
    await presentation.shutdown();
  });

  it('repaints admitted resize and redraw snapshots, then releases screen before keyboard', async () => {
    const harness = createPresentationHarness();
    const prepared = StartGuiPresentation.prepare(harness.input, harness.deps);
    const presentation = await prepared.acquire(STATUS);
    const initialFrames = harness.frames.length;

    harness.resize({ width: 72, height: 12 });
    expect(harness.frames.length).to.eql(initialFrames + 1);
    expectFrameWithin(harness.frames.at(-1), 72);

    harness.size.width = 64;
    harness.keyboard?.onKey?.(REDRAW);
    expectFrameWithin(harness.frames.at(-1), 64);

    await presentation.shutdown();
    expect(harness.events.slice(-3)).to.eql([
      'resize.unsubscribe',
      'screen.dispose',
      'keyboard.shutdown',
    ]);
  });

  it('throws the cleanup-preserving loss published by a failed transition', async () => {
    const paintFailure = new Error('transition repaint failed');
    const releaseFailure = new Error('resize unsubscribe failed');
    const harness = createPresentationHarness({
      transitionPaintFailure: paintFailure,
      screenReleaseFailure: releaseFailure,
    });
    const prepared = StartGuiPresentation.prepare(harness.input, harness.deps);
    const presentation = await prepared.acquire(STATUS);
    let transitionError: unknown;

    try {
      presentation.starting();
    } catch (cause) {
      transitionError = cause;
    }
    const lostError = await rejection(presentation.lost);

    expect(transitionError).to.equal(lostError);
    expect(lostError).to.be.instanceOf(SuppressedError);
    if (!(lostError instanceof SuppressedError)) throw lostError;
    if (!Is.error(lostError.error)) throw new Error('Expected primary presentation error.');
    expect(lostError.error.cause).to.equal(paintFailure);
    expect(lostError.suppressed).to.equal(releaseFailure);
    await presentation.shutdown();
    expect(harness.events).to.eql([
      'resize.unsubscribe',
      'screen.dispose',
      'keyboard.shutdown',
    ]);
  });

  it('rethrows one memoized loss after an event-driven repaint failure', async () => {
    const paintFailure = new Error('redraw repaint failed');
    const releaseFailure = new Error('redraw release failed');
    const harness = createPresentationHarness({
      transitionPaintFailure: paintFailure,
      screenReleaseFailure: releaseFailure,
    });
    const prepared = StartGuiPresentation.prepare(harness.input, harness.deps);
    const presentation = await prepared.acquire(STATUS);
    const lost = rejection(presentation.lost);

    harness.keyboard?.onKey?.(REDRAW);
    const lostError = await lost;
    let transitionError: unknown;
    try {
      presentation.starting();
    } catch (cause) {
      transitionError = cause;
    }

    expect(transitionError).to.equal(lostError);
    expect(lostError).to.be.instanceOf(SuppressedError);
    if (!(lostError instanceof SuppressedError)) throw lostError;
    if (!Is.error(lostError.error)) throw new Error('Expected primary presentation error.');
    expect(lostError.error.cause).to.equal(paintFailure);
    expect(lostError.suppressed).to.equal(releaseFailure);
    await presentation.shutdown();
  });

  it('turns browser-open warning into presentation state without losing ownership', async () => {
    const harness = createPresentationHarness();
    const prepared = StartGuiPresentation.prepare(harness.input, harness.deps);
    const presentation = await prepared.acquire(STATUS);

    presentation.warnOpen();
    presentation.warnOpen();
    expect(Cli.stripAnsi(harness.frames.at(-1) ?? '')).to.contain(
      'browser did not open; use launch URL',
    );
    await presentation.shutdown();
  });

  it('rejects loss of the keyboard owner and still supports explicit shutdown', async () => {
    const keyboardFinished = deferred();
    const harness = createPresentationHarness({ keyboardFinished });
    const prepared = StartGuiPresentation.prepare(harness.input, harness.deps);
    const presentation = await prepared.acquire(STATUS);
    const failure = new Error('keyboard stopped');

    keyboardFinished.reject(failure);
    const error = await rejection(presentation.lost);
    expect(error.message).to.eql('start:gui screen presentation failed.');
    expect(await rejection(presentation.shutdown())).to.equal(failure);
    expect(harness.events).to.contain('keyboard.shutdown');
  });

  it('rejects unavailable terminal acquisition before binding owners', async () => {
    const harness = createPresentationHarness({ interactive: false });
    const prepared = StartGuiPresentation.prepare(harness.input, harness.deps);
    const error = await rejection(prepared.acquire(STATUS));

    expect(error.message).to.eql('start:gui terminal presentation unavailable.');
    expect(harness.keyboard).to.eql(undefined);
    expect(harness.events).to.eql([]);
  });
});

async function rejection(operation: Promise<unknown>): Promise<Error> {
  try {
    await operation;
  } catch (cause) {
    return Is.error(cause) ? cause : Err.std(cause);
  }
  throw new Error('Expected rejection.');
}

function expectFrameWithin(frame: string | undefined, width: number): void {
  if (!frame) throw new Error('Expected a rendered frame.');
  expect(frame.split('\n').every((row) => Cli.Fmt.Text.Width.measure(row) <= width)).to.eql(true);
}

function createPresentationHarness(options: PresentationHarnessOptions = {}) {
  const frames: string[] = [];
  const events: string[] = [];
  const size = { width: 100, height: 18 };
  const calls = { back: 0, quit: 0, dismiss: 0 };
  const keyboardFinished = options.keyboardFinished ?? deferred();
  let keyboard: t.Cli.Keyboard.Bind.Options | undefined;
  let resizeListener: ((event: t.Cli.Screen.SizeChanged) => void) | undefined;

  const authority = snapshotReleaseAuthority();
  if (!authority.ok) throw authority.failure.error;
  const input: Start.Gui.Presentation.Input = Object.freeze({
    authority: authority.authority,
    recovery: START_GUI_SERVICE.recovery,
    onBack: () => calls.back += 1,
    onQuit: () => calls.quit += 1,
    onDismiss: () => calls.dismiss += 1,
  });
  const deps: Start.Gui.Presentation.Dependencies = Object.freeze({
    isInteractive: () => options.interactive ?? true,
    size: () => Object.freeze({ ...size }),
    events() {
      return {
        resize$: {
          subscribe(listener: (event: t.Cli.Screen.SizeChanged) => void) {
            resizeListener = listener;
            return {
              unsubscribe() {
                events.push('resize.unsubscribe');
                resizeListener = undefined;
                if (options.screenReleaseFailure) throw options.screenReleaseFailure;
              },
            };
          },
        },
        dispose() {
          events.push('screen.dispose');
        },
      };
    },
    repaint(frame) {
      if (options.transitionPaintFailure && frames.length > 0) {
        throw options.transitionPaintFailure;
      }
      frames.push(frame);
    },
    bindKeyboard(next) {
      keyboard = next;
      let disposed = false;
      return {
        finished: keyboardFinished.promise,
        dispose() {
          if (disposed) return;
          disposed = true;
          keyboardFinished.resolve();
        },
      };
    },
    shutdownKeyboard(handle) {
      events.push('keyboard.shutdown');
      return Cli.Keyboard.shutdown(handle);
    },
  });

  return {
    input,
    deps,
    frames,
    events,
    size,
    calls,
    get keyboard() {
      return keyboard;
    },
    resize(after: t.Cli.Screen.Size) {
      resizeListener?.({
        kind: 'size:changed',
        before: Object.freeze({ width: 100, height: 18 }),
        after,
      });
    },
  };
}
