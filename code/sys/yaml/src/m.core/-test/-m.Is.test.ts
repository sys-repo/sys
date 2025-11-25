import { YAMLError } from 'yaml';
import { describe, expect, it } from '../../-test.ts';

import { type t, Err, ERR } from '../common.ts';
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

    it('is strict: both values must be integers ≥ 0', () => {
      test([0.1, 2], false);
      test([0, 2.5], false);
      test([NaN, 3], false);
    });
  });

  describe('Is.diagnostic', () => {
    it('valid diagnostic', () => {
      const d: t.Yaml.Diagnostic = {
        message: 'traits must be an array',
        code: 'slug/schema',
        path: ['foo', 'bar', 'traits'],
        range: [12, 18],
      };
      expect(Yaml.Is.diagnostic(d)).to.eql(true);
    });

    it('invalid diagnostic (bad code type)', () => {
      const d = { message: 'x', code: 123, range: [0, 1] } as any; // code must be string
      expect(Yaml.Is.diagnostic(d)).to.eql(false);
    });

    it('invalid diagnostic (bad path)', () => {
      const d = { message: 'x', path: [Symbol('nope')], range: [0, 1] } as any;
      expect(Yaml.Is.diagnostic(d)).to.eql(false);
    });

    it('invalid diagnostic (bad range)', () => {
      const d = { message: 'x', range: [0] } as any;
      expect(Yaml.Is.diagnostic(d)).to.eql(false);
    });
  });

  describe('array guards', () => {
    it('diagnosticArray: all valid → true; mixed → false', () => {
      const ok: t.Yaml.Diagnostic[] = [
        { message: 'a', range: [0, 1] },
        { message: 'b', path: ['p'] },
      ];
      expect(Yaml.Is.diagnosticArray(ok)).to.eql(true);

      const mixed = [...ok, { message: 'bad', range: [0] } as any];
      expect(Yaml.Is.diagnosticArray(mixed)).to.eql(false);
    });

    it('parseErrorArray: all valid → true; mixed → false', () => {
      const e1 = new YAMLError('YAMLParseError', [1, 2], 'X' as any, 'm1');
      const e2 = new YAMLError('YAMLParseError', [3, 4], 'Y' as any, 'm2');
      expect(Yaml.Is.parseErrorArray([e1, e2])).to.eql(true);
      expect(Yaml.Is.parseErrorArray([e1, { pos: [0] } as any])).to.eql(false);
    });
  });

  describe('value-node guards (scalar/map/seq/pair/alias)', () => {
    const yaml = `
      scalar: hello
      mapping:
        key: value
      seq:
        - one
        - two
      base: &base 123
      alias: *base
    `;

    const doc = Yaml.parseAst(yaml);
    const root = (doc as any).contents as any; // root mapping

    const getPair = (k: string) => root.items.find((p: any) => p?.key?.value === k);

    it('map / seq / pair / scalar / alias → true on correct nodes', () => {
      // root is a mapping
      expect(Yaml.Is.map(root)).to.eql(true);
      expect(Yaml.Is.seq(root)).to.eql(false);
      expect(Yaml.Is.pair(root)).to.eql(false);
      expect(Yaml.Is.scalar(root)).to.eql(false);
      expect(Yaml.Is.alias(root)).to.eql(false);

      // scalar: hello
      const scalarPair = getPair('scalar');
      const scalarNode = scalarPair.value;
      expect(Yaml.Is.pair(scalarPair)).to.eql(true);
      expect(Yaml.Is.scalar(scalarNode)).to.eql(true);
      expect(Yaml.Is.map(scalarNode)).to.eql(false);
      expect(Yaml.Is.seq(scalarNode)).to.eql(false);
      expect(Yaml.Is.alias(scalarNode)).to.eql(false);

      // mapping:
      const mappingPair = getPair('mapping');
      const mappingNode = mappingPair.value;
      expect(Yaml.Is.map(mappingNode)).to.eql(true);
      expect(Yaml.Is.seq(mappingNode)).to.eql(false);
      expect(Yaml.Is.scalar(mappingNode)).to.eql(false);
      expect(Yaml.Is.alias(mappingNode)).to.eql(false);

      // seq:
      const seqPair = getPair('seq');
      const seqNode = seqPair.value;
      expect(Yaml.Is.seq(seqNode)).to.eql(true);
      expect(Yaml.Is.map(seqNode)).to.eql(false);
      expect(Yaml.Is.scalar(seqNode)).to.eql(false);
      expect(Yaml.Is.alias(seqNode)).to.eql(false);

      // alias:
      const aliasPair = getPair('alias');
      const aliasNode = aliasPair.value;
      expect(Yaml.Is.alias(aliasNode)).to.eql(true);
      expect(Yaml.Is.scalar(aliasNode)).to.eql(false);
      expect(Yaml.Is.map(aliasNode)).to.eql(false);
      expect(Yaml.Is.seq(aliasNode)).to.eql(false);
    });

    it('guards return false for non-node values', () => {
      const NON: unknown[] = ['', 123, true, null, undefined, {}, []];

      for (const v of NON) {
        expect(Yaml.Is.scalar(v)).to.eql(false);
        expect(Yaml.Is.map(v)).to.eql(false);
        expect(Yaml.Is.seq(v)).to.eql(false);
        expect(Yaml.Is.pair(v)).to.eql(false);
        expect(Yaml.Is.alias(v)).to.eql(false);
      }
    });
  });
});
