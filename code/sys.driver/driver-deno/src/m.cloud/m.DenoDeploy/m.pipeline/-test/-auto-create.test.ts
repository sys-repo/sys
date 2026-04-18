import { describe, expect, Fs, it } from '../../../../-test.ts';
import { DenoDeploy } from '../../mod.ts';
import { D } from '../../common.ts';
import { createFakeAutoCreateDeployCli, createNoBuildWorkspace } from './u.fixture.ts';

describe('DenoDeploy.pipeline autoCreate', () => {
  it('defaults autoCreate to false', () => {
    const deployment = DenoDeploy.pipeline({
      pkgDir: '/repo/code/projects/foo',
      config: { app: 'sample' },
    });

    expect(deployment.request.autoCreate).to.eql(false);
    deployment.dispose();
  });

  it('creates a missing app once and retries deploy when autoCreate is enabled', async () => {
    const fs = await createNoBuildWorkspace();
    const fake = await createFakeAutoCreateDeployCli();
    const originalDeno = D.cmd.deno;

    try {
      (D.cmd as { deno: string }).deno = fake.cli;

      const deployment = DenoDeploy.pipeline({
        pkgDir: fs.join('code/apps/foo'),
        config: { app: 'sample-proxy', org: 'sys-org', token: 'abc123' },
        autoCreate: true,
        verify: { preview: false },
      });
      const res = await deployment.run();

      expect(res.deploy.ok).to.eql(true);
      expect(res.deploy.deploy?.url?.preview).to.eql('https://sample-proxy-created.deno.net');

      const records = (await Fs.readJson<{ calls: string[] }>(fake.callsPath)).data?.calls ?? [];
      expect(records).to.eql([
        'deploy',
        'create',
        'deploy',
      ]);
    } finally {
      (D.cmd as { deno: string }).deno = originalDeno;
    }
  });

  it('enriches deploy failures with deploy logs when autoCreate is disabled', async () => {
    const fs = await createNoBuildWorkspace();
    const fake = await createFakeAutoCreateDeployCli();
    const originalDeno = D.cmd.deno;

    try {
      (D.cmd as { deno: string }).deno = fake.cli;

      const deployment = DenoDeploy.pipeline({
        pkgDir: fs.join('code/apps/foo'),
        config: { app: 'sample-proxy', org: 'sys-org', token: 'abc123' },
        autoCreate: false,
        verify: { preview: false },
      });

      let error: unknown;
      try {
        await deployment.run();
      } catch (cause) {
        error = cause;
      }

      expect(error).to.be.instanceOf(Error);
      expect((error as Error).message).to.include('logs:');
      expect((error as Error).message).to.include(
        'The requested app was not found, or you do not have access to view it.',
      );

      const records = (await Fs.readJson<{ calls: string[] }>(fake.callsPath)).data?.calls ?? [];
      expect(records).to.eql([
        'deploy',
        'logs',
      ]);
    } finally {
      (D.cmd as { deno: string }).deno = originalDeno;
    }
  });
});
