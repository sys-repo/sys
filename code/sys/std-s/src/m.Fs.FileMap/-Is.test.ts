import { describe, expect, it, Path } from '../-test.ts';
import { DEFAULTS } from './common.ts';
import { FileMap } from './mod.ts';

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
    const test = (contentType: any, expected: boolean) => {
      expect(Is.supported.contentType(contentType)).to.eql(expected);
    };
    Object.values(DEFAULTS.contentTypes).forEach((v) => test(v, true));

    const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((v) => test(v, false));
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
    test('text/markdown', true);
    test('image/svg+xml', true);

    const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((v) => test(v, false));
    test('image/png', false);
    test('image/jpeg', false);
    test('image/webb', false);
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
    test('text/markdown', false);
  });
});
