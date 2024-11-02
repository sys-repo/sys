import { describe, expect, it, slug } from '../-test.ts';
import { sampleDir } from './-u.ts';
import { Fs } from './mod.ts';

describe('Fs: directory operations', () => {
  describe('Fs.copyDir', () => {
    const setupCopyDirTest = async () => {
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
        file: { name, text },
      } as const;
    };

    const assertFileText = async (path: string, text: string) => {
      expect(await Deno.readTextFile(path)).to.eql(text);
    };

    describe('success', () => {
      it('success', async () => {
        const { dir, file } = await setupCopyDirTest();
        const filepath = Fs.join(dir.b, file.name);
        expect(await Fs.exists(dir.a)).to.eql(true);
        expect(await Fs.exists(dir.b)).to.eql(false);

        const res = await Fs.copyDir(dir.a, dir.b);

        expect(await Fs.exists(dir.b)).to.eql(true);
        expect(await Fs.exists(filepath)).to.eql(true);
        expect(res.error).to.eql(undefined);
      });

      it('success: deep copy', async () => {
        const sample = await setupCopyDirTest();
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

      it('success: force overwrite', async () => {
        const sample = await setupCopyDirTest();
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
      it('error: invalid sourceDir', async () => {
        const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        const sample = await setupCopyDirTest();
        const { dir } = sample;
        const test = async (sourceDir: any, expectedError: string) => {
          const res = await Fs.copyDir(sourceDir, dir.b);
          expect(res.error?.message).to.include(expectedError);
        };

        await test('./404', 'The source directory to copy does not exist');
        for (const value of NON) {
          await test(value, 'source directory to copy is not a valid path');
        }
      });

      it('error: directory already exists (and copy-op not forced)', async () => {
        const test = async (force?: boolean, error?: string) => {
          const sample = await setupCopyDirTest();
          const { dir } = sample;

          // First copy dir to create the scenario of the target already existing.
          await Fs.copyDir(dir.a, dir.b);
          expect(await Fs.exists(dir.b)).to.eql(true);

          const res = await Fs.copyDir(dir.a, dir.b, { force });
          if (error) expect(res.error?.message).to.include(error);
        };
        const err = 'Cannot copy over existing target directory (pass {force} option to overwrite)';
        await test(undefined, err); // Default: false
        await test(false, err);
        await test(true); // NB: forced - no problem.
      });
    });
  });
});
