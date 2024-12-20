import { Path, describe, expect, it } from '../-test.ts';
import { DEFAULTS } from './common.ts';
import { FileMap } from './mod.ts';

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
    const contentTypes = DEFAULTS.contentTypes;

    it('contentType.fromPath', () => {
      Object.keys(contentTypes).forEach((key) => {
        const ext = key as keyof typeof contentTypes;
        const path = `foo/file${ext}`;
        const a = Data.contentType.fromPath(path);
        const b = Data.contentType.fromPath(ext);
        expect(a).to.eql(contentTypes[ext]);
        expect(b).to.eql(a);
      });
    });

    it('contentType.fromPath: extension only (eg. ".gitignore")', () => {
      const test = (path: string, expected: string) => {
        expect(Data.contentType.fromPath(path)).to.eql(expected);
      };
      test('.gitignore', 'text/plain');
      test('foo/bar/.gitignore', 'text/plain');
    });

    it('contentType.fromPath: not supported → "" (empty string)', () => {
      const test = (path: string) => {
        expect(Data.contentType.fromPath(path)).to.eql('');
      };
      test('');
      test('foo');
      test('foo/bar.baz');
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => test(v));
    });

    it('contentType.fromUri', () => {
      const test = (uri: string, expected: string) => {
        expect(Data.contentType.fromUri(uri)).to.eql(expected);
      };
      test('data:text/plain;base64,abcd', 'text/plain');
      test('data:image/png;base64,abcd', 'image/png');
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
