import { Fs, Pkg, describe, expect, it } from '../../-test.ts';
import { Denofile } from './mod.ts';

describe('Denofile', () => {
  describe('load file', () => {
    it('exists', async () => {
      const path = Fs.resolve('./deno.json');
      const res = await Denofile.load(path);
      expect(res.exists).to.eql(true);
      expect(res.json?.name).to.eql('@sys/driver-deno');
      expect(res.json?.version).to.eql(Pkg.version);
    });

    it('not found', async () => {
      const res = await Denofile.load('404-foobar.json');
      expect(res.exists).to.eql(false);
    });
  });
});
