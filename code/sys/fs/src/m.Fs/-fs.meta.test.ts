import { describe, expect, it } from '../-test.ts';
import { Path } from './common.ts';
import { Fs } from './mod.ts';

describe('Fs: info/meta-data operations on the file-system', () => {
  describe('Fs.Is (flags)', () => {
    const Is = Fs.Is;

    it('has mapped Path methods', () => {
      // NB: mapped helpers (convenience).
      expect(Is.absolute).to.equal(Fs.Path.Is.absolute);
      expect(Is.glob).to.equal(Fs.Path.Is.glob);
    });

    it('Is.dir', async () => {
      expect(await Is.dir(Path.resolve('.'))).to.eql(true);
      expect(await Is.dir(Path.resolve('./deno.json'))).to.eql(false);
      expect(await Is.dir(Path.resolve('./404.json'))).to.eql(false); // NB: target does not exist.
    });

    it('Is.file', async () => {
      expect(await Is.file(Path.resolve('.'))).to.eql(false);
      expect(await Is.file(Path.resolve('./deno.json'))).to.eql(true);
      expect(await Is.file(Path.resolve('./404.json'))).to.eql(false); // NB: target does not exist.
    });
  });

  describe('Fs.Size.dir', () => {
    const sample = Fs.resolve('./src/-test/-sample-1');

    it('does not exist', async () => {
      const path = Fs.resolve('./404');
      const res = await Fs.Size.dir(path);
      expect(res.path).to.eql(path);
      expect(res.exists).to.eql(false);
      expect(res.total.files).to.eql(0);
      expect(res.total.bytes).to.eql(0);
      expect(res.toString()).to.eql('0 B');
    });

    it('default (no options)', async () => {
      const res = await Fs.Size.dir(sample);
      expect(res.path).to.eql(sample);
      expect(res.exists).to.eql(true);

      expect(res.total.files).to.eql(2);
      expect(res.total.bytes).to.eql(563);
      expect(res.toString()).to.eql('563 B');
    });

    it('maxDepth', async () => {
      const res1 = await Fs.Size.dir(sample);
      const res2 = await Fs.Size.dir(sample, { maxDepth: Infinity });
      const res3 = await Fs.Size.dir(sample, { maxDepth: 1 });
      expect(res1.total).to.eql(res2.total);
      expect(res1.total.files).to.eql(2);
      expect(res3.total.files).to.eql(1);
    });
  });
});
