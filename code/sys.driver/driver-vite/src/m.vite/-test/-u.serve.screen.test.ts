import { Cli, describe, expect, it, Str } from '../../-test.ts';
import { type t } from '../common.ts';
import { ServeScreen } from '../u/u.serve.screen.ts';

const RENDERED_AT = 1_750_000_000_000 as t.UnixTimestamp;

describe('ServeScreen', () => {
  it('renders the shared screen grammar with a truthful static-build row', () => {
    const text = Cli.stripAnsi(ServeScreen.toString({
      pkg: { name: '@sys/driver-vite/serve-screen-test', version: '0.0.0' },
      origin: 'http://127.0.0.1:4321/' as t.StringUrl,
      static: {
        kind: 'directory',
        dir: './dist' as t.StringDir,
        dist: {
          hash: { digest: 'sha256-1234567890abcdef' },
          build: { time: RENDERED_AT },
        } as t.DistPkg,
      },
      viewport: { width: 40, height: 20 },
      cursorRows: 1,
      renderedAt: RENDERED_AT,
    }));

    expect(text).to.eql(
      Str.dedent(`
      @sys/driver-vite/serve-screen-test 0.0.0
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

          http://localhost:4321/
          ↑
          static   dist/ ← sha256:#bcdef · 0ms

      ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
       1  out  serving build on HTTP server…

          open     o ← (in browser)
          quit     ctrl + c or q
    `).trim(),
    );
  });

  it('selects one truthful parent-owned row for every static snapshot', () => {
    const cases: readonly {
      readonly static: t.ViteServe.Static.Snapshot;
      readonly row: string;
      readonly metadata: string;
    }[] = [
      {
        static: { kind: 'directory', dir: './static' as t.StringDir },
        row: '1  out  serving static files on HTTP server…',
        metadata: 'static   static/',
      },
      {
        static: { kind: 'missing', dir: './不存在' as t.StringDir },
        row: '1  err  static directory does not exist',
        metadata: 'static   不存在/ (does not exist)',
      },
      {
        static: { kind: 'not-directory', dir: './bundle.zip' as t.StringDir },
        row: '1  err  static path is not a directory',
        metadata: 'static   bundle.zip/ (not a directory)',
      },
    ];

    for (const item of cases) {
      const text = plain({ static: item.static, viewport: { width: 80, height: 20 } });
      expect(text).to.include(item.metadata);
      expect(text).to.include(item.row);
    }
  });

  it('reprojects immutable semantic input across wide → narrow → wide viewports', () => {
    const staticSnapshot = {
      kind: 'directory',
      dir: './日本語/very/deep/output' as t.StringDir,
    } satisfies t.ViteServe.Static.Snapshot;
    const args = { static: staticSnapshot, viewport: { width: 100, height: 20 } };
    const wide = ServeScreen.toString(frame(args));
    const narrow = ServeScreen.toString(frame({ ...args, viewport: { width: 24, height: 20 } }));
    const repeatedWide = ServeScreen.toString(frame(args));

    expect(wide).to.eql(repeatedWide);
    expect(Cli.stripAnsi(narrow)).to.include('日本語');
    expect(staticSnapshot).to.eql({ kind: 'directory', dir: './日本語/very/deep/output' });
  });

  it('bounds every frame row at tiny viewport dimensions', () => {
    const staticSnapshot = { kind: 'missing', dir: './very/deep/static' as t.StringDir } as const;
    for (const width of [0, 1, 8, 24]) {
      for (const height of [0, 1, 2, 3, 4, 8]) {
        const output = ServeScreen.toString(frame({
          static: staticSnapshot,
          viewport: { width, height },
        }));
        const rows = output ? output.split('\n') : [];

        expect(rows.length <= Math.max(0, height - 1)).to.eql(true);
        for (const row of rows) {
          expect(Cli.Fmt.Text.Width.measure(row) <= width).to.eql(true);
        }
      }
    }
  });

  it('keeps URL, arrow, and static facts as one metadata unit under height pressure', () => {
    const staticSnapshot = { kind: 'directory', dir: './dist' as t.StringDir } as const;
    const partial = plain({ static: staticSnapshot, viewport: { width: 80, height: 5 } });
    const complete = plain({ static: staticSnapshot, viewport: { width: 80, height: 6 } });

    expect(partial).to.not.include('http://localhost:4321/');
    expect(partial).to.not.include('static');
    expect(complete).to.include('http://localhost:4321/');
    expect(complete).to.include('↑');
    expect(complete).to.include('static   dist/');
  });

  it('drops the TTY keyboard footer before status and core facts', () => {
    const staticSnapshot = { kind: 'directory', dir: './dist' as t.StringDir } as const;
    const constrained = plain({ static: staticSnapshot, viewport: { width: 80, height: 12 } });
    const complete = plain({ static: staticSnapshot, viewport: { width: 80, height: 13 } });

    expect(constrained).to.include('serving static files on HTTP server…');
    expect(constrained).to.not.include('open');
    expect(complete).to.include('open     o ← (in browser)');
    expect(complete).to.include('quit     ctrl + c or q');
  });

  describe('runtime', () => {
    it('subscribes before initial measurement and repaints accepted resize projections', () => {
      const terminal = createTerminal({ resizeOnSize: { width: 36, height: 15 } });
      const reporter = ServeScreen.create({
        pkg: packageInfo(),
        origin: 'http://localhost:4321/' as t.StringUrl,
        static: { kind: 'directory', dir: './dist' as t.StringDir },
        until: terminal.until,
        deps: { terminal: terminal.deps },
      });

      expect(terminal.untilSeen).to.equal(terminal.until);
      expect(Cli.stripAnsi(terminal.repaints[0] ?? '').split('\n')[1]).to.eql('━'.repeat(36));

      terminal.resize({ width: 24, height: 12 });
      expect(terminal.repaints.length).to.eql(2);
      expect(Cli.stripAnsi(terminal.repaints.at(-1) ?? '').split('\n')[1]).to.eql('━'.repeat(24));

      reporter.dispose();
    });

    it('remains inert when screen observation is already disposed', () => {
      const terminal = createTerminal({ disposed: true });
      const reporter = ServeScreen.create({
        pkg: packageInfo(),
        origin: 'http://localhost:4321/' as t.StringUrl,
        static: { kind: 'directory', dir: './dist' as t.StringDir },
        deps: { terminal: terminal.deps },
      });

      reporter.dispose();
      terminal.resize({ width: 24, height: 12 });
      expect(terminal.repaints).to.eql([]);
    });

    it('surfaces resize-render failure and releases terminal observation exactly once', async () => {
      const terminal = createTerminal();
      const reporter = ServeScreen.create({
        pkg: packageInfo(),
        origin: 'http://localhost:4321/' as t.StringUrl,
        static: { kind: 'directory', dir: './dist' as t.StringDir },
        deps: { terminal: terminal.deps },
      });
      const cause = new Error('resize-render-failed');
      terminal.failRepaint(cause);
      terminal.resize({ width: 24, height: 12 });

      let failure: unknown;
      try {
        await reporter.failure;
      } catch (error) {
        failure = error;
      }
      reporter.dispose();
      terminal.resize({ width: 20, height: 10 });

      expect(failure).to.equal(cause);
      expect(terminal.disposals).to.eql(1);
      expect(terminal.repaints.length).to.eql(1);
    });

    it('rolls back an initial repaint failure without masking it', () => {
      const terminal = createTerminal();
      const cause = new Error('initial-render-failed');
      terminal.failRepaint(cause);
      let failure: unknown;

      try {
        ServeScreen.create({
          pkg: packageInfo(),
          origin: 'http://localhost:4321/' as t.StringUrl,
          static: { kind: 'directory', dir: './dist' as t.StringDir },
          deps: { terminal: terminal.deps },
        });
      } catch (error) {
        failure = error;
      }

      expect(failure).to.equal(cause);
      expect(terminal.disposals).to.eql(1);
    });
  });
});

/**
 * Helpers:
 */
function frame(input: {
  readonly static: t.ViteServe.Static.Snapshot;
  readonly viewport: t.ViteServe.Screen.Frame.Viewport;
}): t.ViteServe.Screen.Frame.Args {
  return {
    pkg: packageInfo(),
    origin: 'http://127.0.0.1:4321/' as t.StringUrl,
    static: input.static,
    viewport: input.viewport,
    cursorRows: 1,
    renderedAt: RENDERED_AT,
  };
}

function plain(input: {
  readonly static: t.ViteServe.Static.Snapshot;
  readonly viewport: t.ViteServe.Screen.Frame.Viewport;
}) {
  return Cli.stripAnsi(ServeScreen.toString(frame(input)));
}

function packageInfo(): t.Pkg {
  return { name: '@sys/example', version: '0.0.0' };
}

function createTerminal(options: {
  readonly resizeOnSize?: t.ViteServe.Screen.Frame.Viewport;
  readonly disposed?: boolean;
} = {}) {
  type ResizeListener = (event: t.Cli.Screen.SizeChanged) => void;

  let viewport: t.ViteServe.Screen.Frame.Viewport = { width: 80, height: 24 };
  let untilSeen: t.UntilInput | undefined;
  let sizeCalls = 0;
  let repaintFailure: unknown;
  let disposals = 0;
  let disposed = options.disposed ?? false;
  let resizeListener: ResizeListener | undefined;
  const until = new AbortController().signal;
  const events = {
    get disposed() {
      return disposed;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      disposals += 1;
      resizeListener = undefined;
    },
    resize$: {
      subscribe(listener: ResizeListener) {
        resizeListener = listener;
        return {
          unsubscribe() {
            if (resizeListener === listener) resizeListener = undefined;
          },
        };
      },
    },
  } as unknown as t.Cli.Screen.Events;
  const repaints: string[] = [];
  const deps: t.ViteServe.Screen.Runtime.Terminal = {
    cursorRows: 1,
    size: () => {
      const measured = { ...viewport };
      if (sizeCalls++ === 0 && options.resizeOnSize) {
        resizeListener?.({ kind: 'size:changed', before: measured, after: options.resizeOnSize });
      }
      return measured;
    },
    events: (input) => {
      untilSeen = input;
      return events;
    },
    repaint: (value) => {
      if (repaintFailure) throw repaintFailure;
      repaints.push(value);
    },
  };

  return {
    deps,
    until,
    repaints,
    resize(next: t.ViteServe.Screen.Frame.Viewport) {
      const before = viewport;
      viewport = { ...next };
      resizeListener?.({ kind: 'size:changed', before, after: next });
    },
    failRepaint(cause: unknown) {
      repaintFailure = cause;
    },
    get untilSeen() {
      return untilSeen;
    },
    get disposals() {
      return disposals;
    },
  };
}
