import { type t, Fs, PATHS, Testing, describe, expect, it } from '../-test.ts';
import { Sample } from '../m.VitePress/-u.ts';
import { VitePress } from '../m.VitePress/mod.ts';
import { Env } from './mod.ts';

describe('cmd: backup (shapshot)', () => {
  const assertExists = async (dir: string, exists = true) => {
    expect(await Fs.exists(dir)).to.eql(exists, dir);
  };

  it('perform backup copy', { sanitizeResources: false, sanitizeOps: false }, async () => {
    /**
     *
     * sequence:
     *  - ↓ init
     *  - ↓ build   (dist)
     *  - ↓ backup  (snapshot)
     *
     */
    await Testing.retry(3, async () => {
      const test = async (args: Pick<t.VitePressBackupArgs, 'includeDist'> = {}) => {
        const { includeDist } = args;
        const sample = Sample.init({});
        const inDir = sample.path;

        const backupDir = Fs.join(inDir, PATHS.backup);
        const distDir = Fs.join(inDir, PATHS.dist);

        const silent = true;
        await Env.update({ inDir, silent });
        await assertExists(distDir, false); // NB: not yet built.

        await VitePress.build({ inDir, silent });
        await assertExists(backupDir, false); // NB: not yet backed up.

        const res = await Env.backup({ inDir, includeDist });
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
