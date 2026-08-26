import { describe, expect, it } from '../../src/-test.ts';
import { default as deno } from '../../deno.json' with { type: 'json' };
import { mainWith, PKG_SUBPATH } from '../task.vite.u.ts';

describe('driver-pi/scripts/task.vite', () => {
  it('wires the fixed local Dist serve task through finite permissions', () => {
    const tasks = deno.tasks as Record<string, string | undefined>;
    const permissions = deno.permissions as Record<string, Record<string, unknown> | undefined>;

    expect(tasks.serve).to.eql(
      'FORCE_COLOR=0 deno run --frozen --cached-only --no-prompt -P=serve ./-scripts/task.vite.ts --cmd=serve --port=8080',
    );
    expect(tasks['test:serve:process']).to.eql(
      'FORCE_COLOR=0 deno run --no-prompt -P=serve-process ./-scripts/-test.external/-task.serve.process-proof.ts',
    );
    expect(permissions.serve).to.eql({
      read: ['./dist'],
      net: ['127.0.0.1:8080'],
      env: ['FORCE_COLOR', 'NODE_DISABLE_COLORS', 'NO_COLOR', 'TERM', 'TERM_PROGRAM'],
      run: ['open', 'wslview', 'xdg-open', 'powershell.exe', 'cmd.exe', 'explorer.exe'],
    });
    expect(permissions['serve-process']).to.eql({
      read: ['./dist'],
      net: ['localhost:8080', '127.0.0.1:8080'],
      env: ['FORCE_COLOR'],
      run: ['deno'],
    });
  });

  it('injects the package-owned ui identity into dev and serve', async () => {
    for (const cmd of ['dev', 'serve'] as const) {
      const seen: unknown[] = [];
      await mainWith([`--cmd=${cmd}`], { main: async (args) => void seen.push(args) });
      expect(seen).to.eql([{ _: [], cmd, pkgSubpath: PKG_SUBPATH }]);
    }
  });

  it('leaves build and info structurally unchanged', async () => {
    for (const cmd of ['build', 'info'] as const) {
      const seen: unknown[] = [];
      await mainWith([`--cmd=${cmd}`], { main: async (args) => void seen.push(args) });
      expect(seen).to.eql([{ _: [], cmd }]);
    }
  });

  it('preserves matching caller input without overriding its spelling', async () => {
    for (const field of ['pkgSubpath', 'pkg-subpath'] as const) {
      const seen: unknown[] = [];
      await mainWith(
        ['--cmd=serve', `--${field}=///${PKG_SUBPATH}//`],
        { main: async (args) => void seen.push(args) },
      );
      expect(seen).to.eql([{ _: [], cmd: 'serve', [field]: `///${PKG_SUBPATH}//` }]);
    }
  });

  it('preserves matching normalized caller spellings', async () => {
    const seen: unknown[] = [];
    await mainWith(
      [`--cmd=dev`, `--pkgSubpath=${PKG_SUBPATH}`, `--pkg-subpath=///${PKG_SUBPATH}//`],
      { main: async (args) => void seen.push(args) },
    );
    expect(seen).to.eql([{
      _: [],
      cmd: 'dev',
      pkgSubpath: PKG_SUBPATH,
      'pkg-subpath': `///${PKG_SUBPATH}//`,
    }]);
  });

  it('injects the package-owned identity when caller input is absent', async () => {
    for (const field of ['pkgSubpath', 'pkg-subpath'] as const) {
      const seen: unknown[] = [];
      await mainWith(
        ['--cmd=serve', `--${field}=///`],
        { main: async (args) => void seen.push(args) },
      );
      expect(seen).to.eql([{ _: [], cmd: 'serve', [field]: '///', pkgSubpath: PKG_SUBPATH }]);
    }
  });

  it('rejects invalid and conflicting caller input before delegation', async () => {
    for (
      const input of [
        ['--cmd=dev', `--pkgSubpath=\u001b${PKG_SUBPATH}`],
        ['--cmd=serve', '--pkg-subpath=other'],
      ]
    ) {
      let calls = 0;
      const error = await catchError(() => mainWith(input, { main: async () => void calls++ }));
      expect(error?.message).to.include('DriverPiVite:');
      expect(calls).to.eql(0);
    }
  });

  it('rejects conflicting caller spellings before delegation', async () => {
    const seen: unknown[] = [];
    const error = await catchError(() =>
      mainWith(
        [`--cmd=dev`, `--pkgSubpath=${PKG_SUBPATH}`, '--pkg-subpath=other'],
        { main: async (args) => void seen.push(args) },
      )
    );
    expect(error?.message).to.eql('DriverPiVite: pkgSubpath and pkg-subpath conflict.');
    expect(seen).to.eql([]);
  });
});

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
  } catch (error) {
    return error as Error;
  }
}
