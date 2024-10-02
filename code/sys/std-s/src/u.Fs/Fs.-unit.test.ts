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
    it('success', async () => {
      const path = Fs.resolve('./deno.json');
      const res = await Fs.readJson<t.Pkg>(path);

      expect(res.ok).to.eql(true);
      expect(res.exists).to.eql(true);
      expect(res.path).to.eql(path);
      expect(res.json?.name).to.eql('@sys/std-s');
      expect(res.error).to.eql(undefined);
      expect(res.errorReason).to.eql(undefined);
    });

    it('fail: does not exist (404)', async () => {
      const path = '404-no-exist.json';
      const res = await Fs.readJson(path);

      expect(res.ok).to.eql(false);
      expect(res.exists).to.eql(false);
      expect(res.path).to.eql(path);
      expect(res.errorReason).to.eql('NotFound');
      expect(res.error?.message).to.include('JSON file does not exist at path');
      expect(res.error?.message).to.include(path);
    });

    it('fail: JSON parse error', async () => {
      const path = Fs.resolve('./README.md'); // NB: markdown not parse-able as JSON.
      const res = await Fs.readJson<t.Pkg>(path);
      expect(res.ok).to.eql(false);
      expect(res.exists).to.eql(true);
      expect(res.path).to.eql(path);
      expect(res.errorReason).to.eql('ParseError');
      expect(res.error?.message).to.include('Unexpected token');
    });
  });

  describe('Fs.walkUp', () => {
    it('starts at dir', async () => {
      const fired: t.FsWalkUpCallbackArgs[] = [];
      await Fs.walkUp('./deno.json', (e) => fired.push(e));

      expect(fired.length).to.greaterThan(3);
      const first = fired[0];
      const last = fired[fired.length - 1];

      expect(first.dir).to.eql(Fs.resolve('.')); // NB: the parent dir, not the given file.
      expect(last.dir).to.eql('/');
    });

    it('walks up and stops before end', async () => {
      const fired: t.FsWalkUpCallbackArgs[] = [];
      await Fs.walkUp('./deno.json', (e) => {
        fired.push(e);
        if (fired.length > 1) e.stop();
      });
      expect(fired.length).to.eql(2); // NB: because stopped.
    });

    it('retrieves files from callback', async () => {
      const fired: t.FsWalkUpCallbackArgs[] = [];
      const files: t.FsWalkFile[] = [];
      await Fs.walkUp('./deno.json', async (e) => {
        fired.push(e);
        files.push(...(await e.files()));
        e.stop();
      });
      const names = files.map((e) => e.name);
      expect(names.includes('README.md')).to.eql(true);
      expect(names.includes('deno.json')).to.eql(true);
    });
  });
});
