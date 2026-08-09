import { c, Cli } from '@sys/cli';
import { HashFmt } from '@sys/crypto/fmt';
import { describe, expect, it, Rx, type t } from '../../-test.ts';
import { DistServeScreen } from '../u.server/u.serve.screen.ts';
import { setup, teardown } from './u.fixture.ts';

describe('DistServeScreen', () => {
  it('bottom-docks compact keyboard controls below a separate divider', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      const raw = DistServeScreen.toString({
        pkg: dist.pkg,
        origin: 'http://127.0.0.1:49152/' as t.StringUrl,
        dir: './dist' as t.StringDir,
        authority: { kind: 'pinned', integrity: fixture.integrity },
        evidence: evidence(fixture),
        renderedAt: dist.build.time,
        viewport: { width: 120, height: 30 },
        cursorRows: 1,
        keyboard: { enabled: true, print: true },
      });
      const output = text(raw);

      expect(output).to.include('@sample/foo');
      expect(output).to.include('http://localhost:49152/');
      expect(raw).to.include(Cli.Fmt.Url.service(
        { href: 'http://localhost:49152/' as t.StringUrl },
        { highlightOrigin: true },
      ));
      expect(output).to.include('./dist/');
      expect(raw).to.include(c.green('static'));
      expect(raw).to.not.include(c.white('static'));
      expect(output).to.include(text(HashFmt.digest(dist.hash.digest)));
      expect(output).to.not.include(dist.hash.digest);
      expect(output).to.include(`pinned ${fixture.integrity}`);
      expect(raw).to.include(c.white('authority'));
      expect(raw).to.not.include(c.gray(`pinned ${fixture.integrity}`));
      expect(output).to.include('serving pinned Dist on HTTP server…');
      const lines = output.split('\n');
      const staticRow = lines.find((line) => line.includes('static')) ?? '';
      const authorityRow = lines.find((line) => line.includes('authority')) ?? '';
      expect(staticRow.indexOf('./dist/')).to.eql(authorityRow.indexOf('pinned'));
      expect(authorityRow.slice(
        authorityRow.indexOf('authority') + 'authority'.length,
        authorityRow.indexOf('pinned'),
      )).to.eql('  ');
      expect(lines.at(-2)).to.include('┄');
      expect(lines.at(-1)).to.include('open: o (in browser)');
      expect(lines.at(-1)).to.include('quit: ctrl + c or q');
    } finally {
      await teardown(fixture);
    }
  });

  it('renders explicit local UNPINNED vocabulary and suppresses disabled keyboard rows', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      const raw = DistServeScreen.toString({
        pkg: dist.pkg,
        origin: 'http://127.0.0.1:49152/' as t.StringUrl,
        dir: fixture.source as t.StringDir,
        authority: { kind: 'local-unpinned', integrity: fixture.integrity },
        evidence: evidence(fixture),
        renderedAt: dist.build.time,
        viewport: { width: 120, height: 30 },
        cursorRows: 1,
        keyboard: { enabled: false, print: true },
      });
      const output = text(raw);

      expect(output).to.include('local · UNPINNED');
      expect(raw).to.include(c.white('authority'));
      expect(raw).to.include(c.dim(c.gray('·')));
      expect(raw).to.include(c.yellow(c.bold('UNPINNED')));
      expect(output).to.include('serving locally verified Dist (UNPINNED) on HTTP server…');
      expect(output).to.not.include('open:');
      expect(output).to.not.include('quit:');
    } finally {
      await teardown(fixture);
    }
  });

  it('subscribes before measurement, repaints accepted resize, and disposes once', async () => {
    const fixture = await setup();
    try {
      const initial = { width: 80, height: 24 };
      const accepted = { width: 36, height: 15 };
      const terminal = createTerminalHarness({ viewport: initial, resizeOnSize: accepted });
      const until = new AbortController().signal;
      const screen = createReporter(fixture, terminal.deps, until);

      expect(terminal.until).to.equal(until);
      expect(terminal.sizeCalls).to.eql(1);
      expect(text(terminal.repaints[0] ?? '').split('\n')[1]).to.eql(
        '━'.repeat(accepted.width),
      );

      const resized = { width: 44, height: 18 };
      terminal.resize(resized);
      expect(terminal.repaints).to.have.length(2);
      expect(text(terminal.repaints.at(-1) ?? '').split('\n')[1]).to.eql(
        '━'.repeat(resized.width),
      );

      screen.dispose();
      screen.dispose();
      expect(terminal.disposeCalls).to.eql(1);
      expect(terminal.events.disposed).to.eql(true);

      terminal.resize(initial);
      expect(terminal.repaints).to.have.length(2);
    } finally {
      await teardown(fixture);
    }
  });

  it('stays inert when terminal observation is already disposed', async () => {
    const fixture = await setup();
    try {
      const terminal = createTerminalHarness({ disposed: true });
      const screen = createReporter(fixture, terminal.deps);

      screen.dispose();
      expect(terminal.sizeCalls).to.eql(0);
      expect(terminal.repaints).to.eql([]);
      expect(terminal.disposeCalls).to.eql(0);
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves initial and resize repaint failures over cleanup failures', async () => {
    const fixture = await setup();
    try {
      const initialCause = new Error('initial-repaint-failed');
      const initial = createTerminalHarness({
        disposeError: new Error('initial-cleanup-failed'),
        repaint: () => {
          throw initialCause;
        },
      });
      let initialThrown: unknown;
      try {
        createReporter(fixture, initial.deps);
      } catch (cause) {
        initialThrown = cause;
      }
      expect(initialThrown).to.equal(initialCause);
      expect(initial.disposeCalls).to.eql(1);

      const resizeCause = new Error('resize-repaint-failed');
      const resize = createTerminalHarness({
        disposeError: new Error('resize-cleanup-failed'),
        repaint: (_frame, count) => {
          if (count === 2) throw resizeCause;
        },
      });
      const screen = createReporter(fixture, resize.deps);
      const failure = screen.failure.catch((cause) => cause);
      resize.resize({ width: 44, height: 18 });

      expect(await failure).to.equal(resizeCause);
      expect(resize.disposeCalls).to.eql(1);
      screen.dispose();
      expect(resize.disposeCalls).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });

  it('collapses the digest against its remaining Dist-row width', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      const outputRow = (width: number) => {
        const output = text(DistServeScreen.toString({
          pkg: dist.pkg,
          origin: 'http://127.0.0.1:49152/' as t.StringUrl,
          dir: './dist' as t.StringDir,
          authority: { kind: 'local-unpinned', integrity: fixture.integrity },
          evidence: evidence(fixture),
          renderedAt: dist.build.time,
          viewport: { width, height: 30 },
          cursorRows: 1,
          keyboard: { enabled: false, print: true },
        }));
        return output.split('\n').find((line) => line.includes('dist')) ?? '';
      };
      const suffix = `#${dist.hash.digest.slice(-5)}`;

      expect(outputRow(60)).to.include(`dist/ ← digest:sha256:${suffix}`);
      expect(outputRow(44)).to.include(`dist/ ← sha256:${suffix}`);
      expect(outputRow(37)).to.include(`dist/ ← ${suffix}`);
      expect(outputRow(31)).to.not.include('←');
    } finally {
      await teardown(fixture);
    }
  });

  it('bounds every rendered row across compact-width transitions and tiny viewports', async () => {
    const fixture = await setup();
    try {
      const frame = (width: number, height = 30) =>
        DistServeScreen.toString({
          pkg: fixture.cloneDist().pkg,
          origin: 'http://127.0.0.1:49152/' as t.StringUrl,
          dir: fixture.source as t.StringDir,
          authority: { kind: 'local-unpinned', integrity: fixture.integrity },
          evidence: evidence(fixture),
          renderedAt: fixture.cloneDist().build.time,
          viewport: { width, height },
          cursorRows: 1,
          keyboard: { enabled: true, print: true },
        });

      for (const width of [0, 1, 24, 79, 80, 81, 120]) {
        const output = frame(width, width < 24 ? 3 : 30);
        for (const line of output.split('\n')) {
          expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(width);
        }
      }

      expect(frame(81)).to.eql(frame(81));
      const digestTail = `#${fixture.cloneDist().hash.digest.slice(-5)}`;
      expect(text(frame(79))).to.include(digestTail);
      expect(text(frame(24))).to.not.include('open:');
      expect(text(frame(120, 12))).to.not.include('open:');
    } finally {
      await teardown(fixture);
    }
  });
});

type Fixture = Awaited<ReturnType<typeof setup>>;

function evidence(fixture: Fixture): t.FsPkg.Dist.Verify.Evidence {
  const dist = fixture.cloneDist();
  return {
    integrity: fixture.integrity,
    manifestBytes: fixture.manifestBytes.byteLength,
    dist,
    assets: {
      files: Object.keys(dist.hash.parts).length,
      totalBytes: dist.build.size.total,
      packageBytes: dist.build.size.pkg,
    },
  };
}

function text(input: string) {
  return Cli.stripAnsi(input);
}

type ScreenTerminal = {
  readonly cursorRows: number;
  size(): t.Cli.Screen.Size;
  events(until?: t.UntilInput): t.Cli.Screen.Events;
  repaint(frame: string): void;
};

function createReporter(
  fixture: Fixture,
  terminal: ScreenTerminal,
  until?: t.UntilInput,
) {
  const dist = fixture.cloneDist();
  return DistServeScreen.create({
    pkg: dist.pkg,
    origin: 'http://127.0.0.1:49152/' as t.StringUrl,
    dir: './dist' as t.StringDir,
    authority: { kind: 'local-unpinned', integrity: fixture.integrity },
    evidence: evidence(fixture),
    renderedAt: dist.build.time,
    terminal,
    until,
  });
}

function createTerminalHarness(
  options: {
    readonly viewport?: t.Cli.Screen.Size;
    readonly resizeOnSize?: t.Cli.Screen.Size;
    readonly disposed?: boolean;
    readonly disposeError?: unknown;
    readonly repaint?: (frame: string, count: number) => void;
  } = {},
) {
  let viewport = { ...(options.viewport ?? { width: 80, height: 24 }) };
  let until: t.UntilInput | undefined;
  let sizeCalls = 0;
  let disposeCalls = 0;
  const repaints: string[] = [];
  const lifecycle = Rx.lifecycle();
  const resize$$ = Rx.subject<t.Cli.Screen.SizeChanged>();
  const resize$ = resize$$.asObservable();
  const dispose: t.Disposable['dispose'] = (reason) => {
    disposeCalls += 1;
    lifecycle.dispose(reason);
    if (options.disposeError !== undefined) throw options.disposeError;
  };
  const events: t.Cli.Screen.Events = {
    get disposed() {
      return lifecycle.disposed;
    },
    dispose$: lifecycle.dispose$,
    dispose,
    [Symbol.dispose]() {
      dispose();
    },
    $: resize$,
    resize$,
  };
  if (options.disposed) lifecycle.dispose();

  const deps: ScreenTerminal = {
    cursorRows: 1,
    size() {
      const measured = { ...viewport };
      sizeCalls += 1;
      if (sizeCalls === 1 && options.resizeOnSize) {
        resize$$.next({
          kind: 'size:changed',
          before: measured,
          after: { ...options.resizeOnSize },
        });
      }
      return measured;
    },
    events(input) {
      until = input;
      return events;
    },
    repaint(frame) {
      repaints.push(frame);
      options.repaint?.(frame, repaints.length);
    },
  };

  return {
    deps,
    events,
    repaints,
    resize(next: t.Cli.Screen.Size) {
      const before = viewport;
      viewport = { ...next };
      resize$$.next({ kind: 'size:changed', before, after: { ...next } });
    },
    get until() {
      return until;
    },
    get sizeCalls() {
      return sizeCalls;
    },
    get disposeCalls() {
      return disposeCalls;
    },
  };
}
