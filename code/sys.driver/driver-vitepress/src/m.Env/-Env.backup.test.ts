import { Testing, Fs, Ignore, PATHS, describe, expect, it } from '../-test.ts';
import { Sample } from '../m.VitePress/-u.ts';
import { Env } from './mod.ts';
import { VitePress } from '../m.VitePress/mod.ts';

describe('cmd: backup', () => {
  const setup = async () => {
    const text = await Deno.readTextFile(Fs.join(PATHS.tmpl.source, '.gitignore'));
    const gitignore = Ignore.create(text);
    return { gitignore };
  };

  const assertExists = async (dir: string, exists = true) => {
    expect(await Fs.exists(dir)).to.eql(exists);
  };

  it('perform backup copy', async () => {
    await Testing.retry(3, async () => {
      const sample = Sample.init({ slug: true });
      const inDir = sample.path;

      const backupDir = Fs.join(inDir, PATHS.backup);
      const distDir = Fs.join(inDir, PATHS.dist);

      const silent = true;
      await Env.update({ inDir, silent });
      await assertExists(distDir, false); // NB: not yet built.

      await VitePress.build({ inDir, silent });
      await assertExists(backupDir, false); // NB: not yet backed up.

      const res = await Env.backup({ inDir });
      const snapshot = res.snapshot;
      const targetDir = snapshot.path.target;
      expect(snapshot.error).to.eql(undefined);

      // NB: not copied (ecluded via .ignore list).
      const assertTargetExists = (path: string, exists: boolean) =>
        assertExists(Fs.join(targetDir, path), exists);

      await assertTargetExists('dist', false);
      await assertTargetExists('-backup', false);
      await assertTargetExists('.sys', true);
      await assertTargetExists('.tmp', false);
      await assertTargetExists('.vitepress', true);
      await assertTargetExists('.vitepress/cache', false);
      await assertTargetExists('docs', true);
      await assertTargetExists('src', true);
      await assertTargetExists('deno.json', true);
      await assertTargetExists('package.json', true);
    });
  });
});
