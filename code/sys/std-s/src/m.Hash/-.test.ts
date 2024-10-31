import { describe, expect, Fs, it, type t } from '../-test.ts';
import { Dir } from './m.Hash.Dir.ts';
import { Hash } from './mod.ts';
import { SAMPLE_FILE, SAMPLE_PATH } from '../m.Pkg/-.test.ts';

describe('Hash (server extension)', () => {
  const expectHash = (value: string, expected: string) => {
    expect(value.endsWith(expected)).to.eql(true, value);
  };

  it('is not the [sys.std] Client verion, but surfaces all the [sys.std] interface', async () => {
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
        await SAMPLE_FILE.dist.reset();
        const res = await Hash.Dir.compute(SAMPLE_PATH.dir);
        expect(res.dir).to.eql(SAMPLE_PATH.dir);
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
        const filter = (path: string) => path.endsWith('.html');
        const a = await Hash.Dir.compute(SAMPLE_PATH.dir, { filter });
        const b = await Hash.Dir.compute(SAMPLE_PATH.dir, filter);
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
        await SAMPLE_FILE.dist.ensure();
        const dir = SAMPLE_PATH.dir;

        const test = async (hashPath: t.StringPath) => {
          const res = await Hash.Dir.verify(dir, hashPath);
          expect(res.is.valid).to.eql(true);
          expect(res.error).to.eql(undefined);
          expect(res.exists).to.eql(true);
          expect(res.dir).to.eql(dir);
        };

        await test('./dist.json');
        await test(Fs.join(dir, 'dist.json'));
      });

      it('verify → success: from {hash} object', async () => {
        await SAMPLE_FILE.dist.delete();
        const dir = SAMPLE_PATH.dir;
        const hash = (await Hash.Dir.compute(dir)).hash;
        const res = await Hash.Dir.verify(SAMPLE_PATH.dir, hash);

        expect(res.is.valid).to.eql(true);
        expect(res.error).to.eql(undefined);
        expect(res.exists).to.eql(true);
        expect(res.dir).to.eql(dir);
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
          await SAMPLE_FILE.dist.ensure();
          const dir = SAMPLE_PATH.dir;
          const res = await Hash.Dir.verify(dir, './404.json');
          expect(res.dir).to.eql(dir);
          expect(res.exists).to.eql(true); // NB: dir exists, not the file.
          expect(Hash.Is.empty(res.hash)).to.eql(true);
          expect(res.error?.message).to.include('Hash data to compare does not exist');
        });

        it('error: path to `dist.json` file does not contain a {hash} value', async () => {
          const dir = SAMPLE_PATH.dir;
          const test = async (json: t.Json) => {
            await SAMPLE_FILE.dist.delete();
            Deno.writeTextFile(SAMPLE_PATH.filepath, JSON.stringify(json));
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
