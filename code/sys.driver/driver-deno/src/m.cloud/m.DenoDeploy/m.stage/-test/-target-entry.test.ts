import { describe, expect, Fs, it, slug, Str, Testing } from '../../../../-test.ts';
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
      await Fs.writeJson(fs.join('code/apps/ghost/deno.json'), {
        name: '@test/ghost',
        version: '0.0.0',
        exports: { '.': './src/mod.ts' },
      });
      await Fs.write(fs.join('code/apps/ghost/src/mod.ts'), `export const ghost = true;\n`);

      const targetDir = fs.join('code/apps/ghost');
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
        workspace: ['./code/apps/foo'],
      });
      await Fs.writeJson(fs.join('code/apps/foo/deno.json'), {
        name: '@test/foo',
        version: '0.0.0',
        tasks: { build: 'deno run -A ./-scripts/task.build.ts' },
      });
      await Fs.write(fs.join('code/apps/foo/src/mod.ts'), `export const srcMod = true;\n`);
      await Fs.write(
        fs.join('code/apps/foo/-scripts/task.build.ts'),
        Str.dedent(`
          await Deno.mkdir('dist', { recursive: true });
          await Deno.writeTextFile('dist/index.html', '<!doctype html><html><body>foo</body></html>');
        `),
      );

      const res = await DenoDeploy.stage({ target: { dir: fs.join('code/apps/foo') } });
      expect((await Fs.readText(res.entry)).data).to.eql(
        `export const targetDir = './code/apps/foo';\n`,
      );
    });

    it('does not invent a default export for a named-only target', async () => {
      const fs = await Testing.dir('DenoDeploy.stage.named-only');
      await Fs.writeJson(fs.join('deno.json'), {
        name: 'root',
        version: '0.0.0',
        workspace: ['./code/apps/foo'],
      });
      await Fs.writeJson(fs.join('code/apps/foo/deno.json'), {
        name: '@test/foo',
        version: '0.0.0',
        exports: { '.': './src/mod.ts' },
        tasks: { build: 'deno run -A ./-scripts/task.build.ts' },
      });
      await Fs.write(fs.join('code/apps/foo/src/mod.ts'), `export const namedOnly = true;\n`);
      await Fs.write(
        fs.join('code/apps/foo/-scripts/task.build.ts'),
        Str.dedent(`
          await Deno.mkdir('dist', { recursive: true });
          await Deno.writeTextFile('dist/index.html', '<!doctype html><html><body>foo</body></html>');
        `),
      );

      const res = await DenoDeploy.stage({ target: { dir: fs.join('code/apps/foo') } });
      const stageText = (await Fs.readText(res.entry)).data ?? '';
      expect(stageText).to.eql(`export const targetDir = './code/apps/foo';\n`);

      const mod = await import(`file://${res.entry}?v=${slug()}`);
      expect(mod.targetDir).to.eql('./code/apps/foo');
    });
  });
});
