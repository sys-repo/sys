import { describe, expect, it } from '../../-test.ts';
import { DEFAULTS } from '../common.ts';
import { FileMap } from '../mod.ts';

describe('FileMap.Is', () => {
  const Is = FileMap.Is;

  it('Is.dataUri', () => {
    const test = (input: any, expected: boolean) => {
      expect(Is.dataUri(input)).to.eql(expected);
    };
    test('data:text/plain;base64,0000', true);
    test('text/plain;base64,0000', false);
    const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((v) => test(v, false));
  });

  it('Is.supported.contentType', () => {
    const set = new Set<string>([
      DEFAULTS.contentType.toLowerCase(),
      ...Object.values(DEFAULTS.contentTypes.all()).map((m) => m.toLowerCase()),
      ...Object.keys(DEFAULTS.contentTypes.structuredText).map((m) => m.toLowerCase()),
    ]);

    const test = (mime: any, expected: boolean) => {
      expect(Is.supported.contentType(mime)).to.eql(expected);
    };

    // All supported should be true (case preserved as in our set)
    set.forEach((m) => test(m, true));

    // Also explicitly assert structuredText mimes are supported
    test('application/markdown', true);
    test('application/javascript', true);

    // Nonsensical values
    [123, true, null, undefined, BigInt(0), Symbol('x'), {}, []].forEach((v: any) =>
      test(v, false),
    );
    test('', false);
    test('foo', false);
    test('foo/bar', false);
  });

  it('Is.contentType.string', () => {
    const test = (contentType: any, expected: boolean) => {
      expect(Is.contentType.string(contentType)).to.eql(expected);
    };

    test('application/json', true);
    test('text/plain', true);
    test('text/markdown', true);
    test('image/svg+xml', true);
    test('application/markdown', true);
    test('application/javascript', true);

    const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((v) => test(v, false));
    test('image/png', false);
    test('image/jpeg', false);
    test('image/webb', false); // ← Not a real mime.
  });

  it('Is.contentType.binary', () => {
    const test = (contentType: any, expected: boolean) => {
      expect(Is.contentType.binary(contentType)).to.eql(expected);
    };

    test('image/png', true);
    test('image/jpeg', true);
    test('image/webp', true);

    const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((v) => test(v, false));
    test('application/json', false);
    test('text/plain', false);
    test('text/markdown', false);
    test('application/markdown', false);
    test('application/javascript', false);
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
