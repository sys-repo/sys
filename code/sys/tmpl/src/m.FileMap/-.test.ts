import { describe, expect, it, Path } from '../-test.ts';
import { DEFAULTS } from './common.ts';
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

  describe('FileMap.Is', () => {
    it('Is.supported', () => {
      const test = (path: any, expected: boolean) => {
        const ext = Path.extname(path);
        expect(FileMap.Is.supported(path)).to.eql(expected);
        expect(FileMap.Is.supported(ext)).to.eql(expected);
      };
      test('foo.png', true);
      test('bar/foo.jpg', true);
      test('bar/foo.jpeg', true);
      test('mod.ts', true);
      test('Component.tsx', true);
      test('docs/index.md', true);
      test('deno.json', true);

      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v) => test(v, false));
      test('foo', false);
      test('', false);
      test('  ', false);
    });
  });

  describe('FileMap.Data (encoding)', () => {
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

    it('decode: throws if not prefixed with encoding format', () => {
      const fn = () => FileMap.Data.decode('foobar');
      expect(fn).to.throw(/Supported encoding format could not be derived/);
    });

    it('contentType', () => {
      const contentTypes = DEFAULTS.contentTypes;
      Object.keys(contentTypes).forEach((key) => {
        const ext = key as keyof typeof contentTypes;
        const path = `foo/file${ext}`;
        const res = FileMap.Data.contentType(path);
        expect(res).to.eql(contentTypes[ext]);
      });
    });

    it('contentType: not supported → "" (empty string)', () => {
      const test = (path: string) => {
        expect(FileMap.Data.contentType(path)).to.eql('');
      };
      test('');
      test('foo');
      test('foo/bar.baz');

      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => test(v));
    });
  });
});
