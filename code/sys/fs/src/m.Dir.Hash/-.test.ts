import { describe, expect, it, type t } from '../-test.ts';
import { Dir } from '../mod.ts';
import { Sample } from './-u.ts';
import { Fs, Hash, FmtHash } from './common.ts';

import { DirHash } from './mod.ts';

describe('Dir.Hash', () => {
  const expectHash = (value: t.StringHash, expected: t.StringHash) => {
    expect(value.endsWith(expected)).to.eql(true, value);
  };

  const verifyFileHash = async (path: t.StringPath, expected: t.StringHash) => {
    const binary = await Deno.readFile(path);
    expect(Hash.sha256(binary)).to.eql(expected);
  };

  it('API', () => {
    expect(Dir.Hash).to.equal(DirHash);
    expect(DirHash.Fmt).to.equal(FmtHash);
  });

  describe('Dir.Hash.compute', () => {
    it('compute → success', async () => {
      const sample = await Sample.init();
      const dir = sample.dir;
      const res = await DirHash.compute(dir);
      expect(res.dir).to.eql(Fs.resolve(dir));
      expect(res.exists).to.eql(true);

      expectHash(res.hash.digest, 'd3b7');
      expectHash(res.hash.parts['.gitignore'], '6878');
      expectHash(res.hash.parts['deno.json'], '2356');
      expectHash(res.hash.parts['docs/index.md'], '9b31');
      expectHash(res.hash.parts['images/pixels.png'], 'afeb');
      expectHash(res.hash.parts['images/vector.svg'], 'becb');
      expectHash(res.hash.parts['main.ts'], '9788');
      expectHash(res.hash.parts['mod.ts'], '7990');

      for (const key of Object.keys(res.hash.parts)) {
        await verifyFileHash(Fs.join(dir, key), res.hash.parts[key]);
      }
    });

    it('computer → with filtered set of files', async () => {
      const sample = await Sample.init();
      const dir = sample.dir;

      const filter = (path: string) => path.endsWith('.gitignore');
      const a = await DirHash.compute(dir, { filter });
      const b = await DirHash.compute(dir, filter);
      const keys = Object.keys(a.hash.parts);

      expect(keys.length).to.eql(1);
      expect(keys[0]).to.eql('.gitignore');
      expect(a).to.eql(b);
    });

    describe('errors', () => {
      it('error: directory does not exist', async () => {
        const dir = Fs.resolve('./NO_EXIST');
        const res = await DirHash.compute(dir);

        expect(res.dir).to.eql(dir);
        expect(res.exists).to.eql(false);
        expect(res.hash.digest).to.eql('');
        expect(res.hash.parts).to.eql({});
        expect(res.error?.message).to.include('Directory does not exist');
      });

      it('error: not a file', async () => {
        const file = Fs.resolve('./deno.json');
        const res = await DirHash.compute(file);
        expect(res.dir).to.eql(file);
        expect(res.exists).to.eql(true);
        expect(res.hash.digest).to.eql('');
        expect(res.hash.parts).to.eql({});
        expect(res.error?.message).to.include('Path is not a directory');
      });
    });
  });

  describe('Dir.Hash.verify', () => {
    it('verify → success: from path "./main.ts"', async () => {
      const sample = await Sample.init();
      const dir = sample.dir;
      const { hash } = await DirHash.compute(dir);
      await Fs.writeJson(Fs.join(dir, 'hx.json'), { hash });

      const test = async (hashInput: string) => {
        const res = await DirHash.verify(dir, hashInput);
        expect(res.is.valid).to.eql(true);
        expect(res.error).to.eql(undefined);
        expect(res.exists).to.eql(true);
        expect(res.dir).to.eql(Fs.resolve(dir));
      };

      await test('hx.json');
      await test('./hx.json');
      await test(Fs.resolve(dir, 'hx.json'));
    });

    it('verify → success: from {hash} object', async () => {
      const sample = await Sample.init();
      const dir = sample.dir;
      const hash = (await DirHash.compute(dir)).hash;
      const res = await DirHash.verify(dir, hash);

      expect(res.is.valid).to.eql(true);
      expect(res.error).to.eql(undefined);
      expect(res.exists).to.eql(true);
      expect(res.dir).to.eql(Fs.resolve(dir));
    });

    it('verify → invalid (hash manipulated | "main in the middle" attack)', async () => {
      const sample = await Sample.init();
      const dir = sample.dir;
      const hash = (await DirHash.compute(dir)).hash;
      const keys = Object.keys(hash.parts);
      (hash.parts as any)[keys[0]] = '0xHackedChange';

      const res = await DirHash.verify(dir, hash);
      expect(res.is.valid).to.eql(false);
      expect(res.error).to.eql(undefined); // NB: this is not an error state - just invalid.
    });

    it('verify → invalid (404 file not found)', async () => {
      const sample = await Sample.init();
      const dir = sample.dir;
      const hash = (await DirHash.compute(dir)).hash;
      (hash.parts as any)['./_404_.html'] = '0x123'; // NB: this file does not exist - should not cause file-system load error.

      const res = await DirHash.verify(dir, hash);
      expect(res.is.valid).to.eql(false);
      expect(res.error?.message).to.include('loader did not return content');
      expect(res.error?.message).to.include('./_404_.html');
    });

    describe('errors', () => {
      it('error: directory does not exist', async () => {
        const dir = Fs.resolve('./NO_EXIST');
        const res = await DirHash.verify(dir, './main.ts');

        expect(res.dir).to.eql(dir);
        expect(res.exists).to.eql(false);
        expect(Hash.Is.empty(res.hash)).to.eql(true);
        expect(res.error?.message).to.include('directory to verify does not exist');
      });

      it('error: path to `main.ts` file does not exist', async () => {
        const sample = await Sample.init();
        const dir = sample.dir;
        const res = await DirHash.verify(dir, './404.json');
        expect(res.dir).to.eql(Fs.resolve(dir));
        expect(res.exists).to.eql(true); // NB: dir exists, not the file.
        expect(Hash.Is.empty(res.hash)).to.eql(true);
        expect(res.error?.message).to.include('Hash data to compare does not exist');
      });

      it('error: path to `main.ts` file does not contain a {hash} value', async () => {
        const sample = await Sample.init();
        const dir = sample.dir;
        const test = async (json: t.Json) => {
          await sample.file.main.delete();
          Deno.writeTextFile(sample.file.main.path, JSON.stringify(json));
          const res = await DirHash.verify(dir, './main.ts');
          expect(res.error?.message).to.include('File does not contain a { hash:');
        };
        await test({});
        await test({ foo: 123 });
        await test({ hash: { foo: 123 } });
      });
    });
  });

  describe('Dir.Hash.Fmt', () => {
    const Fmt = Dir.Hash.Fmt;

    it('string: Log.digest', async () => {
      const sample = await Sample.init();
      const res = await DirHash.compute(sample.dir);
      console.info('DirHash.Log.digest:', Fmt.digest(res.hash));
    });
  });
});
