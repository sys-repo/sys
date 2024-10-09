import { Path as StdPath } from '@sys/std';
import { describe, expect, it, slug, type t } from '../-test.ts';
import { Fs, Path } from './mod.ts';

describe('Fs: filesystem', () => {
  const testDir = Fs.resolve('./.tmp/test');
  it('ensure test directory exists', () => Fs.ensureDir(testDir));

  describe('Fs.Is', () => {
    const Is = Fs.Is;

    it('has mapped Path methods', () => {
      // NB: mapped helpers (convenience).
      expect(Is.absolute).to.equal(Fs.Path.Is.absolute);
      expect(Is.glob).to.equal(Fs.Path.Is.glob);
    });

    it('Is.dir', async () => {
      expect(await Is.dir(Path.resolve('.'))).to.eql(true);
      expect(await Is.dir(Path.resolve('./deno.json'))).to.eql(false);
      expect(await Is.dir(Path.resolve('./404.json'))).to.eql(false); // NB: target does not exist.
    });
  });

  describe('Fs.Path', () => {
    it('refs', () => {
      expect(Fs.Path).to.equal(Path);
      expect(Fs.Path).to.not.equal(StdPath);
      expect(Fs.join).to.eql(Path.join);
      expect(Fs.resolve).to.eql(Path.resolve);
      expect(Fs.dirname).to.eql(Path.dirname);
      expect(Fs.basename).to.eql(Path.basename);
    });

    it('asDir', async () => {
      const path1 = Path.resolve('.');
      const path2 = Path.resolve('./deno.json');
      const path3 = Path.resolve('./404.json');

      const res1 = await Fs.Path.asDir(path1);
      const res2 = await Fs.Path.asDir(path2);
      const res3 = await Fs.Path.asDir(path3);

      expect(res1).to.eql(path1);
      expect(res2).to.eql(path1); // NB: stepped up to parent.
      expect(res3).to.eql(path3); // NB: not-found, no change.
    });
  });

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
