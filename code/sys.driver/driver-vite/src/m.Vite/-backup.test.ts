import { type t, c, describe, expect, Fs, it, PATHS, pkg, SAMPLE, Testing } from '../-test.ts';
import { Vite } from './mod.ts';

describe('cmd: backup (shapshot)', () => {
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
    await Testing.retry(2, async () => {
      const test = async (args: Pick<t.ViteBackupArgs, 'includeDist'> = {}) => {
        const { includeDist } = args;

        const fs = await SAMPLE.fs('Vite.backup').create();
        const cwd = fs.dir;
        const dir = fs.dir;

        const backupDir = Fs.join(cwd, PATHS.backup);
        const outDir = Fs.join(cwd, PATHS.dist);

        const tmpl = await Vite.Tmpl.create();
        await tmpl.copy(cwd);

        await assertExists(outDir, false); //    NB: not yet built.
        await assertExists(backupDir, false); // NB: not yet backed-up.

        const buildResult = await Vite.build({ cwd, pkg });
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
        await assertTargetExists('.gitignore', true);

        console.info(cyan(c.bold('Sequence:')));
        console.info(cyan(` ↓ init    ${c.gray(c.italic('(from template)'))}`));
        console.info(cyan(` ↓ build`));
        console.info(cyan(` ↓ backup  ${c.green(c.bold('← Snapshot'))}`));
        console.info();
      };

      await test({}); // default: excludes the "/dist" folder.
      await test({ includeDist: true });
    });
  });
});
