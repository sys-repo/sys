import { type t, describe, expect, Fs, it, PATHS, Testing } from '../-test.ts';
import { Sample } from '../m.Vitepress/-u.ts';
import { Vitepress } from '../m.Vitepress/mod.ts';

describe('cmd: backup (shapshot)', () => {
  const assertExists = async (path: string, exists = true) => {
    expect(await Fs.exists(path)).to.eql(exists, `path should exist: ${path}`);
  };

  it('perform backup copy', { sanitizeResources: false, sanitizeOps: false }, async () => {
    /**
     * Sequence:
     *  - ↓ init
     *  - ↓ build   (dist)
     *  - ↓ backup  (snapshot)
     */
    const test = async (args: Pick<t.VitepressBackupArgs, 'includeDist'> = {}) => {
      await Testing.retry(2, async () => {
        const { includeDist } = args;
        const sample = Sample.init({});
        const cwd = sample.path;
        const inDir = sample.path;
        const backupDir = Fs.join(inDir, PATHS.backup);
        const distDir = Fs.join(inDir, PATHS.dist);

        const silent = true;
        await Vitepress.Tmpl.write({ inDir, silent });
        await assertExists(distDir, false); // NB: not yet built.

        const buildResponse = await Vitepress.build({ inDir, silent });
        await assertExists(backupDir, false); // NB: not yet backed up.

        const res = await Vitepress.backup({ dir: inDir, includeDist });
        const snapshot = res.snapshot;
        const targetDir = snapshot.path.target.files;
        expect(snapshot.error).to.eql(undefined);

        const assertTargetExists = async (path: string, exists: boolean) => {
          await assertExists(Fs.join(targetDir, path), exists);
        };

        await assertTargetExists('dist', !!includeDist);
        await assertTargetExists('-backup', false);
        await assertTargetExists('.sys', true);
        await assertTargetExists('.tmp', false);
        await assertTargetExists('.vitepress', true);
        await assertTargetExists('.vitepress/cache', false);
        await assertTargetExists('docs', true);
        await assertTargetExists('src', true);
        await assertTargetExists('deno.json', true);
        await assertTargetExists('imports.json', true);
        await assertTargetExists('.gitignore', true);
      });
    };

    await test({}); // default: excludes the /dist folder.
    await test({ includeDist: true });
  });
});
