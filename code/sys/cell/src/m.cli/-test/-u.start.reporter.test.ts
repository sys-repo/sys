import { describe, expect, it, Str } from '../../-test.ts';
import { Cli, stripAnsi, type t } from '../common.ts';
import { Fmt } from '../u.fmt/u.mod.ts';
import { StartReporter } from '../u.lifecycle/u.start.reporter.ts';
import { formatStartServiceBody, type StartCellReady } from '../u.lifecycle/u.start.ts';
import { startedService } from './u.fixture.services.ts';
import { createHarness, readyBody } from './u.fixture.start-reporter.ts';

describe('@sys/cell/cli start reporter', () => {
  describe('output policy', () => {
    it('resolves automatic and explicit reporter modes', () => {
      expect(StartReporter.resolve('auto', { isInteractive: () => true })).to.eql('screen');
      expect(StartReporter.resolve('auto', { isInteractive: () => false })).to.eql('raw');
      expect(StartReporter.resolve('raw', { isInteractive: () => true })).to.eql('raw');
      expect(() => StartReporter.resolve('screen', { isInteractive: () => false })).to.throw(
        "Cell start reporter 'screen' requires an interactive terminal.",
      );
    });

    it('selects hyperlinks from stdout terminal status, independently of mode and width', async () => {
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
  });

  describe('raw output', () => {
    it('appends header, body, and summary in order', async () => {
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

    it('omits an absent identity header without changing section order', async () => {
      const harness = createHarness('raw', { header: '' });
      const reporter = harness.reporter;

      reporter.open();
      reporter.ready(readyBody());
      reporter.complete('summary');
      await reporter.dispose();

      expect(harness.effects).to.eql(['print:  body:76', 'print:\nsummary']);
    });
  });

  describe('screen frames', () => {
    it('repaints one responsive startup-to-complete frame', async () => {
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

    it('preserves detail-authored trailing LF rows through ready, resize, and completion', async () => {
      const status: t.Service.Status = {
        state: 'ready',
        details: [{ label: 'shell', value: 'plain' }],
      };
      const handle = {
        status: () => status,
        servicePresentation: { formatDetail: () => 'one\n\n' },
      };
      const services = Fmt.Services.capture([startedService({ handle })]);
      const render: StartCellReady['render'] = (options = {}) => {
        const { hyperlinks } = options;
        const renderServices = (width: number | undefined) => {
          return Fmt.Services.started({ services, width, terminal: false, hyperlinks });
        };
        return formatStartServiceBody(renderServices, options.width, false);
      };
      const input = { text: render(), render };
      const wide = stripAnsi(render({ width: 80 }));
      const narrow = stripAnsi(render({ width: 32 }));
      for (const body of [stripAnsi(input.text), wide, narrow]) {
        const rows = body.split('\n');
        expect(rows.at(-3)).to.match(/one$/);
        expect(rows.slice(-2).map((row) => row.trim())).to.eql(['', '']);
      }

      const screen = createHarness('screen', { header: 'header' });
      const raw = createHarness('raw', { header: 'header', terminal: false });
      try {
        raw.reporter.open();
        raw.reporter.ready(input);
        raw.reporter.complete('summary');
        expect(raw.effects.map((effect) => stripAnsi(effect))).to.eql([
          'print:header',
          `print:\n${stripAnsi(input.text)}`,
          'print:\nsummary',
        ]);

        screen.reporter.open();
        screen.reporter.ready(input);
        const ready = stripAnsi(screen.frames.at(-1)!);
        screen.resize({ width: 32, height: 24 });
        const resized = stripAnsi(screen.frames.at(-1)!);
        screen.reporter.complete('\nsummary\n');
        const completed = stripAnsi(screen.frames.at(-1)!);
        expect({ ready, resized, completed }).to.eql({
          ready: `header\n\n${wide}`,
          resized: `header\n\n${narrow}`,
          completed: `header\n\n${narrow}\n\nsummary`,
        });

        // Short viewports prioritize content over reporter-added separators.
        screen.resize({ width: 32, height: 4 });
        const clippedBody = narrow.split('\n').slice(0, 2).join('\n');
        expect(stripAnsi(screen.frames.at(-1)!)).to.eql(`header\n${clippedBody}\nsummary`);
      } finally {
        await screen.reporter.dispose();
        await raw.reporter.dispose();
      }
    });

    it('uses the first row for body content when identity is absent', async () => {
      const harness = createHarness('screen', { header: '' });
      const reporter = harness.reporter;

      reporter.open();
      reporter.ready(readyBody());
      reporter.complete('summary');

      const frame = stripAnsi(harness.frames.at(-1) ?? '');
      expect(frame).to.eql(Str.dedent(`
          body:76

        summary
      `));

      await reporter.dispose();
    });

    it('spends tiny anonymous frames on content before separators', async () => {
      const cases = [
        { height: 1, frame: 'summary' },
        {
          height: 2,
          frame: Str.dedent(`
              body:16
            summary
          `),
        },
        {
          height: 3,
          frame: Str.dedent(`
              body:16

            summary
          `),
        },
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

        const frame = stripAnsi(harness.frames.at(-1) ?? '');
        expect(frame).to.eql(item.frame);

        await reporter.dispose();
      }
    });

    it('uses a viewport reported synchronously when observation begins', async () => {
      const harness = createHarness('screen', { resizeOnObserve: { width: 36, height: 12 } });

      harness.reporter.open();
      await harness.reporter.dispose();

      expect(harness.effects).to.eql(['screen:observe', 'repaint:header:36', 'screen:release']);
    });

    it('bounds every completed frame row to the current viewport', async () => {
      const harness = createHarness('screen', { size: { width: 8, height: 4 } });
      const reporter = harness.reporter;

      reporter.open();
      reporter.ready({ text: 'body-too-long', render: () => 'body-too-long' });
      reporter.complete('summary');

      const frame = harness.frames.at(-1) ?? '';
      const rows = frame.split('\n');
      expect(rows.length).to.be.at.most(4);
      for (const row of rows) expect(Cli.Fmt.Text.Width.measure(row)).to.be.at.most(8);
      expect(frame).to.contain(Cli.Fmt.omission());
      expect(frame).to.contain('summary');

      await reporter.dispose();
    });
  });
});

/** Record the reporter's render options without doing layout. */
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
