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

  it('ignore: via ".gitignore"', async () => {
    const { gitignore } = await setup();

    const test = (path: string, expected: boolean) => {
      expect(gitignore.isIgnored(path)).to.eql(expected, path);
    };

    // Ignored (not backed up).
    test('.backup/', true);
    test('foo/.backup/', true);
    test('foo/.backup/xxx.000', true);
    test('.tmp/sample/.backup/1735782009153.u4toce/.vitepress', true);
    test('dist/index.html', true);
    test('.tmp/sample/dist/index.html', true);

    // Not ignored (is backed up).
    test('deno.json', false);
  });

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

      // NB: not copied (ecluded via .gitignore).
      await assertExists(Fs.join(targetDir, 'dist'), false);
      await assertExists(Fs.join(targetDir, '.backup'), false);
      await assertExists(Fs.join(targetDir, '.sys'), true);
      await assertExists(Fs.join(targetDir, '.vitepress'), true);
      await assertExists(Fs.join(targetDir, 'docs'), true);
      await assertExists(Fs.join(targetDir, 'src'), true);
      await assertExists(Fs.join(targetDir, 'deno.json'), true);
      await assertExists(Fs.join(targetDir, 'package.json'), true);
    });
  });
});
