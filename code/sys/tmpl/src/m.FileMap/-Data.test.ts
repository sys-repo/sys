import { describe, expect, it } from '../-test.ts';
import { DEFAULTS } from './common.ts';
import { FileMap } from './mod.ts';

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
