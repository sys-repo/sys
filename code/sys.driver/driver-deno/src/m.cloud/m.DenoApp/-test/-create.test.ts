import { describe, expect, it } from '../../../-test.ts';
import { DeployCli } from '../../m.DenoDeploy/u.cli/mod.ts';

describe('DenoApp.create', () => {
  it('builds the native deno deploy create invocation from a narrow app request', () => {
    const cli = DeployCli.create({
      app: 'my-app',
      org: 'my-org',
      token: 'abc123',
      dryRun: true,
      root: '/repo/code/projects/foo',
      log: true,
    });

    expect(cli).to.eql({
      cmd: 'deno',
      cwd: Deno.cwd(),
      args: [
        'deploy',
        'create',
        '--app',
        'my-app',
        '--org',
        'my-org',
        '--token',
        'abc123',
        '--dry-run',
        '/repo/code/projects/foo',
      ],
    });
  });

  it('returns the minimal create invocation for the required request surface', () => {
    const cli = DeployCli.create({ app: 'my-app' });

    expect(cli).to.eql({
      cmd: 'deno',
      cwd: Deno.cwd(),
      args: [
        'deploy',
        'create',
        '--app',
        'my-app',
      ],
    });
  });
});
