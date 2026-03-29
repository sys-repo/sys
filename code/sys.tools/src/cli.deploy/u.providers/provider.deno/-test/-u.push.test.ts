import { describe, expect, it } from '../../../../-test.ts';
import { DenoDeploy } from '../common.ts';
import { withTmpDir } from '../../../-test/-fixtures.ts';
import { DenoProvider } from '../mod.ts';

describe('DenoProvider.push', () => {
  it('rehydrates the staged sidecar into prepare → deploy calls', async () => {
    await withTmpDir(async (tmp) => {
      const root = `${tmp}/stage`;
      const sidecar = {
        target: { dir: `${tmp}/code/apps/foo` },
        workspace: { dir: tmp },
        root,
        entry: `${root}/entry.ts`,
      } as const;
      await DenoProvider.Sidecar.write(root, sidecar);

      const calls: string[] = [];
      let preparedStage: unknown;
      let deployRequest: unknown;
      const originalPrepare = DenoDeploy.prepare;
      const originalDeploy = DenoDeploy.deploy;
      const originalToken = Deno.env.get('DENO_DEPLOY_TOKEN');

      try {
        (DenoDeploy as { prepare: typeof DenoDeploy.prepare }).prepare = async (stage) => {
          calls.push('prepare');
          preparedStage = stage;
          return {
            sourceDir: sidecar.target.dir,
            stagedDir: sidecar.root,
            entrypoint: sidecar.entry,
            entryPaths: `${root}/entry.paths.ts`,
            appEntrypoint: './src/m.server/main.ts',
            workspaceTarget: './code/apps/foo',
            distDir: './code/apps/foo/dist',
          };
        };
        (DenoDeploy as { deploy: typeof DenoDeploy.deploy }).deploy = async (request) => {
          calls.push('deploy');
          deployRequest = request;
          return { ok: true, code: 0, stdout: '', stderr: '' };
        };

        Deno.env.set('DENO_DEPLOY_TOKEN', 'abc123');
        const res = await DenoProvider.push({
          cwd: tmp,
          target: {
            provider: { kind: 'deno', app: 'my-app', org: 'my-org', tokenEnv: 'DENO_DEPLOY_TOKEN' },
            sourceDir: sidecar.target.dir,
            stagingDir: root,
          },
        });

        expect(res.ok).to.eql(true);

        expect(calls).to.eql(['prepare', 'deploy']);
        expect(preparedStage).to.eql(sidecar);
        expect(deployRequest).to.eql({
          stage: sidecar,
          app: 'my-app',
          org: 'my-org',
          token: 'abc123',
          prod: true,
        });
      } finally {
        if (originalToken === undefined) Deno.env.delete('DENO_DEPLOY_TOKEN');
        else Deno.env.set('DENO_DEPLOY_TOKEN', originalToken);
        (DenoDeploy as { prepare: typeof DenoDeploy.prepare }).prepare = originalPrepare;
        (DenoDeploy as { deploy: typeof DenoDeploy.deploy }).deploy = originalDeploy;
      }
    });
  });
});
