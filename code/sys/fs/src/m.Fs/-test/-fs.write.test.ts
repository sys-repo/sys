import { describe, expect, expectError, it, sampleDir, slug, type t } from '../../-test.ts';
import { Fs } from '../mod.ts';

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

    it('{recursive:false} preserves non-empty directories', async () => {
      const sample = await testSetup();
      expect(await sample.dirExists()).to.eql(true);

      try {
        await expectError(() => Fs.remove(sample.path.dir, { recursive: false }));
        expect(await sample.dirExists()).to.eql(true);
        expect(await sample.fileExists()).to.eql(true);
      } finally {
        await Fs.remove(sample.path.dir); // Clean up.
      }
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

    it('retries transient directory-not-empty failures', async () => {
      const sample = await testSetup();
      const original = Deno.remove;
      let attempts = 0;

      Deno.remove = (async (path: string | URL, options?: Deno.RemoveOptions) => {
        attempts++;
        if (attempts < 3) throw new Error('Directory not empty (os error 66)');
        return await original(path, options);
      }) as typeof Deno.remove;

      try {
        const res = await Fs.remove(sample.path.dir);
        expect(res).to.eql(true);
        expect(attempts).to.eql(3);
        expect(await sample.dirExists()).to.eql(false);
      } finally {
        Deno.remove = original;
      }
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

    describe('failure settlement', () => {
      const expectCause = async (fn: () => Promise<unknown>, cause: Error) => {
        let thrown: unknown;
        try {
          await fn();
        } catch (error) {
          thrown = error;
        }
        expect(thrown).to.equal(cause);
      };

      const expectOperationalFailure = async (
        run: (shouldThrow: boolean) => ReturnType<typeof Fs.write>,
        cause: Error,
      ) => {
        const result = await run(false);
        expect(result.overwritten).to.eql(false);
        expect(result.error?.cause?.name).to.eql(cause.name);
        expect(result.error?.cause?.message).to.eql(cause.message);
        await expectCause(() => run(true), cause);
        return result;
      };

      it('settles parent-preparation failures and performs no write', async () => {
        const parent = getDir();
        const path = Fs.join(parent, 'file.txt');
        const cause = new Error('parent preparation failed');
        const originalStat = Deno.stat;
        const originalWriteText = Deno.writeTextFile;
        const originalWriteBytes = Deno.writeFile;
        let textWrites = 0;
        let binaryWrites = 0;

        Deno.stat = (async (target) => {
          if (String(target) === parent) throw cause;
          return await originalStat(target);
        }) as typeof Deno.stat;
        Deno.writeTextFile = (() => {
          textWrites++;
          return Promise.resolve();
        }) as typeof Deno.writeTextFile;
        Deno.writeFile = (() => {
          binaryWrites++;
          return Promise.resolve();
        }) as typeof Deno.writeFile;

        try {
          await expectOperationalFailure(
            (shouldThrow) =>
              Fs.write(path, shouldThrow ? new Uint8Array([1]) : 'text', { throw: shouldThrow }),
            cause,
          );
          expect(textWrites).to.eql(0);
          expect(binaryWrites).to.eql(0);
        } finally {
          Deno.stat = originalStat;
          Deno.writeTextFile = originalWriteText;
          Deno.writeFile = originalWriteBytes;
        }
      });

      it('settles target-observation failures and performs no write', async () => {
        const dir = getDir();
        const path = Fs.join(dir, 'file.txt');
        const cause = new Deno.errors.PermissionDenied('target observation failed');
        await Fs.ensureDir(dir);

        const originalStat = Deno.stat;
        const originalWriteText = Deno.writeTextFile;
        const originalWriteBytes = Deno.writeFile;
        let textWrites = 0;
        let binaryWrites = 0;

        Deno.stat = (async (target) => {
          if (String(target) === path) throw cause;
          return await originalStat(target);
        }) as typeof Deno.stat;
        Deno.writeTextFile = (() => {
          textWrites++;
          return Promise.resolve();
        }) as typeof Deno.writeTextFile;
        Deno.writeFile = (() => {
          binaryWrites++;
          return Promise.resolve();
        }) as typeof Deno.writeFile;

        try {
          await expectOperationalFailure(
            (shouldThrow) =>
              Fs.write(path, shouldThrow ? new Uint8Array([1]) : 'text', { throw: shouldThrow }),
            cause,
          );
          expect(textWrites).to.eql(0);
          expect(binaryWrites).to.eql(0);
        } finally {
          Deno.stat = originalStat;
          Deno.writeTextFile = originalWriteText;
          Deno.writeFile = originalWriteBytes;
        }
      });

      it('settles text-write failures and preserves the thrown cause', async () => {
        const path = Fs.join(getDir(), 'text.txt');
        const cause = new Error('text write failed');
        const original = Deno.writeTextFile;
        Deno.writeTextFile = (() => Promise.reject(cause)) as typeof Deno.writeTextFile;

        try {
          await expectOperationalFailure(
            (shouldThrow) => Fs.write(path, 'text', { throw: shouldThrow }),
            cause,
          );
        } finally {
          Deno.writeTextFile = original;
        }
      });

      it('settles binary-write failures and preserves the thrown cause', async () => {
        const path = Fs.join(getDir(), 'bytes.bin');
        const cause = new Error('binary write failed');
        const original = Deno.writeFile;
        Deno.writeFile = (() => Promise.reject(cause)) as typeof Deno.writeFile;

        try {
          await expectOperationalFailure(
            (shouldThrow) => Fs.write(path, new Uint8Array([1]), { throw: shouldThrow }),
            cause,
          );
        } finally {
          Deno.writeFile = original;
        }
      });

      it('returns target-kind failures by default and rejects them when throwing', async () => {
        const path = getDir();
        await Fs.ensureDir(path);

        const result = await Fs.write(path, 'text');
        expect(result.overwritten).to.eql(false);
        expect(result.error?.message).to.include('Failed while writing file');

        await expectError(() => Fs.write(path, 'text', { throw: true }));
      });

      it('delegates JSON write failures without relabeling or replacing them', async () => {
        const path = Fs.join(getDir(), 'file.json');
        const cause = new Error('delegated JSON write failed');
        const original = Deno.writeTextFile;
        Deno.writeTextFile = (() => Promise.reject(cause)) as typeof Deno.writeTextFile;

        try {
          const result = await expectOperationalFailure(
            (shouldThrow) => Fs.writeJson(path, { value: true }, { throw: shouldThrow }),
            cause,
          );
          expect(result.error?.message).to.include('Failed while writing file');
          expect(result.error?.message).not.to.include('serializing JSON');
        } finally {
          Deno.writeTextFile = original;
        }
      });

      it('keeps JSON serialization failures separate and performs no write', async () => {
        const path = Fs.join(getDir(), 'file.json');
        const original = Deno.writeTextFile;
        let writes = 0;
        Deno.writeTextFile = (() => {
          writes++;
          return Promise.resolve();
        }) as typeof Deno.writeTextFile;

        try {
          const result = await Fs.writeJson(path, undefined as unknown as t.Json);
          expect(result.overwritten).to.eql(false);
          expect(result.error?.message).to.include('Failed while serializing JSON');
          expect(result.error?.cause?.message).to.include('[undefined] is not valid JSON input');

          await expectError(
            () => Fs.writeJson(path, undefined as unknown as t.Json, { throw: true }),
            'Failed while serializing JSON',
          );
          expect(writes).to.eql(0);
        } finally {
          Deno.writeTextFile = original;
        }
      });
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

    describe('circular references (no serialization error)', () => {
      const circular: any = { foo: { bar: 123 } };
      circular.foo['zoo'] = circular.foo; // setup circular-reference

      it('does not error (default)', async () => {
        const path = getPath();
        const res = await Fs.writeJson(path, circular);

        // Previously this path produced a serialization error.
        // With Json.stringify (circular-safe), it should succeed.
        expect(res.error).to.eql(undefined);
      });

      it('does not throw when { throw: true }', async () => {
        const path = getPath();

        let thrown: unknown;
        try {
          await Fs.writeJson(path, circular, { throw: true });
        } catch (err) {
          thrown = err;
        }

        // Even with "throw: true", circular structures should be handled
        // by Json.stringify, so nothing is thrown here.
        expect(thrown).to.eql(undefined);
      });
    });
  });
});
