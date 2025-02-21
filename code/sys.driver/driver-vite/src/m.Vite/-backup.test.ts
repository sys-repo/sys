import { type t, c, describe, expect, Fs, it, PATHS, pkg, SAMPLE, Testing } from '../-test.ts';
import { Vite } from './mod.ts';

describe.skip('cmd: backup (shapshot)', () => {
  const { brightCyan: cyan } = c;
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
    await Testing.retry(1, async () => {
      const test = async (args: Pick<t.ViteBackupArgs, 'includeDist'> = {}) => {
        const { includeDist } = args;

        const fs = SAMPLE.fs('Vite.backup');
        await Fs.copy(SAMPLE.Dirs.sample2, fs.dir);
        const dir = fs.dir;

        const backupDir = Fs.join(dir, PATHS.backup);
        const outDir = Fs.join(dir, PATHS.dist);

        await assertExists(outDir, false); //    NB: not yet built.
        await assertExists(backupDir, false); // NB: not yet backed-up.

        const buildResult = await Vite.build({ cwd: dir, pkg });
        if (!buildResult.ok) console.error(buildResult.toString());

        expect(buildResult.ok).to.eql(true);
        await assertExists(outDir, true);
        await assertExists(backupDir, false); // NB: not yet backed up.

        console.info();
        const res = await Vite.backup({ dir, includeDist });
        console.info();

        const snapshot = res.snapshot;
        const targetDir = snapshot.path.target.files;
        expect(snapshot.error).to.eql(undefined);

        const assertBackupExists = async (path: t.StringPath, exists: boolean) => {
          await assertExists(Fs.join(targetDir, path), exists);
        };

        await assertBackupExists('dist', !!includeDist);
        await assertBackupExists('-backup', false); // NB: the "-backup" folder is not duplicated into the backup copy.
        await assertBackupExists('src/common.ts', true);
        await assertBackupExists('src/m.foo.ts', true);
        await assertBackupExists('src/ui.tsx', true);
        await assertBackupExists('vite.config.ts', true);

        const inclDist = includeDist ? c.gray(c.italic(`/dist included`)) : '';
        console.info(cyan(c.bold('Sequence:')));
        console.info(cyan(` ↓ init      ${c.gray(c.italic('(copied from sample)'))}`));
        console.info(cyan(` ↓ build`));
        console.info(cyan(` ↓ backup  ${c.green(c.bold('← Snapshot'))} ${inclDist}`));
        console.info();
      };

      await test({}); // default: excludes the "/dist" folder.
      await test({ includeDist: true });
    });
  });
});
