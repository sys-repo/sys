import { c, Cli, describe, expect, it, Str, stripAnsi, type t } from './common.ts';
import { resolveBrowserTargets } from '../u.lifecycle/u.browser.targets.ts';
import { StartReporter } from '../u.lifecycle/u.start.reporter.ts';
import {
  formatStartHeader,
  resolveStartPresentation,
  startCellReady,
  toStartResult,
} from '../u.lifecycle/u.start.ts';
import { serviceInput } from './u.fixture.services.ts';
import {
  createHarness,
  keyEvent,
  readyBody,
  readyProbe,
  resizeFrameRows,
} from './u.fixture.start-reporter.ts';

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
      expect(screenReady.calls.map(({ width, maxRows, hyperlinks }) => ({
        width,
        maxRows,
        hyperlinks,
      }))).to.eql([{ width: 80, maxRows: 23, hyperlinks: true }]);
      await screen.reporter.dispose();
    });
  });

  it('links the caller release only in opted-in terminal headers and repaints it as a unit', async () => {
    const version = '0.0.51';
    const pkg = { name: '@sys/ui', version };
    const { header, result } = startHeaderFixture({ pkg, versionLink: 'jsr' });
    const url = new URL('https://jsr.io/@sys/ui@0.0.51');
    const linked = Cli.Fmt.hyperlink(version, url, { underline: true });
    pkg.name = '@other/app';
    pkg.version = '9.9.9';

    for (const terminal of [true, false]) {
      await using raw = createHarness('raw', { header, terminal });
      raw.reporter.open();
      expect(raw.effects).to.have.length(1);
      const [title, rule] = raw.effects[0].split('\n');
      expect(stripAnsi(title).trimEnd().split(/\s+/)).to.eql(['print:sys.ui', version]);
      expect(stripAnsi(rule)).to.eql('━'.repeat(80));
      expect(title.includes(linked)).to.eql(terminal);
      expect(raw.effects[0].replace(linked, '')).not.to.contain('\x1b]8;;');
    }

    await using screen = createHarness('screen', { header });
    screen.reporter.open();
    for (const width of [80, 8, 80]) {
      screen.resize({ width, height: 24 });
      const [title, rule, ...rest] = screen.frames.at(-1)!.split('\n');
      const words = width === 80 ? ['sys.ui', version] : ['sys.ui'];
      expect(stripAnsi(title).trim().split(/\s+/)).to.eql(words);
      expect(title.includes(linked)).to.eql(width === 80);
      expect(title.replace(linked, '')).not.to.contain('\x1b]8;;');
      expect(stripAnsi(rule)).to.eql('━'.repeat(width));
      expect(rule).not.to.contain('\x1b]8;;');
      expect(Cli.Fmt.Text.Width.measure(title)).to.be.at.most(width);
      expect(rest).to.eql([]);
    }

    expect(startHeaderFixture({ pkg }).header(80, true)).not.to.contain('\x1b]8;;');
    const { identity, text } = result();
    expect(identity).to.eql({ name: 'sys.ui', version });
    expect(text).not.to.contain('\x1b]8;;');
    expect(stripAnsi(text).split('\n')[0].endsWith(version)).to.eql(true);
  });

  it('treats a preformatted version as data even without release navigation', async () => {
    const version = Cli.Fmt.hyperlink('1.2.3', new URL('https://example.org/'));
    const { header, result } = startHeaderFixture({ pkg: { name: '@sys/ui', version } });
    for (const terminal of [false, true]) {
      await using raw = createHarness('raw', { header, terminal });
      raw.reporter.open();
      expect(stripAnsi(raw.effects[0])).to.contain('invalid version');
      expect(raw.effects[0]).not.to.contain('\x1b]8;;');
    }
    const { text } = result();
    expect(stripAnsi(text)).to.contain('invalid version');
    expect(text).not.to.contain('\x1b]8;;');
  });

  describe('raw output', () => {
    it('prints both complete services even at one terminal row', async () => {
      const input = startCellReady(twoServices(), false);
      const saved = stripAnsi(input.text);
      const rows = saved.split('\n').map((line) => line.trim());
      for (const [offset, name] of [[0, 'A'], [5, 'B']] as const) {
        expect(rows.slice(offset, offset + 4).join('\n')).to.eql(Str.dedent(`
          service   ${name}
          module   module-${name}
          hint     ${name}
          url      https://${name.toLowerCase()}.test/
        `));
      }
      for (const terminal of [true, false]) {
        const raw = createHarness('raw', { terminal, header: '', size: { width: 44, height: 1 } });
        try {
          raw.reporter.open();
          raw.reporter.ready(input);
          expect(raw.effects.map(stripAnsi)).to.eql([`print:${saved}`]);
        } finally {
          await raw.reporter.dispose();
        }
      }
    });

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

  describe('adaptive ready footer', () => {
    it('sheds detail, then the footer, then protected rows without bringing rows back', async () => {
      const width = 80;
      await using screen = createHarness('screen', { header: 'header', controls: true });
      screen.reporter.open();
      screen.reporter.ready(adaptiveReadyBody());

      const frameAt = (room: number) => resizeFrameRows(screen, { width, height: room + 1 });
      const rooms = [9, 8, 7, 6, 5, 4];
      const frames = rooms.map(frameAt);
      const [twoDetails, oneDetail, withFooter, handoff, protectedOnly, compact] = frames;
      const remainingFacts = ['first', 'extra', 'beta', 'second'];
      expect(serviceFacts(twoDetails.slice(1, -2))).to.eql([
        'alpha',
        'line-one',
        'line-two',
        ...remainingFacts,
      ]);
      expect(serviceFacts(oneDetail.slice(1, -2))).to.eql(['alpha', 'line-one', ...remainingFacts]);
      expect(serviceFacts(withFooter.slice(1, -2))).to.eql(['alpha', ...remainingFacts]);
      expect(serviceFacts(compact.slice(1))).to.eql(['alpha', 'first', 'beta', 'second']);

      expect(withFooter.slice(-2)).to.eql(['┄'.repeat(width), 'quit: q'.padStart(width)]);
      expect(handoff).to.eql(withFooter.slice(0, -2));
      expect(protectedOnly).to.eql(handoff);
      expect(rooms.toReversed().map(frameAt)).to.eql(frames.toReversed());
    });

    it('moves the footer handoff with the protected-row preference', async () => {
      await using screen = createHarness('screen', {
        header: 'header',
        controls: true,
        preferredServiceRows: 3,
      });
      screen.reporter.open();
      screen.reporter.ready(adaptiveReadyBody());

      const width = 120;
      const [withFooter, atHandoff, protectedOnly] = [6, 5, 4].map((height) =>
        resizeFrameRows(screen, { width, height })
      );
      expect(withFooter.slice(-2)).to.eql(['┄'.repeat(width), 'quit: q'.padStart(width)]);
      expect(serviceFacts(withFooter.slice(1, -2))).to.eql(['alpha', 'first', 'beta']);
      expect(atHandoff).to.eql(withFooter.slice(0, -2));
      expect(protectedOnly).to.eql(atHandoff);
    });

    it('leaves all available rows to services when the footer cannot fit the width', async () => {
      const input = adaptiveReadyBody();
      await using screen = createHarness('screen', { header: 'header', controls: true });
      screen.reporter.open();
      screen.reporter.ready(input);

      const rows = resizeFrameRows(screen, { width: 6, height: 7 });
      const body = stripAnsi(input.render({ width: 6, maxRows: 6 }));
      expect(rows).to.eql(['header', ...body.split('\n')]);
    });

    it('keeps service rows and quit when a styled footer exceeds the output budget', async () => {
      const width = 65_535;
      const detail = Str.dedent(`
        one
        two
        three
        four
        five
        six
      `);
      const input = startCellReady([{
        name: 'A',
        status: { state: 'ready', details: [{ label: 'detail', value: detail }] },
      }], false);
      await using screen = createHarness('screen', {
        header: '',
        controls: true,
        size: { width, height: 6 },
      });
      screen.reporter.open();

      const frames = withAnsi(() => {
        screen.reporter.ready(input);
        const six = stripAnsi(screen.frames.at(-1) ?? '').split('\n');
        const seven = resizeFrameRows(screen, { width, height: 7 });
        return [six, seven];
      });
      expect(screen.failures).to.eql([]);
      const bodyRows = (maxRows: number) => stripAnsi(input.render({ width, maxRows })).split('\n');
      expect(frames).to.eql([bodyRows(6), bodyRows(7)]);
      await screen.key(keyEvent('q'));
      expect(screen.effects).to.contain('keyboard:quit');
    });

    it('reserves only the available service rows and lets warnings take precedence', async () => {
      const services = ['alpha', 'beta', 'gamma'].map((name) => ({ name }));
      const input = {
        ...startCellReady(services, false),
        browser: {
          targets: [],
          diagnostics: [{ service: 'alpha', pathname: '/missing', matches: 0 }],
        },
      };
      await using screen = createHarness('screen', { header: '', controls: true });
      screen.reporter.open();
      screen.reporter.ready(input);
      const withFooter = resizeFrameRows(screen, { width: 80, height: 6 });
      const withoutFooter = resizeFrameRows(screen, { width: 80, height: 5 });
      expect(withFooter.at(-1)?.trim()).to.eql('quit: q');
      expect(withFooter[3]).to.contain('alpha /missing: no matching HTTP(S) URL');
      expect(withoutFooter).to.eql(withFooter.slice(0, -2));
    });
  });

  describe('screen frames', () => {
    it('marks service-local browser matches only on the ready screen', async () => {
      const origin = 'http://127.0.0.1:8080';
      const root = `${origin}/`;
      const a = `${origin}/other?a`;
      const b = `${origin}/other?b`;
      const published = [
        ['A', ['/', '/other'], [origin, a, b]],
        ['B', undefined, [root]],
        ['C', '/', [root]],
      ] as const;
      const sources = published.map(([service, pathnames, urls]) => ({
        service,
        pathnames,
        urls: urls.map((href) => ({ href })),
      }));
      const services: t.Cli.Fmt.Service.Input[] = sources.map(({ service, urls }) => ({
        name: service,
        status: { state: 'ready', urls },
      }));
      const input = startCellReady(services, false, resolveBrowserTargets(sources));

      await using screen = createHarness('screen', { header: '', controls: true });
      const urlRows = () =>
        screen.frames.at(-1)!.split('\n').flatMap((line) => {
          const [prefix, link] = line.split('\x1b]8;;');
          return link ? [[link.split('\x1b\\')[0], stripAnsi(prefix).endsWith('⦿ ')]] : [];
        });
      // The shared URL belongs to A, B and C in that order, but only A and C select it.
      const expected = [[root, true], [a, false], [b, false], [root, false], [root, true]];
      screen.reporter.open();
      screen.reporter.ready(input);
      expect(urlRows()).to.eql(expected);
      await screen.key(keyEvent('o'));
      const handoffs = screen.effects.filter((effect) => effect.startsWith('open:'));
      expect(handoffs).to.eql([`open:${root}`]);
      screen.reporter.complete('summary');
      expect(urlRows()).to.eql(expected.map(([href]) => [href, false]));
    });

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
      const services = [serviceInput({ handle })];
      const input = startCellReady(services, false);
      const wide = stripAnsi(input.render({ width: 80 }));
      const narrow = stripAnsi(input.render({ width: 32 }));
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

    it('reserves header and summary before selecting service rows on resize', async () => {
      const input = startCellReady(twoServices(), false);
      const screen = createHarness('screen', { header: 'header' });
      const full = input.render({ width: 44, hyperlinks: true }).split('\n');
      const [a, urlA, b, urlB] = full.filter((row) => /^\s*(service|url)\s/.test(stripAnsi(row)));
      const four = [a, urlA, b, urlB];
      const three = [a, urlA, b];
      try {
        screen.reporter.open();
        screen.reporter.ready(input);
        screen.reporter.complete('summary');
        for (const body of [four, three, [a, b], three, four]) {
          screen.resize({ width: 44, height: body.length + 2 });
          expect(screen.frames.at(-1)).to.eql(['header', ...body, 'summary'].join('\n'));
        }
        screen.resize({ width: 44, height: full.length + 4 });
        expect(screen.frames.at(-1)).to.eql(['header', '', ...full, '', 'summary'].join('\n'));
      } finally {
        await screen.reporter.dispose();
      }
    });

    it('validates hidden services before publishing a summary-only frame', async () => {
      for (const fail of [false, true]) {
        const cause = new Error('hidden service');
        let armed = false;
        const services = twoServices(({ detail }) => {
          if (armed && detail.value === 'B') throw cause;
          return undefined;
        });
        const input = startCellReady(services, false);
        const screen = createHarness('screen', {
          header: '',
          controls: true,
          size: { width: 44, height: 1 },
        });
        try {
          screen.reporter.open();
          screen.reporter.ready(input);
          expect(stripAnsi(screen.frames.at(-1)!)).to.match(/A \+1 more$/);
          const count = screen.frames.length;
          armed = fail;
          screen.reporter.complete('summary');
          if (fail) {
            expect(screen.failures[0]).to.equal(cause);
            expect(screen.frames).to.have.length(count);
          } else {
            expect(screen.failures).to.eql([]);
            expect(screen.frames.at(-1)).to.eql('summary');
          }
        } finally {
          await screen.reporter.dispose();
        }
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
      reporter.ready({ ...readyBody(), text: 'body-too-long', render: () => 'body-too-long' });
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

function withAnsi<T>(run: () => T): T {
  const enabled = c.getColorEnabled();
  try {
    c.setColorEnabled(true);
    return run();
  } finally {
    c.setColorEnabled(enabled);
  }
}

function serviceFacts(rows: string[]) {
  return rows.map((row) => row.trim().split(/\s+/).at(-1)?.replace('https://cell.test/', ''));
}

function adaptiveReadyBody() {
  const urls = (paths: string[]) => paths.map((path) => ({ href: `https://cell.test/${path}` }));
  return startCellReady([
    {
      name: 'alpha',
      status: {
        state: 'ready',
        urls: urls(['first', 'extra']),
        details: [{ label: 'detail', value: 'line-one\nline-two\nline-three\nline-four' }],
      },
    },
    { name: 'beta', status: { state: 'ready', urls: urls(['second']) } },
  ], false);
}

function startHeaderFixture(input: t.CellCli.Input) {
  const descriptor = { kind: 'cell', version: 1, name: 'sys.ui' } as const;
  const presentation = resolveStartPresentation(descriptor, input);
  return {
    header(width = 80, link = false) {
      return formatStartHeader(presentation, width, link);
    },
    result() {
      const started = { root: '/tmp/cell', services: 0, mode: 'default', serviceText: '' } as const;
      return toStartResult(input, started, presentation);
    },
  };
}

function twoServices(
  formatDetail?: t.Cli.Fmt.Service.FormatDetail,
): readonly t.Cli.Fmt.Service.Input[] {
  return ['A', 'B'].map((name) => ({
    name,
    module: `module-${name}`,
    status: {
      state: 'ready',
      details: [{ label: 'hint', value: name }],
      urls: [{ href: `https://${name}.test` }],
    },
    presentation: { formatDetail },
  }));
}
