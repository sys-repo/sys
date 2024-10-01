import { describe, expect, it, slug, type t } from '../-test.ts';
import { Fs } from './mod.ts';

describe('Fs: filesystem', () => {
  const testDir = Fs.resolve('./.tmp/test');
  it('ensure test directory exists', () => Fs.ensureDir(testDir));

  it('Fs.glob', async () => {
    const base = Fs.resolve();
    const glob = Fs.glob(base);
    expect(glob.base).to.eql(base);

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
        exists: () => Fs.exists(path),
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

  describe('Fs.readJsonFile', () => {
    it('success (file exists)', async () => {
      const path = Fs.resolve('./deno.json');
      const res = await Fs.readJsonFile<t.Pkg>(path);

      expect(res.ok).to.eql(true);
      expect(res.path).to.eql(path);
      expect(res.json?.name).to.eql('@sys/std-s');
      expect(res.error).to.eql(undefined);
      expect(res.errorReason).to.eql(undefined);
    });

    it('fail: does not exist (404)', async () => {
      const path = '404-no-exist.json';
      const res = await Fs.readJsonFile(path);

      expect(res.ok).to.eql(false);
      expect(res.path).to.eql(path);
      expect(res.error?.message).to.include('JSON file does not exist at path');
      expect(res.error?.message).to.include(path);
      expect(res.errorReason).to.eql('NotFound');
    });

  });
});
