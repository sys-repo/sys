import { FakeSpinner } from '@sys/cli/testing';
import { describe, expect, it } from '../../-test.ts';
import { Cli, stripAnsi } from '../common.ts';
import { StartReporter } from '../u.lifecycle/u.start.reporter.ts';
import { formatStartServiceBody } from '../u.lifecycle/u.start.ts';

describe('@sys/cell/cli start reporter', () => {
  it('resolves automatic and explicit reporter modes truthfully', () => {
    expect(StartReporter.resolve('auto', { isInteractive: () => true })).to.eql('screen');
    expect(StartReporter.resolve('auto', { isInteractive: () => false })).to.eql('raw');
    expect(StartReporter.resolve('raw', { isInteractive: () => true })).to.eql('raw');
    expect(() => StartReporter.resolve('screen', { isInteractive: () => false })).to.throw(
      "Cell start reporter 'screen' requires an interactive terminal.",
    );
  });

  it('raw → preserves append-only header, body, and summary ordering', async () => {
    const harness = createHarness('raw');
    const reporter = harness.reporter;

    reporter.open();
    reporter.starting(2);
    reporter.ready(readyBody());
    reporter.complete('summary');
    await reporter.dispose();
    await reporter.dispose();

    expect(harness.effects).to.eql([
      'print:header:raw',
      'print:\n  body:76',
      'print:\nsummary',
    ]);
  });

  it('raw → refuses completion print failure after another terminal winner', async () => {
    const cause = new Error('completion-print-failed');
    const harness = createHarness('raw', { controls: true, acceptFailure: false });

    harness.reporter.open();
    harness.reporter.ready(readyBody());
    harness.setPrintError(cause);
    harness.reporter.complete('summary');

    expect(harness.failures).to.eql([cause]);
    expect(harness.effects.at(-2)).to.eql('print:\nsummary');
    await harness.reporter.dispose();
  });

  it('raw → omits an absent identity header without changing append-only ordering', async () => {
    const harness = createHarness('raw', { header: '' });
    const reporter = harness.reporter;

    reporter.open();
    reporter.ready(readyBody());
    reporter.complete('summary');
    await reporter.dispose();

    expect(harness.effects).to.eql([
      'print:  body:76',
      'print:\nsummary',
    ]);
  });

  it('propagates stdout hyperlink policy independently from reporter mode and width', async () => {
    const rawTerminal = createHarness('raw', { header: '', terminal: true });
    const rawTerminalReady = readyProbe();
    rawTerminal.reporter.open();
    rawTerminal.reporter.ready(rawTerminalReady.input);
    expect(rawTerminalReady.calls).to.eql([{ hyperlinks: true }]);
    expect(rawTerminal.effects).to.eql(['print:linked']);
    await rawTerminal.reporter.dispose();

    const rawRedirected = createHarness('raw', { header: '', terminal: false });
    const rawRedirectedReady = readyProbe();
    rawRedirected.reporter.open();
    rawRedirected.reporter.ready(rawRedirectedReady.input);
    expect(rawRedirectedReady.calls).to.eql([]);
    expect(rawRedirected.effects).to.eql(['print:plain']);
    await rawRedirected.reporter.dispose();

    const screen = createHarness('screen', { terminal: true });
    const screenReady = readyProbe();
    screen.reporter.open();
    screen.reporter.ready(screenReady.input);
    expect(screenReady.calls).to.eql([{ width: 80, hyperlinks: true }]);
    await screen.reporter.dispose();
  });

  it('screen → repaints one responsive startup-to-complete frame', async () => {
    const harness = createHarness('screen');
    const reporter = harness.reporter;

    reporter.open();
    reporter.starting(2);
    harness.resize({ width: 50, height: 20 });
    reporter.ready(readyBody());
    reporter.complete('summary');
    await reporter.dispose();
    await reporter.dispose();

    expect(harness.effects).to.eql([
      'screen:observe',
      'repaint:header:80',
      'spinner:create:stdout',
      'spinner:start:starting:2',
      'interval:start',
      'spinner:stop',
      'repaint:header:50',
      'spinner:start:starting:2',
      'interval:cancel',
      'spinner:stop',
      'repaint:header:50\n\n  body:46',
      'repaint:header:50\n\n  body:46\n\nsummary',
      'screen:release',
    ]);
  });

  it('screen → uses the first row for body content when identity is absent', async () => {
    const harness = createHarness('screen', { header: '' });
    const reporter = harness.reporter;

    reporter.open();
    reporter.ready(readyBody());
    reporter.complete('summary');

    const frame = harness.effects.filter((effect) => effect.startsWith('repaint:')).at(-1) ?? '';
    expect(frame).to.eql('repaint:  body:76\n\nsummary');

    await reporter.dispose();
  });

  it('screen → spends tiny anonymous frames on content before separators', async () => {
    const cases = [
      { height: 1, frame: 'summary' },
      { height: 2, frame: '  body:16\nsummary' },
      { height: 3, frame: '  body:16\n\nsummary' },
    ] as const;

    for (const item of cases) {
      const harness = createHarness('screen', {
        header: '',
        size: { width: 20, height: item.height },
      });
      const reporter = harness.reporter;

      reporter.open();
      reporter.ready(readyBody());
      reporter.complete('summary');

      const frame = harness.effects.filter((effect) => effect.startsWith('repaint:')).at(-1) ?? '';
      expect(frame).to.eql(`repaint:${item.frame}`);

      await reporter.dispose();
    }
  });

  it('screen → adopts a synchronous viewport observed during acquisition', async () => {
    const harness = createHarness('screen', {
      resizeOnObserve: { width: 36, height: 12 },
    });

    harness.reporter.open();
    await harness.reporter.dispose();

    expect(harness.effects).to.eql([
      'screen:observe',
      'repaint:header:36',
      'screen:release',
    ]);
  });

  it('screen → releases terminal observation without masking acquisition failure', () => {
    const cause = new Error('repaint-failed');
    const harness = createHarness('screen', { repaintError: cause });
    let thrown: unknown;

    try {
      harness.reporter.open();
    } catch (error) {
      thrown = error;
    }

    expect(thrown).to.equal(cause);
    expect(harness.effects).to.eql([
      'screen:observe',
      'repaint:header:80',
      'screen:release',
    ]);
  });

  it('screen → composes acquisition and observer-release failures', () => {
    const cause = new Error('repaint-failed');
    const cleanup = new Error('screen-release-failed');
    const harness = createHarness('screen', {
      repaintError: cause,
      releaseError: cleanup,
    });
    let thrown: unknown;

    try {
      harness.reporter.open();
    } catch (error) {
      thrown = error;
    }

    expect(thrown instanceof AggregateError).to.eql(true);
    const aggregate = thrown as AggregateError;
    expect(aggregate.cause).to.equal(cause);
    expect(aggregate.errors).to.eql([cause, cleanup]);
    expect(harness.effects).to.eql([
      'screen:observe',
      'repaint:header:80',
      'screen:release',
    ]);
  });

  it('screen → bounds every completed frame row to the current viewport', async () => {
    const harness = createHarness('screen', {
      size: { width: 8, height: 4 },
    });
    const reporter = harness.reporter;

    reporter.open();
    reporter.ready({ text: 'body-too-long', render: () => 'body-too-long' });
    reporter.complete('summary');

    const frame = harness.effects.filter((effect) => effect.startsWith('repaint:')).at(-1) ?? '';
    const rows = frame.slice('repaint:'.length).split('\n');
    expect(rows.length <= 4).to.eql(true);
    for (const row of rows) expect(Cli.Fmt.Text.Width.measure(row) <= 8).to.eql(true);
    expect(frame).to.contain(Cli.Fmt.omission());
    expect(frame).to.contain('summary');

    await reporter.dispose();
  });

  it('screen → releases an active startup spinner and observer exactly once', async () => {
    const harness = createHarness('screen');
    const reporter = harness.reporter;

    reporter.open();
    reporter.starting(1);
    await reporter.dispose();
    await reporter.dispose();

    expect(harness.effects).to.eql([
      'screen:observe',
      'repaint:header:80',
      'spinner:create:stdout',
      'spinner:start:starting:1',
      'interval:start',
      'interval:cancel',
      'spinner:stop',
      'screen:release',
    ]);
  });

  it('screen → deduplicates nested spinner and observer cleanup failures', async () => {
    const cancelFailure = new Error('interval-cancel-failed');
    const sharedFailure = new Error('spinner-and-screen-release-failed');
    const harness = createHarness('screen', {
      cancelError: cancelFailure,
      releaseError: sharedFailure,
      stopError: sharedFailure,
    });

    harness.reporter.open();
    harness.reporter.starting(1);
    const first = await harness.reporter.dispose().then(
      () => undefined,
      (cause) => cause,
    );
    const second = await harness.reporter.dispose().then(
      () => undefined,
      (cause) => cause,
    );

    expect(first).to.equal(second);
    expect(first instanceof AggregateError).to.eql(true);
    const aggregate = first as AggregateError;
    expect(aggregate.cause).to.equal(cancelFailure);
    expect(aggregate.errors).to.eql([cancelFailure, sharedFailure]);
    expect(harness.effects.filter((effect) => effect === 'interval:cancel').length).to.eql(1);
    expect(harness.effects.filter((effect) => effect === 'spinner:stop').length).to.eql(1);
    expect(harness.effects.filter((effect) => effect === 'screen:release').length).to.eql(1);
  });

  it('screen → ignores resize and phase effects after disposal', async () => {
    const harness = createHarness('screen');
    const reporter = harness.reporter;

    reporter.open();
    await reporter.dispose();
    const settled = [...harness.effects];

    harness.resize({ width: 40, height: 10 });
    reporter.redraw();
    reporter.starting(1);
    reporter.ready({ text: 'body', render: () => 'body' });
    reporter.complete('summary');

    expect(harness.effects).to.eql(settled);
  });

  it('keyboard → binds only the ready screen and keeps controls hidden', async () => {
    const raw = createHarness('raw', { controls: true });
    raw.reporter.open();
    raw.reporter.ready(readyBody());
    expect(raw.effects).not.to.contain('keyboard:bind');
    await raw.reporter.dispose();

    const unavailable = createHarness('screen', {
      controls: true,
      keyboard: 'unavailable',
    });
    unavailable.reporter.open();
    unavailable.reporter.ready(readyBody());
    expect(unavailable.effects).to.contain('keyboard:bind');
    expect(unavailable.binding()?.quitKeys).to.eql('interrupt-only');
    expect(stripAnsi(unavailable.frames.at(-1) ?? '')).to.eql('header:80\n\n  body:76');
    await unavailable.reporter.dispose();
    expect(unavailable.effects).not.to.contain('keyboard:shutdown');

    const screen = createHarness('screen', { controls: true });
    screen.reporter.open();
    const openingFrames = screen.frames.length;
    screen.reporter.redraw();
    expect(screen.frames.length).to.eql(openingFrames);
    expect(screen.effects).not.to.contain('keyboard:bind');
    screen.reporter.ready(readyBody());

    expect(screen.effects).to.contain('keyboard:bind');
    expect(screen.binding()?.quitKeys).to.eql('interrupt-only');
    expect(stripAnsi(screen.frames.at(-1) ?? '')).to.eql('header:80\n\n  body:76');

    await screen.key(keyEvent('q'));
    expect(screen.effects).not.to.contain('keyboard:interrupt');
    await screen.interrupt();
    expect(screen.effects.filter((effect) => effect === 'keyboard:interrupt').length).to.eql(1);

    await screen.reporter.dispose();
    await screen.reporter.dispose();
    expect(screen.effects.filter((effect) => effect === 'keyboard:shutdown').length).to.eql(1);
    expect(screen.effects.filter((effect) => effect === 'keyboard:dispose').length).to.eql(0);
  });

  it('keyboard → treats normal completion as nonterminal capability loss', async () => {
    const harness = createHarness('screen', { controls: true });
    harness.reporter.open();
    harness.reporter.ready(readyBody());
    harness.finishKeyboard();
    await Promise.resolve();

    expect(harness.effects).not.to.contain('keyboard:interrupt');
    expect(harness.failures).to.eql([]);
    const repaintCount = harness.frames.length;
    harness.setSize({ width: 48, height: 20 });
    harness.reporter.redraw();
    expect(harness.frames.length).to.eql(repaintCount + 1);
    expect(stripAnsi(harness.frames.at(-1) ?? '')).to.contain('header:48');

    await harness.reporter.dispose();
    await harness.reporter.dispose();
    expect(harness.effects.filter((effect) => effect === 'keyboard:shutdown').length).to.eql(1);
    expect(harness.effects.filter((effect) => effect === 'keyboard:dispose').length).to.eql(0);
  });

  it('keyboard → publishes listener failure once without duplicating cleanup evidence', async () => {
    const cause = new Error('keyboard-listener-failed');
    const harness = createHarness('screen', { controls: true });

    harness.reporter.open();
    harness.reporter.ready(readyBody());
    harness.failKeyboard(cause);
    await Promise.resolve();

    expect(harness.failures).to.eql([cause]);
    expect(stripAnsi(harness.frames.at(-1) ?? '')).to.contain('body:76');
    await harness.reporter.dispose();
    expect(harness.failures).to.eql([cause]);
    expect(harness.effects.filter((effect) => effect === 'keyboard:shutdown').length).to.eql(1);
  });

  it('keyboard → aggregates distinct screen and keyboard cleanup failures once', async () => {
    const screenFailure = new Error('screen-release-failed');
    const keyboardFailure = new Error('keyboard-shutdown-failed');
    const harness = createHarness('screen', {
      controls: true,
      releaseError: screenFailure,
      shutdownError: keyboardFailure,
    });
    harness.reporter.open();
    harness.reporter.ready(readyBody());

    const first = await harness.reporter.dispose().then(
      () => undefined,
      (cause) => cause,
    );
    const second = await harness.reporter.dispose().then(
      () => undefined,
      (cause) => cause,
    );

    expect(first).to.equal(second);
    expect(first instanceof AggregateError).to.eql(true);
    const aggregate = first as AggregateError;
    expect(aggregate.cause).to.equal(screenFailure);
    expect(aggregate.errors).to.eql([screenFailure, keyboardFailure]);
    expect(harness.effects.filter((effect) => effect === 'screen:release').length).to.eql(1);
    expect(harness.effects.filter((effect) => effect === 'keyboard:shutdown').length).to.eql(1);
  });

  it('keyboard → preserves an earlier terminal winner over late listener failure', async () => {
    const cause = new Error('late-keyboard-listener-failed');
    const harness = createHarness('screen', { controls: true, acceptFailure: false });

    harness.reporter.open();
    harness.reporter.ready(readyBody());
    harness.failKeyboard(cause);
    await Promise.resolve();
    harness.reporter.complete('summary');

    expect(harness.failures).to.eql([cause]);
    expect(stripAnsi(harness.frames.at(-1) ?? '')).to.contain('summary');
    await harness.reporter.dispose();
  });

  it('screen → refuses completion repaint failure after another terminal winner', async () => {
    const cause = new Error('completion-repaint-failed');
    const harness = createHarness('screen', { controls: true, acceptFailure: false });

    harness.reporter.open();
    harness.reporter.ready(readyBody());
    harness.setRepaintError(cause);
    harness.reporter.complete('summary');

    expect(harness.failures).to.eql([cause]);
    expect(stripAnsi(harness.frames.at(-1) ?? '')).to.contain('summary');
    const settled = [...harness.effects];
    await harness.key(redrawKey());
    expect(harness.effects).to.eql(settled);

    await harness.reporter.dispose();
  });

  it('keyboard → preserves pre-control frame bytes at wide, short, and zero sizes', async () => {
    const cases = [
      { size: { width: 80, height: 24 }, frame: 'header:80\n\n  body:76' },
      { size: { width: 20, height: 2 }, frame: 'header:20\n  body:16' },
      { size: { width: 0, height: 0 }, frame: '' },
    ] as const;

    for (const item of cases) {
      const plain = createHarness('screen', { size: item.size });
      const controlled = createHarness('screen', { controls: true, size: item.size });
      plain.reporter.open();
      plain.reporter.ready(readyBody());
      controlled.reporter.open();
      controlled.reporter.ready(readyBody());

      expect(stripAnsi(plain.frames.at(-1) ?? '')).to.eql(item.frame);
      expect(controlled.frames.at(-1)).to.eql(plain.frames.at(-1));
      expect(stripAnsi(controlled.frames.at(-1) ?? '')).not.to.contain('redraw:');
      expect(stripAnsi(controlled.frames.at(-1) ?? '')).not.to.contain('quit:');

      await plain.reporter.dispose();
      await controlled.reporter.dispose();
    }
  });

  it('redraw → admits only canonical r and remeasures the retained ready frame', async () => {
    const harness = createHarness('screen', { controls: true });
    const reporter = harness.reporter;
    reporter.open();
    reporter.ready(readyBody());
    const repaintCount = harness.frames.length;

    await harness.key(redrawKey({ shiftKey: true }));
    await harness.key(redrawKey({ ctrlKey: true }));
    await harness.key(redrawKey({ altKey: true }));
    await harness.key(redrawKey({ metaKey: true }));
    await harness.key(redrawKey({ key: 'R' }));
    await harness.key({ key: 'r' });
    expect(harness.frames.length).to.eql(repaintCount);

    harness.setSize({ width: 48, height: 20 });
    await harness.key(redrawKey());

    expect(harness.frames.length).to.eql(repaintCount + 1);
    const frame = stripAnsi(harness.frames.at(-1) ?? '');
    expect(frame).to.contain('header:48');
    expect(frame).to.contain('body:44');
    expect(frame).not.to.contain('redraw:');
    expect(frame).not.to.contain('quit:');

    harness.setSize({ width: 52, height: 20 });
    await harness.key(redrawKey());
    expect(harness.frames.length).to.eql(repaintCount + 2);
    expect(stripAnsi(harness.frames.at(-1) ?? '')).to.contain('header:52');

    reporter.complete('summary');
    const completedFrames = harness.frames.length;
    await harness.key(redrawKey());
    expect(harness.frames.length).to.eql(completedFrames);

    await reporter.dispose();
  });

  it('redraw → preserves a newer resize observed during terminal measurement', async () => {
    let measurements = 0;
    let harness: ReturnType<typeof createHarness>;
    harness = createHarness('screen', {
      controls: true,
      measure() {
        measurements += 1;
        if (measurements === 2) {
          harness.resize({ width: 42, height: 18 });
          return { width: 100, height: 40 };
        }
        return { width: 80, height: 24 };
      },
    });

    harness.reporter.open();
    harness.reporter.ready(readyBody());
    const repaintCount = harness.frames.length;
    await harness.key(redrawKey());

    expect(harness.frames.length).to.eql(repaintCount + 1);
    const frame = stripAnsi(harness.frames.at(-1) ?? '');
    expect(frame).to.contain('header:42');
    expect(frame).to.contain('body:38');
    expect(frame).not.to.contain('header:100');

    await harness.reporter.dispose();
  });

  it('redraw → drains resize published from repaint to the newest complete frame', async () => {
    let active = false;
    let resized = false;
    let harness: ReturnType<typeof createHarness>;
    harness = createHarness('screen', {
      controls: true,
      onRepaint() {
        if (!active || resized) return;
        resized = true;
        harness.resize({ width: 42, height: 18 });
      },
    });

    harness.reporter.open();
    harness.reporter.ready(readyBody());
    const repaintCount = harness.frames.length;
    harness.setSize({ width: 100, height: 40 });
    active = true;
    await harness.key(redrawKey());
    active = false;

    expect(harness.frames.length).to.eql(repaintCount + 2);
    expect(stripAnsi(harness.frames.at(-2) ?? '')).to.contain('header:100');
    const finalFrame = stripAnsi(harness.frames.at(-1) ?? '');
    expect(finalFrame).to.contain('header:42');
    expect(finalFrame).to.contain('body:38');

    await harness.reporter.dispose();
  });

  it('redraw → publishes repaint failure and makes later presentation inert', async () => {
    const cause = new Error('redraw-repaint-failed');
    const harness = createHarness('screen', { controls: true });

    harness.reporter.open();
    harness.reporter.ready(readyBody());
    const repaintCount = harness.frames.length;
    harness.setRepaintError(cause);
    await harness.key(redrawKey());

    expect(harness.failures).to.eql([cause]);
    expect(harness.frames.length).to.eql(repaintCount + 1);
    const settled = [...harness.effects];
    harness.resize({ width: 60, height: 20 });
    await harness.key(redrawKey());
    expect(harness.effects).to.eql(settled);

    await harness.reporter.dispose();
  });
});

/**
 * Helpers:
 */
type ReporterMode = 'raw' | 'screen';
type ScreenSize = { readonly width: number; readonly height: number };
type KeyboardOptions = Parameters<typeof Cli.Keyboard.bind>[0];
type KeyEvent = Parameters<NonNullable<KeyboardOptions['onKey']>>[0];

function readyBody() {
  const render = (width: number) => `\nbody:${width}\n`;
  return {
    text: formatStartServiceBody(render, 80),
    render: (options?: { width?: number; hyperlinks?: boolean }) => {
      return formatStartServiceBody(render, options?.width);
    },
  } as const;
}

function readyProbe() {
  const calls: { width?: number; hyperlinks?: boolean }[] = [];
  return {
    calls,
    input: {
      text: 'plain',
      render(options?: { width?: number; hyperlinks?: boolean }) {
        calls.push({
          ...(options?.width === undefined ? {} : { width: options.width }),
          ...(options?.hyperlinks === undefined ? {} : { hyperlinks: options.hyperlinks }),
        });
        return options?.hyperlinks ? 'linked' : 'rendered';
      },
    },
  } as const;
}

function createHarness(
  mode: ReporterMode,
  options: {
    acceptFailure?: boolean;
    cancelError?: Error;
    controls?: boolean;
    header?: string;
    keyboard?: 'acquired' | 'unavailable';
    measure?: () => ScreenSize;
    onRepaint?: (frame: string) => void;
    printError?: Error;
    repaintError?: Error;
    releaseError?: Error;
    resizeOnObserve?: ScreenSize;
    shutdownError?: Error;
    size?: ScreenSize;
    stopError?: Error;
    terminal?: boolean;
  } = {},
) {
  const effects: string[] = [];
  const failures: unknown[] = [];
  const frames: string[] = [];
  const spinner = FakeSpinner.create();
  const start = spinner.start;
  const stop = spinner.stop;
  let currentSize = options.size ?? { width: 80, height: 24 };
  let printError = options.printError;
  let repaintError = options.repaintError;
  let keyboardOptions: KeyboardOptions | undefined;
  let onResize: (size: ScreenSize) => void = () => {};
  let resolveKeyboard: () => void = () => undefined;
  let rejectKeyboard: (cause: unknown) => void = () => undefined;
  let keyboardDisposed = false;
  const keyboardFinished = new Promise<void>((resolve, reject) => {
    resolveKeyboard = resolve;
    rejectKeyboard = reject;
  });
  const keyboard = {
    finished: keyboardFinished,
    dispose() {
      if (keyboardDisposed) return;
      keyboardDisposed = true;
      effects.push('keyboard:dispose');
      resolveKeyboard();
    },
  };

  spinner.start = (text) => {
    effects.push(`spinner:start:${text ?? spinner.text}`);
    return start(text);
  };
  spinner.stop = () => {
    effects.push('spinner:stop');
    if (options.stopError) throw options.stopError;
    return stop();
  };

  const reporter = StartReporter.create(
    mode,
    {
      isInteractive: () => true,
      isTerminal: () => options.terminal ?? true,
      print(text) {
        effects.push(`print:${text}`);
        if (printError) throw printError;
      },
      header: (width) => options.header ?? `header:${width ?? 'raw'}`,
      startText: (count) => `starting:${count}`,
      size: () => options.measure?.() ?? currentSize,
      observeResize(handler) {
        effects.push('screen:observe');
        onResize = handler;
        if (options.resizeOnObserve) handler(options.resizeOnObserve);
        return () => {
          effects.push('screen:release');
          if (options.releaseError) throw options.releaseError;
        };
      },
      repaint(frame) {
        effects.push(`repaint:${frame}`);
        frames.push(frame);
        options.onRepaint?.(frame);
        if (repaintError) throw repaintError;
      },
      spinner: (target) => {
        effects.push(`spinner:create:${target ?? 'raw'}`);
        return spinner;
      },
      interval: () => {
        effects.push('interval:start');
        return () => {
          effects.push('interval:cancel');
          if (options.cancelError) throw options.cancelError;
        };
      },
      bindKeyboard(input) {
        effects.push('keyboard:bind');
        keyboardOptions = input;
        return options.keyboard === 'unavailable' ? undefined : keyboard;
      },
      async shutdownKeyboard(owner) {
        effects.push('keyboard:shutdown');
        owner.dispose();
        await owner.finished;
        if (options.shutdownError) throw options.shutdownError;
      },
    },
    options.controls
      ? {
        until: new Promise<never>(() => undefined),
        onInterrupt: () => effects.push('keyboard:interrupt'),
        onFailure(cause) {
          failures.push(cause);
          effects.push('keyboard:failure');
          return options.acceptFailure ?? true;
        },
      }
      : undefined,
  );

  return {
    reporter,
    effects,
    failures,
    frames,
    binding: () => keyboardOptions,
    async key(event: Partial<KeyEvent>) {
      await keyboardOptions?.onKey?.(event as KeyEvent);
    },
    async interrupt() {
      await keyboardOptions?.onQuit();
      keyboardDisposed = true;
      resolveKeyboard();
      await Promise.resolve();
    },
    finishKeyboard() {
      keyboardDisposed = true;
      resolveKeyboard();
    },
    failKeyboard(cause: unknown) {
      keyboardDisposed = true;
      rejectKeyboard(cause);
    },
    resize(size: ScreenSize) {
      currentSize = size;
      onResize(size);
    },
    setPrintError(cause?: Error) {
      printError = cause;
    },
    setRepaintError(cause?: Error) {
      repaintError = cause;
    },
    setSize(size: ScreenSize) {
      currentSize = size;
    },
  } as const;
}

function keyEvent(key: string, overrides: Partial<KeyEvent> = {}): Partial<KeyEvent> {
  return {
    key,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    ...overrides,
  };
}

function redrawKey(overrides: Partial<KeyEvent> = {}): Partial<KeyEvent> {
  return keyEvent('r', overrides);
}
