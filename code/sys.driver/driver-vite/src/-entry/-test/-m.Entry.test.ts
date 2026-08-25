import { describe, expect, it, type t } from '../../-test.ts';
import { build, dev, serve } from '../m.Command.ts';
import { ViteEntry } from '../m.Entry.ts';
import { main } from '../m.Entry.main.ts';
import { buildWith } from '../u.command.build.ts';
import { devWith } from '../u.command.dev.ts';
import { serveWith } from '../u.command.serve.ts';

describe('ViteEntry public command surface', () => {
  it('binds the exported entry to fixed lazy command proxies', () => {
    expect(ViteEntry.main).to.equal(main);
    expect(ViteEntry.build).to.equal(build);
    expect(ViteEntry.dev).to.equal(dev);
    expect(ViteEntry.serve).to.equal(serve);
  });

  it('routes public proxies through production wrappers and implementations', async () => {
    const causes = {
      build: new Error('build implementation sentinel'),
      dev: new Error('dev implementation sentinel'),
      serve: new Error('serve implementation sentinel'),
    } as const;

    const buildError = await catchError(() =>
      ViteEntry.build(
        unreadableDir<t.ViteEntry.Args.Build>({ cmd: 'build', silent: true }, causes.build),
      )
    );
    const devError = await catchError(() =>
      ViteEntry.dev(unreadableDir<t.ViteEntry.Args.Dev>({ cmd: 'dev' }, causes.dev))
    );
    const serveError = await catchError(() =>
      ViteEntry.serve(
        unreadableDir<t.ViteEntry.Args.Serve>({ cmd: 'serve', silent: true }, causes.serve),
      )
    );

    expect(buildError).to.equal(causes.build);
    expect(devError).to.equal(causes.dev);
    expect(serveError).to.equal(causes.serve);
  });

  it('keeps implementation injection behind explicit wrapper seams', async () => {
    const calls: string[] = [];
    const buildArgs: t.ViteEntry.Args.Build = { cmd: 'build', silent: true };
    const devArgs: t.ViteEntry.Args.Dev = { cmd: 'dev' };
    const serveArgs: t.ViteEntry.Args.Serve = { cmd: 'serve', silent: true };

    await buildWith(buildArgs, () => {
      calls.push('load:build');
      return Promise.resolve({
        build: (args) => {
          expect(args).to.equal(buildArgs);
          calls.push('run:build');
          return Promise.resolve();
        },
      });
    });
    await devWith(devArgs, () => {
      calls.push('load:dev');
      return Promise.resolve({
        dev: (args) => {
          expect(args).to.equal(devArgs);
          calls.push('run:dev');
          return Promise.resolve();
        },
      });
    });
    await serveWith(serveArgs, () => {
      calls.push('load:serve');
      return Promise.resolve({
        serve: (args) => {
          expect(args).to.equal(serveArgs);
          calls.push('run:serve');
          return Promise.resolve();
        },
      });
    });

    expect(calls).to.eql([
      'load:build',
      'run:build',
      'load:dev',
      'run:dev',
      'load:serve',
      'run:serve',
    ]);
  });

  it('preserves wrapper loader and command rejection identity', async () => {
    const loadCause = new Error('load failed');
    const commandCause = new Error('command failed');

    const loadError = await catchError(() =>
      buildWith({ cmd: 'build' }, () => Promise.reject(loadCause))
    );
    const commandError = await catchError(() =>
      serveWith(
        { cmd: 'serve' },
        () => Promise.resolve({ serve: () => Promise.reject(commandCause) }),
      )
    );

    expect(loadError).to.equal(loadCause);
    expect(commandError).to.equal(commandCause);
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

async function catchError(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
  } catch (error) {
    return error;
  }
}
