import { describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import { FileMap } from '../mod.ts';

describe('FileMap.Data (encoding)', () => {
  const Data = FileMap.Data;

  it('encode → decode: string', () => {
    const a = Data.encode('text/plain', 'foobar');
    const b = Data.decode(a);
    expect(a).to.eql('data:text/plain;base64,Zm9vYmFy');
    expect(b).to.eql('foobar');
  });

  it('encode → decode: binary', () => {
    const data = new Uint8Array([1, 2, 3]);
    const a = Data.encode('image/png', data);
    const b = Data.decode(a);
    expect(a).to.eql(`data:image/png;base64,AQID`);
    expect(b).to.eql(data);
  });

  it('does not double encode', () => {
    const a = Data.encode('text/plain', 'foobar');
    const b = Data.encode('text/plain', a);
    expect(a).to.eql('data:text/plain;base64,Zm9vYmFy');
    expect(b).to.eql(a);
  });

  describe('contentType', () => {
    it('contentType.fromPath', () => {
      const map = D.contentTypes.all(); // Record<ext, mime>

      Object.entries(map).forEach(([ext, mime]) => {
        const path = `foo/file${ext}`;
        const a = Data.contentType.fromPath(path);
        const b = Data.contentType.fromPath(ext); // dotfile path like ".ts" is supported

        expect(a).to.eql(mime);
        expect(b).to.eql(mime);
      });
    });

    it('contentType.fromPath: extension only (eg. ".gitignore")', () => {
      const test = (path: string, expected: string) => {
        expect(Data.contentType.fromPath(path)).to.eql(expected);
      };
      test('.gitignore', 'text/plain');
      test('foo/bar/.gitignore', 'text/plain');
    });

    it('contentType.fromPath: default → "text/plain"', () => {
      const test = (path: string) => {
        expect(Data.contentType.fromPath(path)).to.eql(D.contentType);
      };
      test('');
      test('foo');
      test('foo/bar.baz');
      test('foo/foo.vue');
    });

    it('contentType.fromPath: default → "application/typescript"', () => {
      const test = (path: string, expected: string) => {
        expect(Data.contentType.fromPath(path)).to.eql(expected);
      };
      test('foo/file.ts', 'application/typescript');
      test('foo/file.tsx', 'application/typescript+jsx');
    });

    it('contentType.fromUri', () => {
      const test = (uri: string, expected: string) => {
        expect(Data.contentType.fromUri(uri)).to.eql(expected);
      };
      test('data:text/plain;base64,abcd', 'text/plain');
      test('data:image/png;base64,abcd', 'image/png');
      test('data:application/typescipt;base64,abcd', 'application/typescipt');
      test('data:application/typescipt+jsx;base64,abcd', 'application/typescipt+jsx');
    });

    it('contentType.fromUri: not supported/found → "" (empty string)', () => {
      const test = (uri: string) => {
        expect(Data.contentType.fromUri(uri)).to.eql('');
      };
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => test(v));
      test('');
      test('foo');
      test('data:foo/bar');
    });
  });

  describe('errors', () => {
    it('encode: throws if non-supported contentType', () => {
      const fn = () => Data.encode('foo/bar', 'abc');
      expect(fn).to.throw(/Content-type "foo\/bar" not supported/);
    });

    it('decode: throws if not a data-uri', () => {
      const fn = () => Data.decode('foobar');
      expect(fn).to.throw(/Input not a "data:" URI/);
    });

    it('decode: throws if not base64 encoded', () => {
      const fn = () => Data.decode('data:text/plain,000');
      expect(fn).to.throw(/Data URI is not base64 encoded/);
    });
  });
});
