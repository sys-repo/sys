import { describe, expect, it, slug } from '../-test.ts';
import { sampleDir } from './-u.ts';
import { Fs } from './mod.ts';

describe('Fs: directory operations', () => {
  const setupCopyTest = async () => {
    const SAMPLE = sampleDir('fs-dir');
    await SAMPLE.ensureExists();

    const text = `sample-${slug()}\n`;
    const name = 'foo.txt';
    const a = SAMPLE.join('a');
    const b = SAMPLE.join('b');

    await Fs.ensureDir(a);
    await Deno.writeTextFile(Fs.join(a, name), text);

    return {
      SAMPLE,
      dir: { a, b },
      file: { text, name, a: Fs.join(a, name), b: Fs.join(b, name) },
    } as const;
  };

  const assertFileText = async (path: string, text: string) => {
    expect(await Deno.readTextFile(path)).to.eql(text);
  };

  describe('Fs.copyDir', () => {
    describe('success', () => {
      it('success: flat', async () => {
        const { dir, file } = await setupCopyTest();
        expect(await Fs.exists(dir.a)).to.eql(true);
        expect(await Fs.exists(dir.b)).to.eql(false);

        const res = await Fs.copyDir(dir.a, dir.b);
        expect(res.error).to.eql(undefined);

        expect(await Fs.exists(dir.b)).to.eql(true);
        expect(await Fs.exists(file.b)).to.eql(true);
        await assertFileText(file.b, file.text);
      });

      it('success: deep', async () => {
        const sample = await setupCopyTest();
        const { dir } = sample;

        const text = `sample-${slug()}\n`;
        const deepPath = Fs.join('foo', 'bar', 'file.txt');
        const deepA = Fs.join(dir.a, deepPath);
        const deepB = Fs.join(dir.b, deepPath);

        await Fs.ensureDir(Fs.dirname(deepA));
        await Deno.writeTextFile(deepA, text);

        const res = await Fs.copyDir(dir.a, dir.b);
        expect(res.error).to.eql(undefined);
        await assertFileText(deepB, text);
      });

      it('success: {force} overwrite', async () => {
        const sample = await setupCopyTest();
        const { dir, file } = sample;

        // First copy dir to create the scenario of the target already existing.
        await Fs.copyDir(dir.a, dir.b);
        expect(await Fs.exists(dir.b)).to.eql(true);

        const diff1 = `sample-${slug()}`;
        const diff2 = `sample-${slug()}`;
        const p1 = Fs.join(dir.a, file.name);
        const p2 = Fs.join(dir.a, 'foobar.txt');
        await Deno.writeTextFile(p1, diff1);
        await Deno.writeTextFile(p2, diff2);

        const res = await Fs.copyDir(dir.a, dir.b, { force: true });
        expect(res.error).to.eql(undefined); // NB: success.

        await assertFileText(p1, diff1);
        await assertFileText(p2, diff2);
      });
    });

    describe('errors', () => {
      it('error: invalid source directory', async () => {
        const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        const sample = await setupCopyTest();
        const { dir } = sample;
        const test = async (sourceDir: any, expectedError: string) => {
          const res = await Fs.copyDir(sourceDir, dir.b);
          expect(res.error?.message).to.include(expectedError);
        };

        await test('./404', 'Copy error - source directory does not exist');
        for (const value of NON) {
          await test(value, 'Copy error - source directory is not a valid');
        }
      });

      it('error: not forced AND directory already exists', async () => {
        const test = async (force?: boolean, error?: string) => {
          const sample = await setupCopyTest();
          const { dir } = sample;

          // First copy dir to create the scenario of the target already existing.
          await Fs.copyDir(dir.a, dir.b);
          expect(await Fs.exists(dir.b)).to.eql(true);

          const res = await Fs.copyDir(dir.a, dir.b, { force });
          if (error) expect(res.error?.message).to.include(error);
        };

        const err = 'Cannot copy over existing directory';
        await test(undefined, err); // Default: false
        await test(false, err);
        await test(true); // NB: forced - no problem.
      });
    });
  });

  describe('Fs.copyFile', () => {
    describe('success', () => {
      it('success: flat', async () => {
        const { dir, file } = await setupCopyTest();
        expect(await Fs.exists(dir.a)).to.eql(true);
        expect(await Fs.exists(dir.b)).to.eql(false); // NB: copyFile will ensure the parent dir.

        const res = await Fs.copyFile(file.a, file.b);
        expect(res.error).to.eql(undefined);

        expect(await Fs.exists(dir.b)).to.eql(true);
        expect(await Fs.exists(file.b)).to.eql(true); // NB: parent dir created.
        await assertFileText(file.b, file.text);
      });

      it('success: replaces directory ← {force:true}', async () => {
        const { dir, file } = await setupCopyTest();
        await Fs.copyDir(dir.a, dir.b);
        expect(await Fs.exists(dir.a)).to.eql(true);
        expect(await Fs.exists(dir.b)).to.eql(true); // NB: copyFile will ensure the parent dir.

        const res = await Fs.copyFile(file.a, dir.b, { force: true });
        expect(res.error).to.eql(undefined);
        await assertFileText(dir.b, file.text); // NB: now a file.
      });
    });

    describe('errors', () => {
      it('error: invalid source file-path', async () => {
        const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        const sample = await setupCopyTest();
        const { dir } = sample;
        const test = async (sourceFile: any, expectedError: string) => {
          const res = await Fs.copyFile(sourceFile, dir.b);
          expect(res.error?.message).to.include(expectedError);
        };

        await test('./404', 'Copy error - source file does not exist');
        for (const value of NON) {
          await test(value, 'Copy error - source file path is not a valid');
        }
      });

      it('error: source file-path is a directory', async () => {
        const sample = await setupCopyTest();
        const { dir, file } = sample;
        const res = await Fs.copyFile(dir.a, file.b);
        expect(res.error?.message).to.include('Cannot copy file - the given path is a directory');
      });

      it('error: not forced AND file already exists', async () => {
        const test = async (force?: boolean, error?: string) => {
          const sample = await setupCopyTest();
          const { file } = sample;

          // First copy dir to create the scenario of the target already existing.
          await Fs.copyFile(file.a, file.b);
          expect(await Fs.exists(file.b)).to.eql(true);

          const res = await Fs.copyFile(file.a, file.b, { force });
          if (error) expect(res.error?.message).to.include(error);
        };

        const err = `Cannot copy over existing file`;
        await test(undefined, err); // Default: false.
        await test(false, err);
        await test(true); // NB: forced - no problem.
      });
    });

    it('error: target  (and not forced)', async () => {
      const sample = await setupCopyTest();
      const { dir, file } = sample;

      // First copy dir to create the scenario of the target already existing.
      await Fs.copyFile(file.a, file.b);

      const res1 = await Fs.copyFile(file.a, dir.b);
      const res2 = await Fs.copyFile(file.a, file.b);
      expect(res1.error?.message).to.include('Cannot copy over existing directory');
      expect(res2.error?.message).to.include('Cannot copy over existing file');
    });
  });
});
