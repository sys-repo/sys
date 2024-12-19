import { describe, expect, it, Path } from '../-test.ts';
import { DEFAULTS } from './common.ts';
import { FileMap } from './mod.ts';

describe('FileMap.Is', () => {
  it('Is.pathSupported', () => {
    const test = (path: any, expected: boolean) => {
      const ext = Path.extname(path);
      expect(FileMap.Is.pathSupported(path)).to.eql(expected);
      expect(FileMap.Is.pathSupported(ext)).to.eql(expected);
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

  it('Is.mimeSupported', () => {
    const test = (contentType: any, expected: boolean) => {
      expect(FileMap.Is.mimeSupported(contentType)).to.eql(expected);
    };
    Object.values(DEFAULTS.contentTypes).forEach((v) => test(v, true));

    const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((v) => test(v, false));
    test('', false);
    test('foo', false);
    test('foo/bar', false);
  });

  it('Is.dataUri', () => {
    const test = (input: any, expected: boolean) => {
      expect(FileMap.Is.dataUri(input)).to.eql(expected);
    };
    test('data:text/plain;base64,0000', true);
    test('text/plain;base64,0000', false);
    const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((v) => test(v, false));
  });
});
