import { WebFixture } from '@sys/testing/web';
import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { COMMAND_LOADERS } from '../u.command/mod.ts';
import { type DispatchLoaders, mainWith } from '../m.Entry.main.ts';
import { dispatchWith as dispatchServeWith } from '../u.command/u.serve.ts';
import { load as loadBuild } from '../u.command/u.load/u.build.ts';
import { load as loadDev } from '../u.command/u.load/u.dev.ts';
import { load as loadInfo } from '../u.command/u.load/u.info.ts';
import { load as loadServe } from '../u.command/u.load/u.serve.ts';

const NOOP_LOADERS: DispatchLoaders = Object.freeze({
  build: () => Promise.resolve({ dispatch: () => Promise.resolve() }),
  dev: () => Promise.resolve({ dispatch: () => Promise.resolve() }),
  serve: () => Promise.resolve({ dispatch: () => Promise.resolve() }),
  info: () => Promise.resolve({ dispatch: () => Promise.resolve() }),
});

describe('ViteEntry.main', () => {
  it('binds each production command key to its exact loader and command module', async () => {
    expect(COMMAND_LOADERS.build).to.equal(loadBuild);
    expect(COMMAND_LOADERS.dev).to.equal(loadDev);
    expect(COMMAND_LOADERS.info).to.equal(loadInfo);
    expect(COMMAND_LOADERS.serve).to.equal(loadServe);

    const [build, dev, info, serve] = await Promise.all([
      import('../u.command/u.build.ts'),
      import('../u.command/u.dev.ts'),
      import('../u.command/u.info.ts'),
      import('../u.command/u.serve.ts'),
    ]);
    expect(await COMMAND_LOADERS.build()).to.equal(build);
    expect(await COMMAND_LOADERS.dev()).to.equal(dev);
    expect(await COMMAND_LOADERS.info()).to.equal(info);
    expect(await COMMAND_LOADERS.serve()).to.equal(serve);
  });

  it('routes production CLI dispatch through selected command modules', async () => {
    const causes = {
      build: new Error('build dispatch implementation sentinel'),
      dev: new Error('dev dispatch implementation sentinel'),
      info: new Error('info dispatch implementation sentinel'),
    } as const;
    using _fixture = WebFixture.Property.mock([{
      target: console,
      key: 'info',
      descriptor: { value: () => undefined },
    }]);

    const build = await COMMAND_LOADERS.build();
    const dev = await COMMAND_LOADERS.dev();
    const info = await COMMAND_LOADERS.info();

    const buildError = await catchUnknown(() =>
      build.dispatch(
        unreadableDir<t.ViteEntry.Args.Build>({ cmd: 'build', silent: true }, causes.build),
      )
    );
    const devError = await catchUnknown(() =>
      dev.dispatch(unreadableDir<t.ViteEntry.Args.Dev>({ cmd: 'dev' }, causes.dev))
    );
    const infoError = await catchUnknown(() =>
      info.dispatch(unreadableDir<t.ViteEntry.Args.Info>({ cmd: 'info' }, causes.info))
    );

    expect(buildError).to.equal(causes.build);
    expect(devError).to.equal(causes.dev);
    expect(infoError).to.equal(causes.info);
  });

  it('preserves numeric-looking package subpaths as strings', async () => {
    for (const field of ['pkgSubpath', 'pkg-subpath'] as const) {
      const seen: t.ViteEntry.Args.Serve[] = [];
      await mainWith(
        ['--cmd=serve', '--silent', `--${field}=001`],
        {
          ...NOOP_LOADERS,
          serve: () =>
            Promise.resolve({
              dispatch: (args) => {
                seen.push(args);
                return Promise.resolve();
              },
            }),
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

  it('leaves serve presentation solely to the server screen', async () => {
    const calls: string[] = [];
    const original = Object.getOwnPropertyDescriptor(console, 'info');
    {
      using _fixture = WebFixture.Property.mock([{
        target: console,
        key: 'info',
        descriptor: { value: (..._args: unknown[]) => calls.push('console') },
      }]);

      for (
        const args of [
          { cmd: 'serve', pkgSubpath: 'ui' },
          { cmd: 'serve', silent: true, pkgSubpath: 'ui' },
        ] as const
      ) {
        await dispatchServeWith(args, () => {
          calls.push('serve');
          return Promise.resolve();
        });
      }
      expect(calls).to.eql(['serve', 'serve']);
    }
    expect(Object.getOwnPropertyDescriptor(console, 'info')).to.eql(original);
  });

  it('loads and dispatches only the selected command module', async () => {
    for (const cmd of ['build', 'dev', 'serve', 'info'] as const) {
      const calls: string[] = [];
      using _fixture = WebFixture.Property.mock([{
        target: console,
        key: 'info',
        descriptor: { value: () => undefined },
      }]);

      await mainWith(
        cmd === 'build' || cmd === 'serve' ? { cmd, silent: true } : { cmd },
        recordingLoaders(calls),
      );

      expect(calls).to.eql([`load:${cmd}`, `run:${cmd}`]);
    }
  });

  it('preserves selected loader and command rejection identity', async () => {
    const loadCause = new Error('load failed');
    const commandCause = new Error('command failed');

    const loadError = await catchUnknown(() =>
      mainWith(
        { cmd: 'build', silent: true },
        { ...NOOP_LOADERS, build: () => Promise.reject(loadCause) },
      )
    );
    const commandError = await catchUnknown(() =>
      mainWith(
        { cmd: 'serve', silent: true },
        {
          ...NOOP_LOADERS,
          serve: () => Promise.resolve({ dispatch: () => Promise.reject(commandCause) }),
        },
      )
    );

    expect(loadError).to.equal(loadCause);
    expect(commandError).to.equal(commandCause);
  });

  it('preserves unsupported-command output without loading a command module', async () => {
    const terminal: string[] = [];
    const calls: string[] = [];
    using _fixture = WebFixture.Property.mock([{
      target: console,
      key: 'error',
      descriptor: { value: (...args: unknown[]) => terminal.push(args.join(' ')) },
    }]);

    await mainWith(['--cmd=unknown'], recordingLoaders(calls));

    expect(calls).to.eql([]);
    expect(terminal.map(Cli.stripAnsi)).to.eql([
      'The given --cmd="unknown" is not supported.',
    ]);
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
            recordingLoaders(calls),
          )
        );

        expect(error?.message).to.include('pkgSubpath and pkg-subpath conflict');
        expect(calls).to.eql([]);
      }
      expect(Object.getOwnPropertyDescriptor(console, 'info')).to.eql(original);
    }
  });
});

function unreadableDir<A extends t.ViteEntry.Args>(
  args: Omit<A, 'dir'>,
  cause: unknown,
): A {
  return {
    ...args,
    get dir(): A['dir'] {
      throw cause;
    },
  } as A;
}

function recordingLoaders(calls: string[]): DispatchLoaders {
  const command = <A extends t.ViteEntry.Args>(cmd: A['cmd']) => {
    return () => {
      calls.push(`load:${cmd}`);
      return Promise.resolve({
        dispatch: (_args: A) => {
          calls.push(`run:${cmd}`);
          return Promise.resolve();
        },
      });
    };
  };
  return {
    build: command<t.ViteEntry.Args.Build>('build'),
    dev: command<t.ViteEntry.Args.Dev>('dev'),
    serve: command<t.ViteEntry.Args.Serve>('serve'),
    info: command<t.ViteEntry.Args.Info>('info'),
  };
}

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  return await catchUnknown(fn) as Error | undefined;
}

async function catchUnknown(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
  } catch (error) {
    return error;
  }
}
