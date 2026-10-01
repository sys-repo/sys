import { describe, expect, Fs, it, Rx, type t, Try, WebFixture } from '../../-test.ts';
import type { ViteDevDeps } from '../t.internal.ts';
import { devWithDeps } from '../u.dev/mod.ts';
import { Wrangle } from '../u/u.wrangle.ts';

// Injected startup/screen contracts stay in base; real child/HTTP cases use test:dev.
describe('Vite.dev contracts', () => {
  it('rejects invalid and orphan package subpaths before startup work', async () => {
    const pkg = { name: '@sys/example', version: '1.2.3' };
    const cases: readonly [unknown, string][] = [
      [{ pkg, pkgSubpath: '\u001b[2J' }, 'invalid package subpath'],
      [{ pkgSubpath: 'ui' }, 'package subpath requires package metadata'],
    ];

    for (const [input, message] of cases) {
      let pathResolutions = 0;
      using _fixture = WebFixture.Property.mock([{
        target: Wrangle,
        key: 'pathsFromConfigfile',
        descriptor: {
          value: () => {
            pathResolutions += 1;
            throw new Error('unexpected path resolution');
          },
        },
      }]);

      const error = await catchError(() => devWithDeps(input as t.Vite.Dev.Args));
      expect(error?.message).to.include(message);
      expect(pathResolutions).to.eql(0);
    }
  });

  it('composes one normalized compound identity only for the screen reporter', async () => {
    const pkg = { name: '@sys/example', version: '1.2.3' } as const;
    const screenArgs: Parameters<NonNullable<ViteDevDeps['createScreen']>>[0][] = [];
    const manifestPath = 'vite manifest #1/dist.json';
    const deps = {
      ...createDevStartupFixtures(),
      loadDist: () =>
        Promise.resolve({
          exists: true,
          kind: 'canonical' as const,
          path: manifestPath,
          dist: {
            build: { time: 1 },
            hash: { digest: 'sha256-deadbeef', parts: {} },
          } as t.DistPkg,
        }),
    };

    const paths = {
      cwd: '/tmp/vite-dev-identity' as t.StringAbsoluteDir,
      app: { entry: 'src/index.html', outDir: 'dist', base: './' },
    } as const;
    const server = await devWithDeps(
      { pkg, pkgSubpath: '/ui//preview/', paths, port: 49152, reporter: 'screen' },
      {
        ...deps,
        waitForHttp: waitForHttpReady,
        createScreen: (args) => {
          screenArgs.push(args);
          return { outputChanged() {}, ready() {}, redraw() {}, dispose() {} };
        },
      },
    );

    try {
      expect(screenArgs).to.have.length(1);
      expect(screenArgs[0]?.identity).to.eql({ root: pkg, subpath: 'ui/preview' });
      expect(screenArgs[0]).to.not.have.property('manifestUrl');
      expect(screenArgs[0]).to.not.have.property('pkg');
      expect(screenArgs[0]).to.not.have.property('pkgSubpath');
    } finally {
      await server.dispose();
    }
  });

  it('loads the screen digest from its declared output directory', async () => {
    const pkg = { name: '@sys/example', version: '1.2.3' } as const;
    const paths = {
      cwd: '/tmp/vite-dev-output-authority' as t.StringAbsoluteDir,
      app: { entry: 'src/index.html', outDir: 'custom-output', base: './' },
    } as const;
    const manifestPath = Fs.resolve(paths.cwd, paths.app.outDir, 'dist.json');
    const loadedPaths: string[] = [];
    const screenArgs: Parameters<NonNullable<ViteDevDeps['createScreen']>>[0][] = [];
    const server = await devWithDeps(
      { pkg, paths, port: 49152, reporter: 'screen' },
      {
        ...createDevStartupFixtures(),
        loadDist: (path) => {
          loadedPaths.push(path);
          return Promise.resolve({
            exists: true,
            kind: 'canonical' as const,
            path,
            dist: {
              build: { time: 1 },
              hash: { digest: 'sha256-output-authority', parts: {} },
            } as t.DistPkg,
          });
        },
        waitForHttp: waitForHttpReady,
        createScreen: (args) => {
          screenArgs.push(args);
          return { outputChanged() {}, ready() {}, redraw() {}, dispose() {} };
        },
      },
    );

    try {
      expect(loadedPaths).to.eql([manifestPath]);
      expect(screenArgs[0]?.dist?.hash.digest).to.eql('sha256-output-authority');
      expect(screenArgs[0]).to.not.have.property('manifestUrl');
    } finally {
      await server.dispose();
    }
  });

  it('passes a redraw adapter only for an acquired ready screen', async () => {
    const pkg = { name: '@sys/example', version: '1.2.3' } as const;
    const paths = {
      cwd: '/tmp/vite-dev-redraw' as t.StringAbsoluteDir,
      app: { entry: 'src/index.html', outDir: 'dist', base: './' },
    } as const;

    for (const reporter of ['screen', 'raw'] as const) {
      const events: string[] = [];
      const keyboardArgs: Parameters<NonNullable<ViteDevDeps['keyboardFactory']>>[0][] = [];
      const server = await devWithDeps(
        { pkg, paths, port: 49152, reporter, silent: reporter === 'raw' },
        {
          ...createDevStartupFixtures(),
          waitForHttp: waitForHttpReady,
          createScreen: () => ({
            outputChanged() {},
            ready: () => void events.push('ready'),
            redraw: () => void events.push('redraw'),
            dispose: () => void events.push('dispose'),
          }),
          keyboardFactory: (args) => {
            keyboardArgs.push(args);
            return async () => {};
          },
        },
      );

      try {
        expect(keyboardArgs).to.have.length(1);
        if (reporter === 'screen') {
          expect(events).to.eql(['ready']);
          keyboardArgs[0]?.redraw?.();
          expect(events).to.eql(['ready', 'redraw']);
        } else {
          expect(keyboardArgs[0]).to.not.have.property('redraw');
          expect(events).to.eql([]);
        }
      } finally {
        await server.dispose();
      }
    }
  });

  it('does not acquire a screen in raw or silent modes', async () => {
    const pkg = { name: '@sys/example', version: '1.2.3' } as const;
    const paths = {
      cwd: '/tmp/vite-dev-raw-identity' as t.StringAbsoluteDir,
      app: { entry: 'src/index.html', outDir: 'dist', base: './' },
    } as const;

    for (
      const input of [
        { pkg, pkgSubpath: 'ui', paths, port: 49152, reporter: 'raw' as const },
        { pkg, pkgSubpath: 'ui', paths, port: 49152, reporter: 'screen' as const, silent: true },
      ]
    ) {
      let screens = 0;
      const output: unknown[][] = [];
      const deps = {
        ...createDevStartupFixtures(),
        loadDist: () =>
          Promise.resolve({
            exists: true,
            kind: 'canonical' as const,
            path: 'relative manifest #1/dist.json',
            dist: {
              build: { time: 1 },
              hash: { digest: 'sha256-deadbeef', parts: {} },
            } as t.DistPkg,
          }),
      };
      using _console = WebFixture.Property.mock([{
        target: console,
        key: 'info',
        descriptor: { value: (...args: unknown[]) => output.push(args) },
      }]);
      const server = await devWithDeps(input, {
        ...deps,
        waitForHttp: waitForHttpReady,
        createScreen: () => {
          screens += 1;
          return { outputChanged() {}, ready() {}, redraw() {}, dispose() {} };
        },
      });

      await server.dispose();
      expect(screens).to.eql(0);
      expect(output.flat().join('\n')).to.not.include('/ui');
    }
  });
});

function createDevStartupFixtures(): ViteDevDeps {
  const process = createDevProcessHarness();
  return {
    spawn: process.spawn,
    loadDist: (path) =>
      Promise.resolve({
        exists: false,
        kind: 'missing',
        path: Fs.resolve(String(path)),
      }),
    command: () =>
      Promise.resolve({ cmd: 'vite', args: [], env: {}, dispose: () => Promise.resolve() }),
  };
}

function createDevProcessHarness() {
  const life = Rx.lifecycleAsync();
  const handle: t.Process.Handle = {
    pid: 1,
    $: Rx.subject<t.Process.Event>().asObservable(),
    is: { ready: true },
    whenReady: () => Promise.resolve(handle),
    onStdOut: () => handle,
    onStdErr: () => handle,
    dispose: life.dispose,
    [Symbol.asyncDispose]: life[Symbol.asyncDispose],
    dispose$: life.dispose$,
    get disposed() {
      return life.disposed;
    },
  } satisfies t.Process.Handle;
  return { spawn: () => handle };
}

const waitForHttpReady: NonNullable<ViteDevDeps['waitForHttp']> = (url) =>
  Promise.resolve({ url, attempts: 1, elapsed: 0 as t.Msecs });

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  const { result } = await Try.run(fn);
  return result.ok ? undefined : result.error;
}
