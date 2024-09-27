import { exists } from '@std/fs/exists';
import { describe, expect, it, slug } from '../-test.ts';
import { Fs } from './mod.ts';

describe('Fs: filesystem', () => {
  const testDir = Fs.resolve('./.tmp/test');
  it('ensure test dir', () => Fs.ensureDir(testDir));

  it('glob', async () => {
    const base = Fs.resolve();
    const glob = Fs.glob(base);

    const matches = await glob.find('**');
    expect(matches.length).to.be.greaterThan(3);

    const self = matches.find((item) => item.path === import.meta.filename);
    expect(self?.isFile).to.eql(true);
    expect(self?.name).to.eql(Fs.Path.basename(import.meta.filename ?? ''));
  });

  describe('Fs.deleteDir', () => {
    const testSetup = async () => {
      const path = Fs.join(testDir, `rm-dir-${slug()}`);
      await Fs.ensureDir(path);
      await Deno.writeTextFile(Fs.join(path, 'text.txt'), '👋 hello\n');
      return {
        path,
        exists() {
          return Fs.exists(path);
        },
      };
    };

    it('deletes a directory', async () => {
      const testDir = await testSetup();
      expect(await testDir.exists()).to.eql(true);

      await Fs.removeDir(testDir.path);
      expect(await testDir.exists()).to.eql(false);
    });

    it('dry run ← directory is not deleted', async () => {
      const testDir = await testSetup();
      expect(await testDir.exists()).to.eql(true);

      await Fs.removeDir(testDir.path, { dry: true });
      expect(await testDir.exists()).to.eql(true);

      await Fs.removeDir(testDir.path); // Clean up.
    });
  });
});
