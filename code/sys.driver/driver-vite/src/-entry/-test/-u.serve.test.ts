import { Cli, describe, expect, Fs, Http, it, Pkg } from '../../-test.ts';
import { ServeScreen } from '../../m.vite/u/u.serve.screen.ts';
import { serve } from '../u.serve.ts';

type StaticKind = 'directory' | 'missing' | 'not-directory';
type StartOptions = {
  readonly silent?: boolean;
  readonly info?: { readonly static?: string };
  readonly keyboard?: { readonly print?: boolean };
};

describe('ViteEntry.serve', () => {
  it('keeps non-interactive output with the generic HTTP printer', async () => {
    const harness = install({ interactive: false, static: 'missing' });
    try {
      await serve({ cmd: 'serve', dir: './missing' });

      const options = harness.starts[0];
      expect(options?.silent).to.eql(false);
      expect(Cli.stripAnsi(options?.info?.static ?? '')).to.eql('missing/ (does not exist)');
      expect(options?.keyboard?.print).to.eql(true);
      expect(harness.screenCreates).to.eql([]);
    } finally {
      harness.restore();
    }
  });

  it('replaces generic output with a Vite screen only for interactive serve', async () => {
    const harness = install({ interactive: true, static: 'directory' });
    try {
      await serve({ cmd: 'serve', dir: './dist' });

      const options = harness.starts[0];
      expect(options?.silent).to.eql(true);
      expect(options?.keyboard?.print).to.eql(true);
      expect(harness.screenCreates.length).to.eql(1);
      expect(harness.screenCreates[0]?.origin).to.eql('http://localhost:49152/');
      expect(harness.screenDisposals).to.eql(1);
    } finally {
      harness.restore();
    }
  });

  it('keeps silent serve screenless without changing keyboard binding', async () => {
    const harness = install({ interactive: true, static: 'not-directory' });
    try {
      await serve({ cmd: 'serve', dir: './bundle.zip', silent: true });

      const options = harness.starts[0];
      expect(options?.silent).to.eql(true);
      expect(Cli.stripAnsi(options?.info?.static ?? '')).to.eql('bundle.zip/ (not a directory)');
      expect(options?.keyboard?.print).to.eql(false);
      expect(harness.screenCreates).to.eql([]);
    } finally {
      harness.restore();
    }
  });

  it('closes the acquired server without masking screen acquisition failure', async () => {
    const cause = new Error('screen-acquisition-failed');
    const harness = install({ interactive: true, static: 'directory', screenFailure: cause });
    let failure: unknown;
    try {
      await serve({ cmd: 'serve', dir: './dist' });
    } catch (error) {
      failure = error;
    } finally {
      harness.restore();
    }

    expect(failure).to.equal(cause);
    expect(harness.closes).to.eql([cause]);
    expect(harness.screenDisposals).to.eql(0);
  });

  it('closes the server without masking a reporter failure', async () => {
    const cause = new Error('screen-resize-failed');
    const harness = install({ interactive: true, static: 'directory', reporterFailure: cause });
    let failure: unknown;
    try {
      await serve({ cmd: 'serve', dir: './dist' });
    } catch (error) {
      failure = error;
    } finally {
      harness.restore();
    }

    expect(failure).to.equal(cause);
    expect(harness.closes).to.eql([cause]);
    expect(harness.screenDisposals).to.eql(1);
  });
});

/**
 * Helpers:
 */
function install(input: {
  readonly interactive: boolean;
  readonly static: StaticKind;
  readonly reporterFailure?: unknown;
  readonly screenFailure?: unknown;
}) {
  const original = {
    stat: Fs.stat,
    load: Pkg.Dist.load,
    create: Http.Server.create,
    start: Http.Server.start,
    interactive: Cli.Is.interactive,
    screen: ServeScreen.create,
  };
  const starts: StartOptions[] = [];
  const screenCreates: { readonly origin: string }[] = [];
  const closes: unknown[] = [];
  let screenDisposals = 0;
  const server = {
    origin: 'http://localhost:49152/',
    dispose$: new AbortController().signal,
    finished: input.reporterFailure ? new Promise<void>(() => {}) : Promise.resolve(),
    close: async (cause?: unknown) => {
      closes.push(cause);
    },
  };

  Object.defineProperty(Fs, 'stat', {
    value: async () =>
      input.static === 'missing' ? undefined : { isDirectory: input.static === 'directory' },
  });
  Object.defineProperty(Pkg.Dist, 'load', {
    value: async () => ({
      dist: input.static === 'directory'
        ? {
          pkg: { name: '@sys/example', version: '0.0.0' },
          hash: { digest: 'sha256-1234567890abcdef' },
          build: { time: 1 },
        }
        : undefined,
    }),
  });
  Object.defineProperty(Http.Server, 'create', { value: () => ({}) });
  Object.defineProperty(Http.Server, 'start', {
    value: (_app: unknown, options: StartOptions) => {
      starts.push(options);
      return server;
    },
  });
  Object.defineProperty(Cli.Is, 'interactive', { value: () => input.interactive });
  Object.defineProperty(ServeScreen, 'create', {
    value: (args: { readonly origin: string }) => {
      screenCreates.push({ origin: args.origin });
      if (input.screenFailure) throw input.screenFailure;
      return {
        failure: input.reporterFailure
          ? Promise.reject(input.reporterFailure)
          : new Promise<never>(() => {}),
        dispose() {
          screenDisposals += 1;
        },
      };
    },
  });

  return {
    starts,
    screenCreates,
    closes,
    get screenDisposals() {
      return screenDisposals;
    },
    restore() {
      Object.defineProperty(Fs, 'stat', { value: original.stat });
      Object.defineProperty(Pkg.Dist, 'load', { value: original.load });
      Object.defineProperty(Http.Server, 'create', { value: original.create });
      Object.defineProperty(Http.Server, 'start', { value: original.start });
      Object.defineProperty(Cli.Is, 'interactive', { value: original.interactive });
      Object.defineProperty(ServeScreen, 'create', { value: original.screen });
    },
  };
}
