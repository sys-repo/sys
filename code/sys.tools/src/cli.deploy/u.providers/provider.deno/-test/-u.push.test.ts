import { describe, expect, it } from '../../../../-test.ts';
import { DenoDeploy, type t } from '../common.ts';
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
      const originalToken = Deno.env.get('DENO_DEPLOY_TOKEN');

      try {
        const restore = patchDeploy({
          prepare: async (stage) => {
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
          },
          deploy: async (request) => {
            calls.push('deploy');
            deployRequest = request;
            return { ok: true, code: 0, stdout: '', stderr: '' };
          },
          create: async () => {
            calls.push('create');
            return { ok: true, code: 0, stdout: '', stderr: '' };
          },
        });

        try {
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
          restore();
        }
      } finally {
        if (originalToken === undefined) Deno.env.delete('DENO_DEPLOY_TOKEN');
        else Deno.env.set('DENO_DEPLOY_TOKEN', originalToken);
      }
    });
  });

  it('creates the app and retries deploy on a recognized missing-app failure', async () => {
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
      const deployRequests: unknown[] = [];
      let createRequest: unknown;
      const originalToken = Deno.env.get('DENO_DEPLOY_TOKEN');

      try {
        let currentDeploy = 0;
        const restore = patchDeploy({
          prepare: async (stage) => {
            calls.push('prepare');
            return {
              sourceDir: stage.target.dir,
              stagedDir: stage.root,
              entrypoint: stage.entry,
              entryPaths: `${root}/entry.paths.ts`,
              appEntrypoint: './src/m.server/main.ts',
              workspaceTarget: './code/apps/foo',
              distDir: './code/apps/foo/dist',
            };
          },
          deploy: async (request) => {
            currentDeploy += 1;
            calls.push(`deploy:${currentDeploy}`);
            deployRequests.push(request);
            if (currentDeploy === 1) {
              return {
                ok: false,
                code: 1,
                stdout: '',
                stderr: 'Project not found: my-app',
              };
            }
            return { ok: true, code: 0, stdout: '', stderr: '' };
          },
          create: async (request) => {
            calls.push('create');
            createRequest = request;
            return { ok: true, code: 0, stdout: '', stderr: '' };
          },
        });

        try {
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
          expect(calls).to.eql(['prepare', 'deploy:1', 'create', 'deploy:2']);
          expect(deployRequests).to.eql([
            {
              stage: sidecar,
              app: 'my-app',
              org: 'my-org',
              token: 'abc123',
              prod: true,
            },
            {
              stage: sidecar,
              app: 'my-app',
              org: 'my-org',
              token: 'abc123',
              prod: true,
            },
          ]);
          expect(createRequest).to.eql({
            root,
            app: 'my-app',
            org: 'my-org',
            token: 'abc123',
            noWait: true,
            doNotUseDetectedBuildConfig: true,
            appDirectory: './',
            installCommand: 'true',
            buildCommand: 'true',
            preDeployCommand: 'true',
            runtimeMode: 'dynamic',
            entrypoint: './entry.ts',
            workingDirectory: './',
          });
        } finally {
          restore();
        }
      } finally {
        if (originalToken === undefined) Deno.env.delete('DENO_DEPLOY_TOKEN');
        else Deno.env.set('DENO_DEPLOY_TOKEN', originalToken);
      }
    });
  });

  it('does not create the app on an unrelated deploy failure', async () => {
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
      const restore = patchDeploy({
        prepare: async () => {
          calls.push('prepare');
          return {
            sourceDir: sidecar.target.dir,
            stagedDir: sidecar.root,
            entrypoint: sidecar.entry,
            entryPaths: `${root}/entry.paths.ts`,
            appEntrypoint: './src/m.server/main.ts',
            workspaceTarget: './code/apps/foo',
            distDir: './code/apps/foo/dist',
          };
        },
        deploy: async () => {
          calls.push('deploy');
          return {
            ok: false,
            code: 1,
            stdout: '',
            stderr: 'Build failed: syntax error',
          };
        },
        create: async () => {
          calls.push('create');
          return { ok: true, code: 0, stdout: '', stderr: '' };
        },
      });

      try {
        const res = await DenoProvider.push({
          cwd: tmp,
          target: {
            provider: { kind: 'deno', app: 'my-app', org: 'my-org' },
            sourceDir: sidecar.target.dir,
            stagingDir: root,
          },
        });

        expect(res.ok).to.eql(false);
        expect(calls).to.eql(['prepare', 'deploy']);
      } finally {
        restore();
      }
    });
  });
});

type MutableDenoDeploy = {
  -readonly [K in keyof t.DenoDeploy.Lib]: t.DenoDeploy.Lib[K];
};

type MutableDenoApp = {
  -readonly [K in keyof t.DenoApp.Lib]: t.DenoApp.Lib[K];
};

function patchDeploy(args: {
  prepare: t.DenoDeploy.Lib['prepare'];
  deploy: t.DenoDeploy.Lib['deploy'];
  create: t.DenoApp.Lib['create'];
}) {
  const deploy = DenoDeploy as MutableDenoDeploy;
  const app = DenoDeploy.App as MutableDenoApp;
  const original = {
    prepare: deploy.prepare,
    deploy: deploy.deploy,
    create: app.create,
  } as const;

  deploy.prepare = args.prepare;
  deploy.deploy = args.deploy;
  app.create = args.create;

  return () => {
    deploy.prepare = original.prepare;
    deploy.deploy = original.deploy;
    app.create = original.create;
  };
}
