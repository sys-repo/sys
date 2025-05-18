import { type t, Arr, describe, expect, expectError, it, sampleDir, slug } from '../-test.ts';
import { Path } from './common.ts';
import { Fs } from './mod.ts';

describe('Fs: directory operations', () => {
  const setupCopyTest = async () => {
    const SAMPLE = sampleDir('Fs');
    await SAMPLE.ensureExists();

    const text = `sample-${slug()}\n`;
    const name = 'foo.txt';
    const a = SAMPLE.join('a');
    const b = SAMPLE.join('b');

    await Fs.ensureDir(a);
    await Deno.writeTextFile(Fs.join(a, name), text);

    const dir = {
      a,
      b,
      async ls() {
        return {
          a: await Fs.ls(a),
          b: await Fs.ls(b),
        } as const;
      },
    };

    return {
      SAMPLE,
      dir,
      file: { text, name, a: Fs.join(a, name), b: Fs.join(b, name) },
    } as const;
  };

  const assertFileText = async (path: string, text: string) => {
    expect((await Fs.readText(path)).data).to.eql(text);
  };

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
        const { file } = sample;
        const test = async (sourceFile: any, expectedError: string) => {
          const res = await Fs.copyFile(sourceFile, file.b);
          expect(res.error?.message).to.include(expectedError);
        };

        await test('./404', 'Cannot copy file because source file does not exist');
        for (const value of NON) {
          await test(value, 'Cannot copy file because source file path is not a valid');
        }
      });

      it('error: source file-path is a directory', async () => {
        const sample = await setupCopyTest();
        const { dir, file } = sample;
        const res = await Fs.copyFile(dir.a, file.b);
        expect(res.error?.message).to.include(
          'Cannot copy file because the given path is a directory',
        );
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

  describe('Fs.copy', () => {
    /**
     * NB: [Fs.copy] this is a pass-through function depending
     *     on whether the source ("to" param) is a a file or a directory.
     *     See corresponding [Fs.copyFile] OR [Fs.copyDir] tests.
     */
    it('copy file', async () => {
      const { dir, file } = await setupCopyTest();

      expect(await Fs.exists(dir.a)).to.eql(true);
      expect(await Fs.exists(dir.b)).to.eql(false); // NB: copyFile will ensure the parent dir.

      const res = await Fs.copy(file.a, file.b);
      expect(res.error).to.eql(undefined);

      expect(await Fs.exists(dir.b)).to.eql(true);
      expect(await Fs.exists(file.b)).to.eql(true); // NB: parent dir created.
      await assertFileText(file.b, file.text);
    });

    it('copy directory', async () => {
      const { dir, file } = await setupCopyTest();
      expect(await Fs.exists(dir.a)).to.eql(true);
      expect(await Fs.exists(dir.b)).to.eql(false);

      const res = await Fs.copy(dir.a, dir.b);
      expect(res.error).to.eql(undefined);

      expect(await Fs.exists(dir.b)).to.eql(true);
      expect(await Fs.exists(file.b)).to.eql(true);
      await assertFileText(file.b, file.text);
    });

    describe('filter', () => {
      it('filter on: dir', async () => {
        const test = async (filter?: t.FsCopyFilter) => {
          const sample = await setupCopyTest();
          const { dir } = sample;
          const res = await Fs.copyDir(dir.a, dir.b, filter);
          const ls = await Fs.ls(dir.b);
          return { res, ls, sample };
        };

        const a = await test();
        const b = await test((e) => Path.basename(e.source) !== 'foo.txt');

        expect(a.ls.length).to.eql(1);
        expect(b.ls.length).to.eql(0); // NB: filtered out.

        expect(await Fs.exists(a.sample.file.a)).to.eql(true);
        expect(await Fs.exists(a.sample.file.b)).to.eql(true);

        expect(await Fs.exists(b.sample.file.a)).to.eql(true);
        expect(await Fs.exists(b.sample.file.b)).to.eql(false);
      });

      it('filter on: file', async () => {
        const test = async (filter?: t.FsCopyFilter) => {
          const sample = await setupCopyTest();
          const { file, dir } = sample;
          const res = await Fs.copyFile(file.a, file.b, filter);
          const ls = await Fs.ls(dir.b);
          return { res, ls, sample };
        };

        const a = await test();
        const b = await test((e) => Path.basename(e.target) !== 'foo.txt');

        expect(a.res.error).to.eql(undefined);
        expect(b.res.error?.message).to.include(
          'Cannot copy file because the path has been filtered out',
        );

        expect(a.ls.length).to.eql(1);
        expect(b.ls.length).to.eql(0); // NB: filtered out.

        expect(await Fs.exists(a.sample.file.a)).to.eql(true);
        expect(await Fs.exists(a.sample.file.b)).to.eql(true);

        expect(await Fs.exists(b.sample.file.a)).to.eql(true);
        expect(await Fs.exists(b.sample.file.b)).to.eql(false);
      });

      it('filter(args): folder path ends in "/"', async () => {
        const sample = await setupCopyTest();
        const { dir } = sample;

        const text = `sample-${slug()}\n`;
        const deepPath = Fs.join('foo', 'bar', 'file.txt');
        const deepA = Fs.join(dir.a, deepPath);
        const deepB = Fs.join(dir.b, deepPath);

        await Fs.ensureDir(Fs.dirname(deepA));
        await Deno.writeTextFile(deepA, text);

        let fired: t.FsCopyFilterArgs[] = [];
        const res = await Fs.copyDir(dir.a, dir.b, {
          filter(e) {
            fired.push(e);
            return true;
          },
        });
        expect(res.error).to.eql(undefined);
        await assertFileText(deepB, text);

        const sorted = Arr.sortBy(fired, 'source');
        expect(sorted[1].source.endsWith('/a/foo/')).to.eql(true);
        expect(sorted[1].target.endsWith('/b/foo/')).to.eql(true);
        expect(sorted[2].source.endsWith('/a/foo/bar/')).to.eql(true);
        expect(sorted[2].target.endsWith('/b/foo/bar/')).to.eql(true);
      });

      describe('filter paths: (e) => boolean', () => {
        type A = t.FsCopyFilterArgs;

        it('copyDir', async () => {
          const sample = await setupCopyTest();
          const { dir } = sample;
          expect((await dir.ls()).b.length).to.eql(0); // NB: not yet copied.

          // NB: ensure the passed paths are absolute.
          const a = Fs.trimCwd(dir.a);
          const b = Fs.trimCwd(dir.b);

          const fired: A[] = [];
          await Fs.copyDir(a, b, (e) => {
            fired.push(e);
            return true;
          });

          expect((await dir.ls()).b.length).to.eql(1); // NB: exists now.
          expect(fired.length).to.eql(1);

          const e = fired[0];
          expect(Path.Is.absolute(e.source)).to.be.true;
          expect(Path.Is.absolute(e.target)).to.be.true;
        });

        it('copyFile', async () => {
          const sample = await setupCopyTest();
          const { file, dir } = sample;
          expect((await dir.ls()).b.length).to.eql(0); // NB: not yet copied.

          // NB: ensure the passed paths are absolute.
          const a = Fs.trimCwd(file.a);
          const b = Fs.trimCwd(file.b);

          const fired: A[] = [];
          await Fs.copyFile(a, b, (e) => {
            fired.push(e);
            return true;
          });

          expect((await dir.ls()).b.length).to.eql(1); // NB: exists now.
          expect(fired.length).to.eql(1);

          const e = fired[0];
          expect(Path.Is.absolute(e.source)).to.be.true;
          expect(Path.Is.absolute(e.target)).to.be.true;
        });
      });
    });

    it('{throw} parameter (default: false)', async () => {
      const { dir, file } = await setupCopyTest();
      expectError(() => Fs.copyFile('./404', file.b, { throw: true }));
      expectError(() => Fs.copyDir('./404', dir.b, { throw: true }));
      expectError(() => Fs.copy('./404', file.b, { throw: true }));
      expectError(() => Fs.copy('./404', dir.b, { throw: true }));
    });
  });
});
