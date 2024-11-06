import { describe, expect, it, slug } from '../-test.ts';
import { sampleDir } from './-u.ts';
import { Fs } from './mod.ts';

describe('Fs: write to the file-system operations', () => {
  const SAMPLE = sampleDir('fs-write');

  it('|→ ensure test directory exists', () => Fs.ensureDir(SAMPLE.dir));

  describe('Fs.remove', () => {
    const testSetup = async () => {
      const dir = SAMPLE.join(`rm-dir-${slug()}`);
      const file = Fs.join(dir, 'text.txt');
      await Fs.ensureDir(dir);
      await Deno.writeTextFile(file, '👋 hello\n');
      return {
        path: { dir, file },
        dirExists: () => Fs.exists(dir),
        fileExists: () => Fs.exists(file),
      } as const;
    };

    it('deletes a directory', async () => {
      const sample = await testSetup();
      expect(await sample.dirExists()).to.eql(true);

      const res = await Fs.remove(sample.path.dir);
      expect(res).to.eql(true);
      expect(await sample.dirExists()).to.eql(false);
    });

    it('deletes a file', async () => {
      const sample = await testSetup();
      expect(await sample.dirExists()).to.eql(true);
      expect(await sample.fileExists()).to.eql(true);

      const res = await Fs.remove(sample.path.file);
      expect(res).to.eql(true);
      expect(await sample.dirExists()).to.eql(true);
      expect(await sample.fileExists()).to.eql(false);
    });

    it('dry run ← directory is not deleted', async () => {
      const sample = await testSetup();
      expect(await sample.dirExists()).to.eql(true);

      await Fs.remove(sample.path.dir, { dryRun: true });
      expect(await sample.dirExists()).to.eql(true);

      await Fs.remove(sample.path.dir); // Clean up.
    });

    it('non-existent target', async () => {
      const dir = Fs.resolve('404-NO-EXIST');
      const file = Fs.join(dir, 'foo.json');
      const a = await Fs.remove(dir);
      const b = await Fs.remove(file);
      expect(a).to.eql(false);
      expect(b).to.eql(false);
    });

    it('stress', async () => {
      const sample = await testSetup();
      expect(await sample.dirExists()).to.eql(true);

      const wait = Array.from({ length: 10 }).map(async () => {
        await Fs.remove(sample.path.dir);
        expect(await sample.dirExists()).to.eql(false);
      });

      await Promise.all(wait);
    });
  });
});
