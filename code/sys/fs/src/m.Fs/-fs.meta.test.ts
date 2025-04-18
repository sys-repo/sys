import { describe, expect, it } from '../-test.ts';
import { Fs } from './mod.ts';

describe('Fs: info/meta-data operations on the file-system', () => {
  describe('Fs.stat', () => {
    it('file does not exist → <undefined>', async () => {
      const path = Fs.resolve('./404.json');
      const res = await Fs.stat(path);
      expect(res).to.eql(undefined);
    });

    it('file exists', async () => {
      const path = './src/-test/-sample-1/foo.txt';
      const a = await Fs.stat(Fs.resolve(path));
      const b = await Fs.stat(path);
      expect(a?.isFile).to.eql(true);
      expect(a?.size).to.be.greaterThan(10);
      expect(a).to.eql(b); // NB: auto-resolves path internally.
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
