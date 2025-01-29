import { type t, describe, expect, Fs, it, PATHS, SAMPLE, Testing } from '../-test.ts';
import { Vite } from './mod.ts';

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
      const test = async (args: Pick<t.ViteBackupArgs, 'includeDist'> = {}) => {
        const { includeDist } = args;

        const fs = await SAMPLE.fs('Vite.backup').create();
        const dir = fs.dir;
        const backupDir = Fs.join(dir, PATHS.backup);
        const outDir = Fs.join(dir, PATHS.dist);
        const input = Fs.join(dir, 'src/-test/index.html');

        const tmpl = await Vite.Tmpl.create();
        await tmpl.copy(dir);
        await assertExists(outDir, false); // NB: not yet built.

        await Vite.build({ input, outDir });
        await assertExists(outDir, true);
        await assertExists(backupDir, false); // NB: not yet backed up.

        console.info();
        const res = await Vite.backup({ dir, includeDist });
        console.info();
        const snapshot = res.snapshot;
        const targetDir = snapshot.path.target.files;
        expect(snapshot.error).to.eql(undefined);

        const assertTargetExists = async (path: string, exists: boolean) => {
          await assertExists(Fs.join(targetDir, path), exists);
        };

        await assertTargetExists('dist', !!includeDist);
        await assertTargetExists('-backup', false);
        await assertTargetExists('.tmp', false);
        await assertTargetExists('.npmrc', true);
        await assertTargetExists('src/pkg.ts', true);
        await assertTargetExists('README.md', true);
        await assertTargetExists('deno.json', true);
        await assertTargetExists('package.json', true);
        await assertTargetExists('vite.config.ts', true);
      };

      await test({}); // default: excludes the /dist folder.
      await test({ includeDist: true });
    });
  });
});
