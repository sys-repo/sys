import { describe, it, expect, type t, Fs } from '../-test.ts';
import { FileMap } from './mod.ts';

describe('FileMap', () => {
  const SAMPLE_DIR = './src/m.FileMap/-sample';

  describe('FileMap.bundle', () => {
    it('bundle', async () => {
      const res = await FileMap.bundle(SAMPLE_DIR);

      console.log(`-------------------------------------------`);
      console.log('FileMap.bundle:', res);
    });
  });

  describe('Data: file encoding', () => {
    it('encode → decode', () => {
      const res = FileMap.Data.encode('foobar');
      expect(res).to.eql('base64-Zm9vYmFy');
      expect(FileMap.Data.decode(res)).to.eql('foobar');
    });

    it('does not double encode', () => {
      const a = FileMap.Data.encode('foobar');
      const b = FileMap.Data.encode(a);
      expect(a).to.eql('base64-Zm9vYmFy');
      expect(b).to.eql(a);
    });

    it('decode: throws if not prefixed with encoding format', async () => {
      const fn = () => FileMap.Data.decode('foobar');
      expect(fn).to.throw(/Supported encoding format could not be derived/);
    });
  });
});
