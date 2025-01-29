import { type t, describe, expect, Fs, it, PATHS, Testing } from '../-test.ts';
import { Sample } from '../m.Vitepress/-u.ts';
import { Vitepress } from '../m.Vitepress/mod.ts';

describe('cmd: backup (shapshot)', () => {
  const assertExists = async (dir: string, exists = true) => {
    expect(await Fs.exists(dir)).to.eql(exists, dir);
  };

  it('perform backup copy', { sanitizeResources: false, sanitizeOps: false }, async () => {
    /**
     * Sequence:
     *  - ↓ init
     *  - ↓ build   (dist)
     *  - ↓ backup  (snapshot)
     */
    await Testing.retry(3, async () => {
      const test = async (args: Pick<t.VitepressBackupArgs, 'includeDist'> = {}) => {
        const { includeDist } = args;
        const sample = Sample.init({});
        const inDir = sample.path;

        const backupDir = Fs.join(inDir, PATHS.backup);
        const distDir = Fs.join(inDir, PATHS.dist);

        const silent = true;
        await Vitepress.Tmpl.update({ inDir, silent });
        await assertExists(distDir, false); // NB: not yet built.

        await Vitepress.build({ inDir, silent });
        await assertExists(backupDir, false); // NB: not yet backed up.

        const res = await Vitepress.backup({ dir: inDir, includeDist });
        const snapshot = res.snapshot;
        const targetDir = snapshot.path.target.files;
        expect(snapshot.error).to.eql(undefined);

        // NB: not copied (ecluded via .ignore list).
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
        await assertTargetExists('package.json', true);
      };

      await test({}); // default: excludes the /dist folder.
      await test({ includeDist: true });
    });
  });
});
