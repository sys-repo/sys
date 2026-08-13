import { WebFixture } from '@sys/testing/web';
import { describe, expect, it, type t } from '../../-test.ts';
import { mainWith } from '../m.Entry.main.ts';

const NOOP_COMMANDS = {
  build: () => Promise.resolve(),
  dev: () => Promise.resolve(),
  serve: () => Promise.resolve(),
} satisfies Pick<t.ViteEntry.Lib, 'build' | 'dev' | 'serve'>;

describe('ViteEntry.main', () => {
  it('preserves numeric-looking package subpaths as strings', async () => {
    for (const field of ['pkgSubpath', 'pkg-subpath'] as const) {
      const seen: t.ViteEntry.Args.Serve[] = [];
      await mainWith(
        ['--cmd=serve', '--silent', `--${field}=001`],
        {
          ...NOOP_COMMANDS,
          serve: (args) => {
            seen.push(args);
            return Promise.resolve();
          },
        },
      );

      expect(seen).to.eql([{
        _: [],
        cmd: 'serve',
        silent: true,
        [field]: '001',
      }]);
    }
  });

  it('keeps valid silent serve free of dispatcher output', async () => {
    const calls: string[] = [];
    const original = Object.getOwnPropertyDescriptor(console, 'info');
    {
      using _fixture = WebFixture.Property.mock([{
        target: console,
        key: 'info',
        descriptor: { value: (..._args: unknown[]) => calls.push('console') },
      }]);

      await mainWith(
        ['--cmd=serve', '--silent', '--pkg-subpath=ui'],
        {
          ...NOOP_COMMANDS,
          serve: () => {
            calls.push('serve');
            return Promise.resolve();
          },
        },
      );
      expect(calls).to.eql(['serve']);
    }
    expect(Object.getOwnPropertyDescriptor(console, 'info')).to.eql(original);
  });

  it('rejects invalid dev and serve input before command or terminal effects', async () => {
    for (const cmd of ['dev', 'serve'] as const) {
      const calls: string[] = [];
      const original = Object.getOwnPropertyDescriptor(console, 'info');
      {
        using _fixture = WebFixture.Property.mock([{
          target: console,
          key: 'info',
          descriptor: { value: (..._args: unknown[]) => calls.push('console') },
        }]);

        const error = await catchError(() =>
          mainWith(
            [`--cmd=${cmd}`, '--pkg-subpath=ui', '--pkgSubpath=other'],
            {
              build: () => Promise.resolve(),
              dev: () => {
                calls.push('dev');
                return Promise.resolve();
              },
              serve: () => {
                calls.push('serve');
                return Promise.resolve();
              },
            },
          )
        );

        expect(error?.message).to.include('pkgSubpath and pkg-subpath conflict');
        expect(calls).to.eql([]);
      }
      expect(Object.getOwnPropertyDescriptor(console, 'info')).to.eql(original);
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
