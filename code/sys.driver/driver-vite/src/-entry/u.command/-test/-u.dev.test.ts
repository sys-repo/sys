import { describe, expect, it, type t } from '../../../-test.ts';
import { devWith } from '../u.dev.ts';

const PKG = { name: '@sys/example', version: '1.2.3' } as const;

describe('ViteEntry.dev', () => {
  it('forwards normalized presentation beside truthful package metadata', async () => {
    const cwd = '/tmp/driver-vite-entry-dev';
    const pkgSubpath = '/ui//preview/';
    const harness = createHarness();
    await devWith({ cmd: 'dev', dir: cwd, pkgSubpath }, harness.deps, { jsrPackageDir: cwd });

    expect(harness.loaded).to.eql([cwd]);
    expect(harness.calls).to.eql([{
      pkg: PKG,
      pkgSubpath: 'ui/preview',
      versionLink: 'jsr',
      cwd,
      port: undefined,
      reporter: undefined,
      logLines: undefined,
    }]);
    expect(harness.listens).to.eql(1);
  });

  it('does not transfer directory-owned consent to identical metadata under --dir', async () => {
    const owner = '/tmp/driver-vite-entry-dev';
    const other = `${owner}-other`;
    const harness = createHarness();
    const options = { jsrPackageDir: `${owner}/` };
    for (const dir of [`${owner}/.`, other]) {
      await devWith({ cmd: 'dev', dir }, harness.deps, options);
    }
    expect(harness.loaded).to.eql([owner, other]);
    expect(harness.calls.map(({ pkg }) => pkg)).to.eql([PKG, PKG]);
    expect(harness.calls.map(({ versionLink }) => versionLink)).to.eql(['jsr', undefined]);
    expect(harness.listens).to.eql(2);
  });

  it('requires an absolute application directory even when dev defaults to cwd', async () => {
    const harness = createHarness();
    const args = { cmd: 'dev' } as const;
    await devWith(args, harness.deps, { jsrPackageDir: Deno.cwd() });
    await devWith(args, harness.deps, { jsrPackageDir: '.' });
    expect(harness.calls.map(({ versionLink }) => versionLink)).to.eql(['jsr', undefined]);
  });

  it('omits package presentation when no subpath is supplied', async () => {
    const harness = createHarness();
    await devWith({ cmd: 'dev' }, harness.deps);

    expect(harness.calls).to.eql([{
      pkg: PKG,
      cwd: harness.loaded[0],
      port: undefined,
      reporter: undefined,
      logLines: undefined,
    }]);
  });

  it('accepts programmatic and CLI inputs that normalize identically', async () => {
    const harness = createHarness();
    await devWith({
      cmd: 'dev',
      pkgSubpath: '/ui//preview/',
      'pkg-subpath': 'ui/preview',
    }, harness.deps);

    expect(harness.calls[0]?.pkgSubpath).to.eql('ui/preview');
  });

  it('rejects invalid or conflicting input before package I/O', async () => {
    const cases: readonly [t.ViteEntry.Args.Dev, string][] = [
      [{ cmd: 'dev', pkgSubpath: '\u001b[2J' }, 'invalid pkgSubpath'],
      [
        { cmd: 'dev', pkgSubpath: 'ui', 'pkg-subpath': '\u001b[2J' },
        'invalid pkg-subpath',
      ],
      [
        { cmd: 'dev', pkgSubpath: 'ui', 'pkg-subpath': 'other' },
        'pkgSubpath and pkg-subpath conflict',
      ],
    ];

    for (const [input, message] of cases) {
      const harness = createHarness();
      const error = await catchError(() => devWith(input, harness.deps));
      expect(error?.message).to.include(message);
      expect(harness.loaded).to.eql([]);
      expect(harness.calls).to.eql([]);
      expect(harness.listens).to.eql(0);
    }
  });
});

function createHarness() {
  const loaded: t.StringAbsoluteDir[] = [];
  const calls: t.Vite.Dev.Args[] = [];
  let listens = 0;
  return {
    loaded,
    calls,
    deps: {
      loadPkg(cwd: t.StringAbsoluteDir) {
        loaded.push(cwd);
        return Promise.resolve(PKG);
      },
      start(input: t.Vite.Dev.Args) {
        calls.push(input);
        return Promise.resolve({
          listen() {
            listens += 1;
            return Promise.resolve();
          },
        });
      },
    },
    get listens() {
      return listens;
    },
  };
}

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
  } catch (error) {
    return error as Error;
  }
}
