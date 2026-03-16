import { describe, expect, Fs, it, slug, Testing } from '../../../../-test.ts';
import { DenoDeploy } from '../../mod.ts';
import { createStageWorkspace, getStageError } from './u.fixture.workspace.ts';

describe('DenoDeploy: staging target resolution', () => {
  describe('workspace target boundaries', () => {
    it('rejects a target outside the workspace', async () => {
      const external = await Testing.dir('DenoDeploy.stage.external');
      await Fs.writeJson(external.join('deno.json'), {
        name: '@test/external',
        version: '0.0.0',
        exports: { '.': './src/mod.ts' },
      });
      await Fs.write(external.join('src/mod.ts'), `export const external = true;\n`);

      const error = await getStageError(() => DenoDeploy.stage({ target: { dir: external.dir } }));
      expect(error?.message).to.eql(
        `DenoDeploy.stage: no workspace found for target dir '${external.dir}'`,
      );
    });

    it('rejects a target that is not a declared workspace child', async () => {
      const fs = await createStageWorkspace();
      await Fs.writeJson(fs.join('apps/ghost/deno.json'), {
        name: '@test/ghost',
        version: '0.0.0',
        exports: { '.': './src/mod.ts' },
      });
      await Fs.write(fs.join('apps/ghost/src/mod.ts'), `export const ghost = true;\n`);

      const targetDir = fs.join('apps/ghost');
      const error = await getStageError(() => DenoDeploy.stage({ target: { dir: targetDir } }));
      expect(error?.message).to.eql(
        `DenoDeploy.stage: target dir '${targetDir}' is not a declared workspace child of '${fs.dir}'`,
      );
    });
  });

  describe('entry selection', () => {
    it('falls back to src/mod.ts when exports["."] is absent', async () => {
      const fs = await Testing.dir('DenoDeploy.stage.fallback-src-mod');
      await Fs.writeJson(fs.join('deno.json'), {
        name: 'root',
        version: '0.0.0',
        workspace: ['./apps/foo'],
      });
      await Fs.writeJson(fs.join('apps/foo/deno.json'), {
        name: '@test/foo',
        version: '0.0.0',
      });
      await Fs.write(fs.join('apps/foo/src/mod.ts'), `export const srcMod = true;\n`);

      const res = await DenoDeploy.stage({ target: { dir: fs.join('apps/foo') } });
      expect((await Fs.readText(res.entry)).data).to.eql(
        `import * as target from './apps/foo/src/mod.ts';\nexport * from './apps/foo/src/mod.ts';\n`,
      );
    });

    it('does not invent a default export for a named-only target', async () => {
      const fs = await Testing.dir('DenoDeploy.stage.named-only');
      await Fs.writeJson(fs.join('deno.json'), {
        name: 'root',
        version: '0.0.0',
        workspace: ['./apps/foo'],
      });
      await Fs.writeJson(fs.join('apps/foo/deno.json'), {
        name: '@test/foo',
        version: '0.0.0',
        exports: { '.': './src/mod.ts' },
      });
      await Fs.write(fs.join('apps/foo/src/mod.ts'), `export const namedOnly = true;\n`);

      const res = await DenoDeploy.stage({ target: { dir: fs.join('apps/foo') } });
      const stageText = (await Fs.readText(res.entry)).data ?? '';
      expect(stageText).to.eql(
        `import * as target from './apps/foo/src/mod.ts';\nexport * from './apps/foo/src/mod.ts';\n`,
      );

      const mod = await import(`file://${res.entry}?v=${slug()}`);
      expect('default' in mod).to.eql(false);
      expect(mod.namedOnly).to.eql(true);
    });
  });
});
