import { describe, expect, Fs, it } from '../-test.ts';
import { Dir } from './m.Hash.Dir.ts';
import { Hash } from './mod.ts';
import { SAMPLE_FILE, SAMPLE_PATH } from '../m.Pkg/-.test.ts';

describe('Pkg (Server Tools)', () => {
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

  describe('Dir', () => {
    it('error: directory does not exist', async () => {
      const dir = Fs.resolve('./NO_EXIST');
      const res = await Hash.Dir.compute(dir);

      expect(res.base).to.eql(dir);
      expect(res.exists).to.eql(false);
      expect(res.hash).to.eql('');
      expect(res.files).to.eql({});
      expect(res.error?.message).to.include('Directory does not exist');
    });

    it('error: not a file', async () => {
      const file = Fs.resolve('./deno.json');
      const res = await Hash.Dir.compute(file);
      expect(res.base).to.eql(file);
      expect(res.exists).to.eql(true);
      expect(res.hash).to.eql('');
      expect(res.files).to.eql({});
      expect(res.error?.message).to.include('Path is not a directory');
    });

    it('compute hash', async () => {
      await SAMPLE_FILE.dist.reset();
      const res = await Hash.Dir.compute(SAMPLE_PATH.dir);
      expect(res.base).to.eql(SAMPLE_PATH.dir);
      expect(res.exists).to.eql(true);

      expectHash(res.hash, 'fdb67a7');
      expectHash(res.files['./index.html'], 'f13e6');
      expectHash(res.files['./pkg/-entry.BEgRUrsO.js'], 'd3042');
      expectHash(res.files['./pkg/m.B2RI71A8.js'], '3da86');
      expectHash(res.files['./pkg/m.DW3RxxEf.js'], '814fb');
      expectHash(res.files['./pkg/m.Du7RzsRq.js'], 'ea1f0');
      expectHash(res.files['./pkg/m.IecpGBwa.js'], 'e934c');
    });

    it('filter list of files', async () => {
      const filter = (path: string) => path.endsWith('.html');
      const a = await Hash.Dir.compute(SAMPLE_PATH.dir, { filter });
      const b = await Hash.Dir.compute(SAMPLE_PATH.dir, filter);
      const keys = Object.keys(a.files);
      expect(keys.length).to.eql(1);
      expect(keys[0]).to.eql('./index.html');
      expect(a).to.eql(b);
    });
  });
});
