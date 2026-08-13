import { describe, expect, it } from '../../src/-test.ts';
import { mainWith, PKG_SUBPATH } from '../task.vite.u.ts';

describe('driver-pi/scripts/task.vite', () => {
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
