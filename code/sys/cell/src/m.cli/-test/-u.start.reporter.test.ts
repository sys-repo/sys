import { FakeSpinner } from '@sys/cli/testing';
import { describe, expect, it } from '../../-test.ts';
import { Cli } from '../common.ts';
import { StartReporter } from '../u/u.start.reporter.ts';
import { formatStartServiceBody } from '../u/u.start.ts';

describe('@sys/cell/cli start reporter', () => {
  it('resolves automatic and explicit reporter modes truthfully', () => {
    expect(StartReporter.resolve('auto', { isInteractive: () => true })).to.eql('screen');
    expect(StartReporter.resolve('auto', { isInteractive: () => false })).to.eql('raw');
    expect(StartReporter.resolve('raw', { isInteractive: () => true })).to.eql('raw');
    expect(() => StartReporter.resolve('screen', { isInteractive: () => false })).to.throw(
      "Cell start reporter 'screen' requires an interactive terminal.",
    );
  });

  it('raw → preserves append-only header, body, and summary ordering', () => {
    const harness = createHarness('raw');
    const reporter = harness.reporter;

    reporter.open();
    reporter.starting(2);
    reporter.ready(readyBody());
    reporter.complete('summary');
    reporter.dispose();
    reporter.dispose();

    expect(harness.effects).to.eql([
      'print:header:raw',
      'print:\n  body:76',
      'print:\nsummary',
    ]);
  });

  it('raw → omits an absent identity header without changing append-only ordering', () => {
    const harness = createHarness('raw', { header: '' });
    const reporter = harness.reporter;

    reporter.open();
    reporter.ready(readyBody());
    reporter.complete('summary');
    reporter.dispose();

    expect(harness.effects).to.eql([
      'print:  body:76',
      'print:\nsummary',
    ]);
  });

  it('propagates stdout hyperlink policy independently from reporter mode and width', () => {
    const rawTerminal = createHarness('raw', { header: '', terminal: true });
    const rawTerminalReady = readyProbe();
    rawTerminal.reporter.open();
    rawTerminal.reporter.ready(rawTerminalReady.input);
    expect(rawTerminalReady.calls).to.eql([{ hyperlinks: true }]);
    expect(rawTerminal.effects).to.eql(['print:linked']);
    rawTerminal.reporter.dispose();

    const rawRedirected = createHarness('raw', { header: '', terminal: false });
    const rawRedirectedReady = readyProbe();
    rawRedirected.reporter.open();
    rawRedirected.reporter.ready(rawRedirectedReady.input);
    expect(rawRedirectedReady.calls).to.eql([]);
    expect(rawRedirected.effects).to.eql(['print:plain']);
    rawRedirected.reporter.dispose();

    const screen = createHarness('screen', { terminal: true });
    const screenReady = readyProbe();
    screen.reporter.open();
    screen.reporter.ready(screenReady.input);
    expect(screenReady.calls).to.eql([{ width: 80, hyperlinks: true }]);
    screen.reporter.dispose();
  });

  it('screen → repaints one responsive startup-to-complete frame', () => {
    const harness = createHarness('screen');
    const reporter = harness.reporter;

    reporter.open();
    reporter.starting(2);
    harness.resize({ width: 50, height: 20 });
    reporter.ready(readyBody());
    reporter.complete('summary');
    reporter.dispose();
    reporter.dispose();

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

  it('screen → uses the first row for body content when identity is absent', () => {
    const harness = createHarness('screen', { header: '' });
    const reporter = harness.reporter;

    reporter.open();
    reporter.ready(readyBody());
    reporter.complete('summary');

    const frame = harness.effects.filter((effect) => effect.startsWith('repaint:')).at(-1) ?? '';
    expect(frame).to.eql('repaint:  body:76\n\nsummary');

    reporter.dispose();
  });

  it('screen → spends tiny anonymous frames on content before separators', () => {
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

      reporter.dispose();
    }
  });

  it('screen → adopts a synchronous viewport observed during acquisition', () => {
    const harness = createHarness('screen', {
      resizeOnObserve: { width: 36, height: 12 },
    });

    harness.reporter.open();
    harness.reporter.dispose();

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

  it('screen → bounds every completed frame row to the current viewport', () => {
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

    reporter.dispose();
  });

  it('screen → releases an active startup spinner and observer exactly once', () => {
    const harness = createHarness('screen');
    const reporter = harness.reporter;

    reporter.open();
    reporter.starting(1);
    reporter.dispose();
    reporter.dispose();

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

  it('screen → ignores resize and phase effects after disposal', () => {
    const harness = createHarness('screen');
    const reporter = harness.reporter;

    reporter.open();
    reporter.dispose();
    const settled = [...harness.effects];

    harness.resize({ width: 40, height: 10 });
    reporter.starting(1);
    reporter.ready({ text: 'body', render: () => 'body' });
    reporter.complete('summary');

    expect(harness.effects).to.eql(settled);
  });
});

/**
 * Helpers:
 */
type ReporterMode = 'raw' | 'screen';
type ScreenSize = { readonly width: number; readonly height: number };

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
    header?: string;
    repaintError?: Error;
    resizeOnObserve?: ScreenSize;
    size?: ScreenSize;
    terminal?: boolean;
  } = {},
) {
  const effects: string[] = [];
  const spinner = FakeSpinner.create();
  const start = spinner.start;
  const stop = spinner.stop;
  let onResize: (size: ScreenSize) => void = () => {};

  spinner.start = (text) => {
    effects.push(`spinner:start:${text ?? spinner.text}`);
    return start(text);
  };
  spinner.stop = () => {
    effects.push('spinner:stop');
    return stop();
  };

  const reporter = StartReporter.create(mode, {
    isInteractive: () => true,
    isTerminal: () => options.terminal ?? true,
    print: (text) => effects.push(`print:${text}`),
    header: (width) => options.header ?? `header:${width ?? 'raw'}`,
    startText: (count) => `starting:${count}`,
    size: () => options.size ?? { width: 80, height: 24 },
    observeResize(handler) {
      effects.push('screen:observe');
      onResize = handler;
      if (options.resizeOnObserve) handler(options.resizeOnObserve);
      return () => effects.push('screen:release');
    },
    repaint(frame) {
      effects.push(`repaint:${frame}`);
      if (options.repaintError) throw options.repaintError;
    },
    spinner: (target) => {
      effects.push(`spinner:create:${target ?? 'raw'}`);
      return spinner;
    },
    interval: () => {
      effects.push('interval:start');
      return () => effects.push('interval:cancel');
    },
  });

  return {
    reporter,
    effects,
    resize(size: ScreenSize) {
      onResize(size);
    },
  } as const;
}
