import { type t, describe, expect, Fs, it, SAMPLE, Testing } from '../../-test.ts';
import { hasUndefined } from 'fast-json-patch';
import { PATHS } from './common.ts';
import { DenoModule } from './mod.ts';

describe('DenoModule.backup', () => {
  const assertExists = async (dir: string, exists = true) => {
    expect(await Fs.exists(dir)).to.eql(exists, dir);
  };

  it('perform backup copy', { sanitizeResources: false, sanitizeOps: false }, async () => {
    /**
     * Sequence:
     *  - ↓ init
     *  - ↓ build  (dist) ← NB: simulated within sample template.
     *  - ↓ backup (snapshot)
     */
    await Testing.retry(3, async () => {
      const test = async (args: Pick<t.DenoModuleBackupArgs, 'includeDist'> = {}) => {
        const { includeDist } = args;
        const sample = SAMPLE.fs('DenoModule.backup', { slug: true });
        const source = sample.dir;
        const target = Fs.join(source, PATHS.backup);

        // Copy in sample project-files to create snapshot/backup of.
        const tmpl = SAMPLE.sample1.tmpl();
        await tmpl.copy(source);
        await assertExists(Fs.join(source, PATHS.dist), true);
        await assertExists(Fs.join(source, PATHS.tmp), true);

        console.info();
        const res = await DenoModule.backup({
          source,
          target,
          includeDist,
          silent: false, // NB: default.
        });

        const snapshot = res.snapshot;
        const targetDir = snapshot.path.target.files;
        expect(snapshot.error).to.eql(undefined);

        // NB: not copied (ecluded via .ignore list).
        const assertTargetExists = async (path: string, exists: boolean) => {
          await assertExists(Fs.join(targetDir, path), exists);
        };

        await assertTargetExists('dist', !!includeDist);
        await assertTargetExists('-backup', false);
        await assertTargetExists('.tmp', false);
        await assertTargetExists('src', true);
        await assertTargetExists('package.json', true);
      };

      await test({}); // default: excludes the /dist folder.
      await test({ includeDist: true });
      console.info();
    });
  });

});
