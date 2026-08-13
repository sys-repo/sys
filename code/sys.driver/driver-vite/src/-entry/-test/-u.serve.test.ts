import { describe, expect, it, type t } from '../../-test.ts';
import { serveWith } from '../u.serve.ts';

const PREVIEW_LIMITS = {
  manifestBytes: 16 * 1024 * 1024,
  entries: 8_193,
  fileBytes: 128 * 1024 * 1024,
  totalBytes: 1024 * 1024 * 1024,
} as const;

describe('ViteEntry.serve', () => {
  it('delegates defaults to explicit local Dist preview authority', async () => {
    const harness = createHarness();
    await serveWith({ cmd: 'serve' }, harness.deps);

    expect(harness.calls).to.eql([{
      dir: 'dist',
      limits: PREVIEW_LIMITS,
      port: 8080,
      silent: false,
    }]);
  });

  it('forwards explicit CLI path, port, silent presentation, and normalized package subpath', async () => {
    const harness = createHarness();
    await serveWith({
      cmd: 'serve',
      dir: './build/client',
      port: 49152,
      silent: true,
      pkgSubpath: '/ui//preview/',
    }, harness.deps);

    expect(harness.calls).to.eql([{
      dir: './build/client',
      limits: PREVIEW_LIMITS,
      port: 49152,
      silent: true,
      pkgSubpath: 'ui/preview',
    }]);
  });

  it('accepts programmatic and CLI inputs that normalize identically', async () => {
    const harness = createHarness();
    await serveWith({
      cmd: 'serve',
      pkgSubpath: '/ui//preview/',
      'pkg-subpath': 'ui/preview',
    }, harness.deps);

    expect(harness.calls[0]?.pkgSubpath).to.eql('ui/preview');
  });

  it('resolves one absent input and one valid input without widening preview authority', async () => {
    const harness = createHarness();
    await serveWith({ cmd: 'serve', pkgSubpath: '///', 'pkg-subpath': '/ui/' }, harness.deps);

    expect(harness.calls[0]?.pkgSubpath).to.eql('ui');
  });

  it('rejects invalid or conflicting input before preview startup', async () => {
    const cases: readonly [t.ViteEntry.Args.Serve, string][] = [
      [{ cmd: 'serve', pkgSubpath: '\u001b[2J' }, 'invalid pkgSubpath'],
      [
        { cmd: 'serve', pkgSubpath: 'ui', 'pkg-subpath': '\u001b[2J' },
        'invalid pkg-subpath',
      ],
      [
        { cmd: 'serve', pkgSubpath: 'ui', 'pkg-subpath': 'other' },
        'pkgSubpath and pkg-subpath conflict',
      ],
    ];

    for (const [input, message] of cases) {
      const harness = createHarness();
      const error = await catchError(() => serveWith(input, harness.deps));
      expect(error?.message).to.include(message);
      expect(harness.calls).to.eql([]);
    }
  });
});

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
  } catch (error) {
    return error as Error;
  }
}

function createHarness() {
  const calls: t.DistServer.Local.ServeArgs[] = [];
  return {
    calls,
    deps: {
      Local: {
        serve: (input: t.DistServer.Local.ServeArgs) => {
          calls.push(input);
          return Promise.resolve();
        },
      },
    },
  };
}
