import { WebFixture } from '@sys/testing/web';
import { describe, expect, it, type t } from '../../-test.ts';
import { build, dev, serve } from '../u.command/mod.ts';
import { ViteEntry } from '../m.Entry.ts';
import { main } from '../m.Entry.main.ts';
import { dispatchWith as dispatchBuildWith } from '../u.command/u.build.ts';
import { dispatchWith as dispatchDevWith } from '../u.command/u.dev.ts';
import { dispatchWith as dispatchServeWith } from '../u.command/u.serve.ts';

describe('ViteEntry public command surface', () => {
  it('binds the exported entry to fixed lazy command proxies', () => {
    expect(ViteEntry.main).to.equal(main);
    expect(ViteEntry.build).to.equal(build);
    expect(ViteEntry.dev).to.equal(dev);
    expect(ViteEntry.serve).to.equal(serve);
  });

  it('routes public proxies through selected production command modules', async () => {
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

  it('keeps command-runner injection behind explicit dispatch seams', async () => {
    using _fixture = WebFixture.Property.mock([{
      target: console,
      key: 'info',
      descriptor: { value: () => undefined },
    }]);
    const calls: string[] = [];
    const buildArgs: t.ViteEntry.Args.Build = { cmd: 'build', silent: true };
    const devArgs: t.ViteEntry.Args.Dev = { cmd: 'dev' };
    const serveArgs: t.ViteEntry.Args.Serve = { cmd: 'serve', silent: true };

    await dispatchBuildWith(buildArgs, (args) => {
      expect(args).to.equal(buildArgs);
      calls.push('run:build');
      return Promise.resolve();
    });
    await dispatchDevWith(devArgs, (args) => {
      expect(args).to.equal(devArgs);
      calls.push('run:dev');
      return Promise.resolve();
    });
    await dispatchServeWith(serveArgs, (args) => {
      expect(args).to.equal(serveArgs);
      calls.push('run:serve');
      return Promise.resolve();
    });

    expect(calls).to.eql(['run:build', 'run:dev', 'run:serve']);
  });

  it('preserves command-runner rejection identity', async () => {
    using _fixture = WebFixture.Property.mock([{
      target: console,
      key: 'info',
      descriptor: { value: () => undefined },
    }]);
    const cause = new Error('command failed');
    const error = await catchError(() =>
      dispatchServeWith({ cmd: 'serve' }, () => Promise.reject(cause))
    );

    expect(error).to.equal(cause);
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
