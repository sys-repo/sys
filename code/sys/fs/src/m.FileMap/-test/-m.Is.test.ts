import { describe, expect, it } from '../../-test.ts';
import { FileMap } from '../mod.ts';

describe('FileMap.Is', () => {
  const Is = FileMap.Is;

  it('Is.dataUri', () => {
    const dataUri = Is.dataUri as (input: unknown) => boolean;
    const test = (input: unknown, expected: boolean) => {
      expect(dataUri(input)).to.eql(expected);
    };

    test('data:text/plain;base64,0000', true);
    test('DATA:text/plain,hello', true);
    test('data:,hello', true);
    test('text/plain;base64,0000', false);
    test('data:text/plain', false);
    test('data:text/*,hello', false);
    test('data:text/plain;broken,hello', false);
    [123, true, null, undefined, {}, []].forEach((input) => test(input, false));
  });

  it('Is.supported.contentType delegates syntactic validity', () => {
    const test = (contentType: string, expected: boolean) => {
      expect(Is.supported.contentType(contentType)).to.eql(expected);
    };

    test('text/plain', true);
    test('TEXT/PLAIN; charset=UTF-8', true);
    test('image/png', true);
    test('application/vnd.example', true);
    test('application/vnd.example+json; version=1', true);
    test('', false);
    test('foo', false);
    test('*/*', false);
    test('text/plain;', false);
    test('text/plain; charset UTF-8', false);
  });

  it('Is.contentType.string delegates canonical text classification', () => {
    const test = (contentType: string, expected: boolean) => {
      expect(Is.contentType.string(contentType)).to.eql(expected);
    };

    test('text/plain; charset=UTF-8', true);
    test('application/json', true);
    test('application/vnd.api+json', true);
    test('application/example+yaml', true);
    test('image/svg+xml', true);
    test('application/javascript', true);
    test('application/typescript+jsx', true);
    test('application/octet-stream; type=text/plain', false);
    test('application/vnd.example', false);
    test('image/png', false);
    test('malformed', false);
  });

  it('Is.contentType.binary delegates valid non-text classification', () => {
    const test = (contentType: string, expected: boolean) => {
      expect(Is.contentType.binary(contentType)).to.eql(expected);
    };

    test('image/png', true);
    test('application/octet-stream', true);
    test('application/vnd.example', true);
    test('application/json', false);
    test('text/plain', false);
    test('image/svg+xml', false);
    test('malformed', false);
  });

  describe('Is.fileMap', () => {
    it('detects valid and invalid file-map values', () => {
      expect(Is.fileMap({ foo: 'bar', baz: 'qux' })).to.eql(true); // ← valid
      expect(Is.fileMap({ foo: 123 })).to.eql(false); //              ← value not string
      expect(Is.fileMap(['foo', 'bar'])).to.eql(false); //            ← array, not record
      expect(Is.fileMap(null)).to.eql(false); //                      ← null
      expect(Is.fileMap(undefined)).to.eql(false); //                 ← undefined
      expect(Is.fileMap('not-object')).to.eql(false); //              ← string
      expect(Is.fileMap({})).to.eql(true); //                         ← empty object ok
    });
  });
});
