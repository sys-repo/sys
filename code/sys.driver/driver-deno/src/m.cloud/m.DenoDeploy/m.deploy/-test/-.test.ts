import { describe, expect, expectTypeOf, it } from '../../../../-test.ts';
import { toDeployArgs } from '../u.deployArgs.ts';

describe('DenoDeploy.deploy', () => {
  it('builds native deno deploy args from a staged artifact', () => {
    const stage = {
      target: { dir: '/repo/apps/foo' },
      workspace: {
        exists: true,
        dir: '/repo',
        path: '/repo/deno.json',
        file: { workspace: ['./apps/foo'] },
        denofile: { workspace: ['./apps/foo'] },
        pkg: {},
        children: [],
      },
      root: '/tmp/stage',
      entry: '/tmp/stage/deploy.entry.ts',
    } as any;

    const args = toDeployArgs({
      stage,
      app: 'my-app',
      org: 'my-org',
      token: 'abc123',
      config: '/tmp/stage/deno.json',
      prod: true,
      allowNodeModules: true,
      noWait: true,
      silent: true,
    });

    expect(args).to.eql([
      'deploy',
      '--app',
      'my-app',
      '--org',
      'my-org',
      '--token',
      'abc123',
      '--config',
      '/tmp/stage/deno.json',
      '--prod',
      '--allow-node-modules',
      '--no-wait',
      '/tmp/stage',
    ]);
  });

  it('returns minimal args for the required deploy request surface', () => {
    const stage = {
      target: { dir: '/repo/apps/foo' },
      workspace: {} as any,
      root: '/tmp/stage',
      entry: '/tmp/stage/deploy.entry.ts',
    };

    const args = toDeployArgs({ stage, app: 'my-app' });
    expectTypeOf(args).toEqualTypeOf<string[]>();
    expect(args).to.eql(['deploy', '--app', 'my-app', '/tmp/stage']);
  });
});
