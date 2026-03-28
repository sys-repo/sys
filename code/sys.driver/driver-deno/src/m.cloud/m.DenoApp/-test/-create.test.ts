import { describe, expect, it } from '../../../-test.ts';
import { DeployCli } from '../../u.cli.deploy/mod.ts';

describe('DenoApp.create', () => {
  it('builds the native deno deploy create invocation from a narrow app request', () => {
    const cli = DeployCli.create({
      app: 'my-app',
      org: 'my-org',
      token: 'abc123',
      region: 'global',
      noWait: true,
      doNotUseDetectedBuildConfig: true,
      appDirectory: './',
      installCommand: 'true',
      buildCommand: 'true',
      preDeployCommand: 'true',
      runtimeMode: 'dynamic',
      entrypoint: './entry.ts',
      workingDirectory: './',
      dryRun: true,
      root: '/repo/code/projects/foo',
      log: true,
    });

    expect(cli).to.eql({
      cmd: 'deno',
      cwd: '/repo/code/projects/foo',
      args: [
        'deploy',
        'create',
        '--source',
        'local',
        '--app',
        'my-app',
        '--org',
        'my-org',
        '--token',
        'abc123',
        '--region',
        'global',
        '--no-wait',
        '--dry-run',
        '--do-not-use-detected-build-config',
        '--app-directory',
        './',
        '--install-command',
        'true',
        '--build-command',
        'true',
        '--pre-deploy-command',
        'true',
        '--runtime-mode',
        'dynamic',
        '--entrypoint',
        './entry.ts',
        '--working-directory',
        './',
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
        '--source',
        'local',
        '--app',
        'my-app',
        '--no-wait',
        Deno.cwd(),
      ],
    });
  });
});
