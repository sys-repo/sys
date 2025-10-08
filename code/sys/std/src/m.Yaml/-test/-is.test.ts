import { YAMLError } from 'yaml';
import { describe, expect, it } from '../../-test.ts';

import { Err, ERR } from '../common.ts';
import { Yaml } from '../mod.ts';

describe('Yaml.Is', () => {
  describe('Is.parseError', () => {
    const test = (input: any, expected: boolean) =>
      expect(Yaml.Is.parseError(input)).to.eql(expected);

    it('parseError: true', () => {
      // Name/cause flags:
      test(Err.std('foo', { name: ERR.PARSE }), true);
      test(Err.std('foo', { cause: { name: ERR.PARSE, message: 'derp' } }), true);
    });

    it('parseError: false', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v) => test(v, false));
      test(Err.std('foo'), false);
    });

    it('YAMLError instance', () => {
      const e = new YAMLError(
        'YAMLParseError',
        [5, 9],
        'YAML_UNEXPECTED_TOKEN' as any,
        'unexpected token',
      );
      expect(Yaml.Is.parseError(e)).to.eql(true);
    });

    it('structural pos fallback', () => {
      // Not an Error instance, but parser-like shape with `.pos`
      const like = { name: 'YAMLParseError', message: 'bad indent', pos: [0, 2] };
      expect(Yaml.Is.parseError(like)).to.eql(true);

      // Invalid shapes:
      const name = 'YAMLParseError';
      expect(Yaml.Is.parseError({ name, message: 'x', pos: [0] })).to.eql(false);
      expect(Yaml.Is.parseError({ name, message: 'x', pos: ['a', 'b'] })).to.eql(false);
    });
  });

  describe('Yaml.Is.posTuple', () => {
    const test = (input: any, expected: boolean) =>
      expect(Yaml.Is.posTuple(input)).to.eql(expected);

    it('returns true for valid [start,end] tuples', () => {
      test([0, 1], true);
      test([5, 10], true);
      test([0, 0], true);
    });

    it('returns false for invalid shapes', () => {
      test(undefined, false);
      test(null, false);
      test([], false);
      test([0], false);
      test([0, 1, 2], false);
      test(['0', 1], false);
      test([0, '1'], false);
      test([-1, 2], false);
      test([1, -2], false);
      test({ 0: 1, 1: 2 }, false);
    });
});
