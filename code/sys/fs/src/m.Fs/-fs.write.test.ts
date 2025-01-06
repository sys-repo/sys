import { describe, expect, expectError, it, sampleDir, slug, type t } from '../-test.ts';
import { Fs } from './mod.ts';

describe('Fs: write to the file-system operations', () => {
  const Sample = sampleDir('Fs.write');
  it('|→ ensure test directory exists', () => Fs.ensureDir(Sample.dir));

  describe('Fs.remove', () => {
    const testSetup = async () => {
      const dir = Sample.join(`Fs.remove-${slug()}`);
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

  describe('Fs.write', () => {
    const getDir = () => Sample.join(`Fs.write-${slug()}`);

    it('write: string', async () => {
      const path = Fs.join(getDir(), 'foo.txt');
      const data = '👋';

      expect(await Fs.exists(path)).to.eql(false);
      const res = await Fs.write(path, data);

      expect(res.error).to.eql(undefined);
      expect(res.overwritten).to.eql(false);
      expect(await Fs.exists(path)).to.eql(true);
      expect(await Deno.readTextFile(path)).to.eql(data);
    });

    it('write: binary', async () => {
      const path = Fs.join(getDir(), 'foo.dat');
      const data = new Uint8Array([1, 2, 3]);

      expect(await Fs.exists(path)).to.eql(false);
      const res = await Fs.write(path, data);
      expect(res.error).to.eql(undefined);
      expect(res.overwritten).to.eql(false);
      expect(await Fs.exists(path)).to.eql(true);
      expect(await Deno.readFile(path)).to.eql(data);
    });

    describe('param: {force}', () => {
      const a = '👋';
      const b = new Uint8Array([1, 2, 3]);

      it('force: true (default)', async () => {
        const path = Fs.join(getDir(), 'myfile');
        await Fs.write(path, a);
        const res = await Fs.write(path, b);
        expect(await Deno.readFile(path)).to.eql(b);
        expect(res.error).to.eql(undefined);
        expect(res.overwritten).to.eql(true);
      });

      it('force: false', async () => {
        const path = Fs.join(getDir(), 'myfile');
        await Fs.write(path, a);
        expect(await Deno.readTextFile(path)).to.eql(a);

        const res = await Fs.write(path, b, { force: false });
        expect(await Deno.readTextFile(path)).to.eql(a); // NB: not over-written.

        expect(res.error?.message).to.include('Failed to write because a file already exists');
        expect(res.error?.message).to.include(path);
        expect(res.overwritten).to.eql(false);
      });

      it('{throw:true}: throws when target exists (unforced)', async () => {
        const path = Fs.join(getDir(), 'foo.txt');
        await Fs.write(path, '🌼'); // NB: setup first file to (not) overwrite.

        const fn = () => Fs.write(path, '💥', { force: false, throw: true });
        await expectError(fn, 'Failed to write because a file already exists');
      });
    });
  });

  describe('Fs.writeJson', () => {
    const getDir = () => Sample.join(`Fs.write-${slug()}`);
    const getPath = () => Fs.join(getDir(), 'foo.json');

    const assertJsonFile = async (path: string, data: t.Json) => {
      const text = await Deno.readTextFile(path);
      expect(text.at(-1)).to.eql('\n');
      expect(text).to.includes(JSON.stringify(data, null, '  '));
    };

    it('write {object}', async () => {
      const path = getPath();
      const data = { foo: { bar: 123 } };

      const a = await Fs.writeJson(path, data);
      const b = await Fs.writeJson(path, data);

      expect(a.error).to.eql(undefined);
      expect(b.error).to.eql(undefined);
      expect(a.overwritten).to.eql(false);
      expect(b.overwritten).to.eql(true);

      await assertJsonFile(path, data);
    });

    describe('error (while serializing)', () => {
      const circular: any = { foo: { bar: 123 } };
      circular.foo['zoo'] = circular.foo; // NB: setup circular-reference to cause error.

      it('error: (default)', async () => {
        const path = getPath();
        const res = await Fs.writeJson(path, circular);
        expect(res.error?.message).to.include('Failed while serializing JSON to save to file');
        expect(res.error?.cause?.message).to.include('Converting circular structure to JSON');
      });

      it('error: throw', async () => {
        const path = getPath();
        const fn = () => Fs.writeJson(path, circular, { throw: true });
        await expectError(fn, 'Failed while serializing JSON to save to file');
      });
    });
  });
});
