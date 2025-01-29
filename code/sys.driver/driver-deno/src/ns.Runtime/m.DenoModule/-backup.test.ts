import { type t, describe, expect, Fs, it, SAMPLE } from '../../-test.ts';
import { PATHS } from './common.ts';
import { DenoModule } from './mod.ts';

describe('DenoModule.backup', () => {
  const sampleFs = (slug = true) => SAMPLE.fs('DenoModule.backup', { slug });

  const assertExists = async (dir: string, exists = true) => {
    expect(await Fs.exists(dir)).to.eql(exists, dir);
  };

  const loadMeta = async (path: t.StringPath) => {
    const json = await Fs.readJson<t.DirSnapshotMeta>(path);
    return json.data;
  };

  it('perform backup copy', { sanitizeResources: false, sanitizeOps: false }, async () => {
    /**
     * Sequence:
     *  - ↓ init
     *  - ↓ build  (dist) ← NB: simulated within sample template.
     *  - ↓ backup (snapshot)
     */
    const test = async (args: Pick<t.DenoModuleBackupArgs, 'includeDist'> = {}) => {
      const { includeDist } = args;
      const sample = sampleFs();
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
      expect(snapshot.error).to.eql(undefined);

      const assertTargetExists = async (path: string, exists: boolean) => {
        const targetDir = snapshot.path.target.files;
        await assertExists(Fs.join(targetDir, path), exists);
      };

      await assertTargetExists('dist/', !!includeDist); // NB: not copied (excluded via .ignore list).
      await assertTargetExists('-backup/', false);
      await assertTargetExists('.tmp/', true);
      await assertTargetExists('src/', true);
      await assertTargetExists('package.json', true);

      console.info();
      console.info(await Fs.ls(target, { trimCwd: true }));
    };

    await test({ includeDist: false }); // default: excludes the "/dist" folder.
    await test({ includeDist: true });
    console.info();
  });

  it('custom filter', async () => {
    const sample = sampleFs();
    const source = sample.dir;

    await SAMPLE.sample1.tmpl().copy(source);
    await assertExists(Fs.join(source, PATHS.dist), true);
    await assertExists(Fs.join(source, PATHS.tmp), true);

    console.info();
    const res = await DenoModule.backup({
      source,
      includeDist: true, // NB: overridden below in filter.
      filter(absolute) {
        const relative = absolute.slice(source.length + 1);
        if (relative.startsWith(PATHS.dist)) return false;
        if (relative.startsWith(PATHS.tmp)) return false;
        return true;
      },
    });
    console.info();

    const assertTargetExists = async (path: string, exists: boolean) => {
      const targetDir = res.snapshot.path.target.files;
      await assertExists(Fs.join(targetDir, path), exists);
    };

    await assertTargetExists('dist/', false); // NB: excluded via filter function.
    await assertTargetExists('.tmp/', false);
    await assertTargetExists('src/', true);
    await assertTargetExists('README.md', true);
  });

  it('ignore ("text" argument)', async () => {
    const sample = sampleFs();
    const source = sample.dir;

    await SAMPLE.sample1.tmpl().copy(source);
    await assertExists(Fs.join(source, PATHS.dist), true);
    await assertExists(Fs.join(source, PATHS.tmp), true);

    const ignore = `
      .tmp/
      dist/
    `;

    console.info();
    const res = await DenoModule.backup({
      source,
      includeDist: true, // NB: overridden below in "ignore" list.
      ignore,
    });
    console.info();

    const assertTargetExists = async (path: string, exists: boolean) => {
      const targetDir = res.snapshot.path.target.files;
      await assertExists(Fs.join(targetDir, path), exists);
    };

    await assertTargetExists('dist/', false); // NB: excluded via "ignore" list.
    await assertTargetExists('.tmp/', false);
    await assertTargetExists('src/', true);
    await assertTargetExists('README.md', true);
  });

  it('{message} param ← commit details', async () => {
    const sample = sampleFs();
    const source = sample.dir;
    await SAMPLE.sample1.tmpl().copy(source);

    const message = '👋 hello';

    console.info();
    const res = await DenoModule.backup({ source, message });
    console.info();

    const meta = await loadMeta(res.snapshot.path.target.meta);
    expect(meta?.message).to.eql(message);
    expect(meta?.hx.digest).to.eql(res.snapshot.hx.digest);
  });
});
