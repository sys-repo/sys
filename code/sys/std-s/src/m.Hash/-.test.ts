import { describe, expect, Fs, it, type t } from '../-test.ts';
import { Sample } from '../m.Pkg/-u.ts';
import { Dir } from './m.Hash.Dir.ts';
import { Hash } from './mod.ts';

describe('Hash (server extension)', () => {
  const expectHash = (value: string, expected: string) => {
    expect(value.endsWith(expected)).to.eql(true, value);
  };

  it('is not the [sys.std] client version, but surfaces all the [sys.std] interface', async () => {
    const { Hash: Base } = await import('@sys/std/hash');
    expect(Hash).to.not.equal(Base); // NB: different instance.
    expect(Hash.Dir).to.equal(Dir);

    // Shares all of the base interface methods.
    for (const key of Object.keys(Base) as Array<keyof typeof Base>) {
      const value = Base[key];
      expect(value).to.equal(Hash[key]);
    }
  });

  describe('Hash.Dir', () => {
    describe('Dir.compute', () => {
      it('compute → success', async () => {
        const sample = await Sample.init();
        const dir = sample.path.dir;
        const res = await Hash.Dir.compute(dir);
        expect(res.dir).to.eql(Fs.resolve(dir));
        expect(res.exists).to.eql(true);

        expectHash(res.hash.digest, 'fdb67a7');
        expectHash(res.hash.parts['./index.html'], 'f13e6');
        expectHash(res.hash.parts['./pkg/-entry.BEgRUrsO.js'], 'd3042');
        expectHash(res.hash.parts['./pkg/m.B2RI71A8.js'], '3da86');
        expectHash(res.hash.parts['./pkg/m.DW3RxxEf.js'], '814fb');
        expectHash(res.hash.parts['./pkg/m.Du7RzsRq.js'], 'ea1f0');
        expectHash(res.hash.parts['./pkg/m.IecpGBwa.js'], 'e934c');
      });

      it('computer → with filtered set of files', async () => {
        const sample = await Sample.init();
        const dir = sample.path.dir;

        const filter = (path: string) => path.endsWith('.html');
        const a = await Hash.Dir.compute(dir, { filter });
        const b = await Hash.Dir.compute(dir, filter);
        const keys = Object.keys(a.hash.parts);
        expect(keys.length).to.eql(1);
        expect(keys[0]).to.eql('./index.html');
        expect(a).to.eql(b);
      });

      describe('errors', () => {
        it('error: directory does not exist', async () => {
          const dir = Fs.resolve('./NO_EXIST');
          const res = await Hash.Dir.compute(dir);

          expect(res.dir).to.eql(dir);
          expect(res.exists).to.eql(false);
          expect(res.hash.digest).to.eql('');
          expect(res.hash.parts).to.eql({});
          expect(res.error?.message).to.include('Directory does not exist');
        });

        it('error: not a file', async () => {
          const file = Fs.resolve('./deno.json');
          const res = await Hash.Dir.compute(file);
          expect(res.dir).to.eql(file);
          expect(res.exists).to.eql(true);
          expect(res.hash.digest).to.eql('');
          expect(res.hash.parts).to.eql({});
          expect(res.error?.message).to.include('Path is not a directory');
        });
      });
    });

    describe('Dir.verify', () => {
      it('verify → success: from path "./dist.json"', async () => {
        const sample = await Sample.init();
        const dir = sample.path.dir;
        await sample.file.dist.ensure();

        const test = async (hashPath: t.StringPath) => {
          const res = await Hash.Dir.verify(dir, hashPath);
          expect(res.is.valid).to.eql(true);
          expect(res.error).to.eql(undefined);
          expect(res.exists).to.eql(true);
          expect(res.dir).to.eql(Fs.resolve(dir));
        };

        await test('./dist.json');
        await test(Fs.resolve(dir, 'dist.json'));
      });

      it('verify → success: from {hash} object', async () => {
        const sample = await Sample.init();
        // await SAMPLE_FILE.dist.delete();
        const dir = sample.path.dir;
        const hash = (await Hash.Dir.compute(dir)).hash;
        const res = await Hash.Dir.verify(dir, hash);

        expect(res.is.valid).to.eql(true);
        expect(res.error).to.eql(undefined);
        expect(res.exists).to.eql(true);
        expect(res.dir).to.eql(Fs.resolve(dir));
      });

      it('verify → invalid (hash manipulated | "main in the middle" attack)', async () => {
        const sample = await Sample.init();
        const dir = sample.path.dir;
        const hash = (await Hash.Dir.compute(dir)).hash;
        const keys = Object.keys(hash.parts);
        (hash.parts as any)[keys[0]] = '0xHackedChange';

        const res = await Hash.Dir.verify(dir, hash);
        expect(res.is.valid).to.eql(false);
        expect(res.error).to.eql(undefined); // NB: this is not an error state - just invalid.
      });

      it('verify → invalid (404 file not found)', async () => {
        const sample = await Sample.init();
        const dir = sample.path.dir;
        const hash = (await Hash.Dir.compute(dir)).hash;
        (hash.parts as any)['./_404_.html'] = '0x123'; // NB: this file does not exist - should not cause file-system load error.

        const res = await Hash.Dir.verify(dir, hash);
        expect(res.is.valid).to.eql(false);
        expect(res.error?.message).to.include('loader did not return content');
        expect(res.error?.message).to.include('./_404_.html');
      });

      describe('errors', () => {
        it('error: directory does not exist', async () => {
          const dir = Fs.resolve('./NO_EXIST');
          const res = await Hash.Dir.verify(dir, './dist.json');

          expect(res.dir).to.eql(dir);
          expect(res.exists).to.eql(false);
          expect(Hash.Is.empty(res.hash)).to.eql(true);
          expect(res.error?.message).to.include('directory to verify does not exist');
        });

        it('error: path to `dist.json` file does not exist', async () => {
          const sample = await Sample.init();
          const dir = sample.path.dir;
          const res = await Hash.Dir.verify(dir, './404.json');
          expect(res.dir).to.eql(Fs.resolve(dir));
          expect(res.exists).to.eql(true); // NB: dir exists, not the file.
          expect(Hash.Is.empty(res.hash)).to.eql(true);
          expect(res.error?.message).to.include('Hash data to compare does not exist');
        });

        it('error: path to `dist.json` file does not contain a {hash} value', async () => {
          const sample = await Sample.init();
          const dir = sample.path.dir;
          const test = async (json: t.Json) => {
            await sample.file.dist.delete();
            Deno.writeTextFile(sample.path.filepath, JSON.stringify(json));
            const res = await Hash.Dir.verify(dir, './dist.json');
            expect(res.error?.message).to.include('File does not contain a { hash:');
          };
          await test({});
          await test({ foo: 123 });
          await test({ hash: { foo: 123 } });
        });
      });
    });
  });
});
