import { describe, expect, Fs, it, type t, Try, WebFixture } from '../../-test.ts';
import { stripAnsi } from '../common.ts';
import { devWithDeps } from '../u.dev/mod.ts';
import { Log } from '../u/u.log.ts';
import { Wrangle } from '../u/u.wrangle.ts';
import { createDevStartupFixtures, paths, pkg } from './u.fixture.dev.ts';

// Injected startup/screen contracts stay in base; real child/HTTP cases use test:dev.
describe('Vite.dev contracts', () => {
  it('rejects invalid and orphan package subpaths before startup work', async () => {
    const cases: readonly [unknown, string][] = [
      [{ pkg: pkg(), pkgSubpath: '\u001b[2J' }, 'invalid package subpath'],
      [{ pkgSubpath: 'ui' }, 'package subpath requires package metadata'],
    ];
    let pathResolutions = 0;
    using _config = WebFixture.Property.mock([{
      target: Wrangle,
      key: 'pathsFromConfigfile',
      descriptor: {
        value() {
          pathResolutions++;
          throw new Error('unexpected path resolution');
        },
      },
    }]);
    for (const [input, message] of cases) {
      const error = await catchError(() => devWithDeps(input as t.Vite.Dev.Args));
      expect(error?.message).to.include(message);
    }
    expect(pathResolutions).to.eql(0);
  });

  it('snapshots strict port policy before resolving configuration paths', async () => {
    using blocker = Deno.listen({ hostname: '0.0.0.0', port: 0 });
    const input = { port: blocker.addr.port, strictPort: true };
    const resolved = Promise.withResolvers<t.ViteConfig.Paths>();
    using _config = WebFixture.Property.mock([{
      target: Wrangle,
      key: 'pathsFromConfigfile',
      descriptor: { value: () => resolved.promise },
    }]);
    let spawns = 0;
    const startup = devWithDeps(input, {
      ...createDevStartupFixtures(),
      spawn() {
        spawns++;
        throw new Error('unexpected fallback spawn');
      },
    });
    input.strictPort = false;
    resolved.resolve(paths());
    const error = await catchError(() => startup);
    expect(error?.message).to.include(`strict dev server on port ${input.port}`);
    expect(spawns).to.eql(0);
  });

  it('raw entry logging failure rolls back the bootstrap and retains the logging cause', async () => {
    let acquired = 0;
    let released = 0;
    let spawns = 0;
    const loggingError = new Error('entry logging failed');
    const deps = createDevStartupFixtures(() => {
      released++;
      return Promise.reject(new Error('bootstrap cleanup failed'));
    });
    using _entry = WebFixture.Property.mock([{
      target: Log.Entry,
      key: 'log',
      descriptor: {
        value() {
          throw loggingError;
        },
      },
    }]);
    const error = await catchError(() =>
      devWithDeps({ paths: paths(), pkg: pkg(), reporter: 'raw' }, {
        ...deps,
        command() {
          acquired++;
          return deps.command();
        },
        spawn() {
          spawns++;
          throw new Error('unexpected spawn');
        },
      })
    );
    expect(spawns).to.eql(0);
    expect(released).to.eql(acquired);
    expect(error?.cause ?? error).to.equal(loggingError);
  });

  it('ready screen receives the normalized package identity and digest from its output directory', async () => {
    const root = pkg();
    const dirs = paths();
    const app = { ...dirs.app, outDir: 'custom-output' };
    const loaded: string[] = [];
    const ready: unknown[] = [];
    await using _server = await devWithDeps(
      {
        pkg: root,
        pkgSubpath: '/ui//preview/',
        versionLink: 'jsr',
        paths: { ...dirs, app },
        reporter: 'screen',
      },
      {
        ...createDevStartupFixtures(),
        loadDist(path) {
          loaded.push(path);
          return Promise.resolve({
            exists: true,
            kind: 'canonical',
            path,
            dist: {
              build: { time: 1 },
              hash: { digest: 'sha256-output-authority', parts: {} },
            } as t.DistPkg,
          });
        },
        createScreen({ identity, versionLink, dist }) {
          return {
            outputChanged() {},
            redraw() {},
            dispose() {},
            ready: () => ready.push({ identity, versionLink, digest: dist?.hash.digest }),
          };
        },
      },
    );
    expect(loaded).to.eql([Fs.resolve(dirs.cwd, 'custom-output', 'dist.json')]);
    expect(ready).to.eql([{
      identity: { root, subpath: 'ui/preview' },
      versionLink: 'jsr',
      digest: 'sha256-output-authority',
    }]);
  });

  it('raw and silent reporters do not acquire a screen or print a screen subpath', async () => {
    const root = pkg();
    for (const reporter of ['raw', 'screen'] as const) {
      const silent = reporter === 'screen';
      const output: unknown[][] = [];
      using _console = WebFixture.Property.mock([{
        target: console,
        key: 'info',
        descriptor: { value: (...args: unknown[]) => output.push(args) },
      }]);
      await using _server = await devWithDeps(
        { pkg: root, pkgSubpath: 'screen-only-subpath', paths: paths(), reporter, silent },
        {
          ...createDevStartupFixtures(),
          createScreen() {
            throw new Error('Unexpected screen acquisition');
          },
        },
      );
      const text = stripAnsi(output.flat().join('\n'));
      if (silent) expect(text).not.to.include(root.name);
      else expect(text).to.include(root.name);
      expect(text).not.to.include('screen-only-subpath');
    }
  });
});

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  const { result } = await Try.run(fn);
  return result.ok ? undefined : result.error;
}
