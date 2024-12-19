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

    describe('Is.dataUri', () => {
      const test = (input: any, expected: boolean) => {
        expect(FileMap.Is.dataUri(input)).to.eql(expected);
      };
      test('data:text/plain;base64,0000', true);
      test('text/plain;base64,0000', false);
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v) => test(v, false));
    });
  });

  describe('FileMap.Data (encoding)', () => {
    it('encode → decode: string', () => {
      const res = FileMap.Data.encode('text/plain', 'foobar');
      expect(res).to.eql('data:text/plain;base64,Zm9vYmFy');
      expect(FileMap.Data.decode(res)).to.eql('foobar');
    });

    it('does not double encode', () => {
      const a = FileMap.Data.encode('text/plain', 'foobar');
      const b = FileMap.Data.encode('text/plain', a);
      expect(a).to.eql('data:text/plain;base64,Zm9vYmFy');
      expect(b).to.eql(a);
    });

    it('decode: throws if not a data-uri', () => {
      const fn = () => FileMap.Data.decode('foobar');
      expect(fn).to.throw(/Input not a "data:" URI/);
    });

    it('decode: throws if not base64 encoded', () => {
      const fn = () => FileMap.Data.decode('data:text/plain,000');
      expect(fn).to.throw(/Data URI is not base64 encoded/);
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
