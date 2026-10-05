import { describe, expect, it } from '../../-test.ts';
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
    expect(a).to.eql('data:image/png;base64,AQID');
    expect(b).to.eql(data);
  });

  it('encode → decode: parameterized text', () => {
    const a = Data.encode('text/plain; charset=UTF-8', 'foobar');
    const b = Data.decode(a);
    expect(a).to.eql('data:text/plain; charset=UTF-8;base64,Zm9vYmFy');
    expect(b).to.eql('foobar');
  });

  it('encode → decode: valid custom binary media type', () => {
    const data = new Uint8Array([1, 2, 3]);
    const a = Data.encode('application/vnd.example', data);
    const b = Data.decode(a);
    expect(a).to.eql('data:application/vnd.example;base64,AQID');
    expect(b).to.eql(data);
  });

  it('does not double encode', () => {
    const a = Data.encode('text/plain', 'foobar');
    const b = Data.encode('text/plain', a);
    expect(a).to.eql('data:text/plain;base64,Zm9vYmFy');
    expect(b).to.eql(a);
  });

  describe('contentType', () => {
    it('contentType.fromPath: canonical source profile and standard registry', () => {
      const test = (path: string, expected: string) => {
        expect(Data.contentType.fromPath(path)).to.eql(expected);
      };

      test('foo/file.ts', 'application/typescript');
      test('foo/file.MTS', 'application/typescript');
      test('foo/file.cts', 'application/typescript');
      test('foo/file.tsx', 'application/typescript+jsx');
      test('foo/file.json', 'application/json');
      test('foo/file.yaml', 'text/yaml');
      test('foo/file.HTML', 'text/html');
      test('foo/file.png', 'image/png');
      test('.json', 'application/json');
    });

    it('contentType.fromPath: unknown path → text fallback', () => {
      const test = (path: string) => {
        expect(Data.contentType.fromPath(path)).to.eql('text/plain');
      };

      test('');
      test('foo');
      test('foo/bar.baz');
      test('foo/foo.vue');
      test('.gitignore');
      test('foo/bar/.gitignore');
    });

    it('contentType.fromUri: canonical bare media type', () => {
      const test = (uri: string, expected: string) => {
        expect(Data.contentType.fromUri(uri)).to.eql(expected);
      };

      test('data:text/HTML;charset=UTF-8,hello', 'text/html');
      test('data:image/png;base64,abcd', 'image/png');
      test('data:application/vnd.api+JSON;version=1,{}', 'application/vnd.api+json');
      test('data:,hello', 'text/plain');
      test('data:;base64,SGVsbG8=', 'text/plain');
    });

    it('contentType.fromUri: malformed or non-data input → empty string', () => {
      const fromUri = Data.contentType.fromUri as (uri: unknown) => string;
      const test = (uri: unknown) => {
        expect(fromUri(uri)).to.eql('');
      };

      test('');
      test('foo');
      test('data:foo/bar');
      test('data:text/plain');
      test('data:text/*,hello');
      test('data:text/plain;broken,hello');
      [123, true, null, undefined, {}, []].forEach(test);
    });
  });

  describe('errors', () => {
    it('encode: throws if contentType is malformed', () => {
      const fn = () => Data.encode('not-a-media-type', 'abc');
      expect(fn).to.throw(/Content-type "not-a-media-type" not supported/);
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
