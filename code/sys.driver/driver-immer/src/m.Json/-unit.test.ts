import { Json } from './mod.ts';
import { Patch } from '../mod.ts';
import { ObjectPath, describe, expect, it, type t } from '../-test.ts';

describe('Json', () => {
  it('exposes [Patch]', () => {
    expect(Json.Patch).to.equal(Patch);
  });

  it('exposes [Path]', () => {
    expect(Json.Path).to.equal(ObjectPath);
  });

  it('isJson', () => {
    const test = (input: any, expected: boolean) => {
      expect(Json.isJson(input)).to.eql(expected);
    };

    test({}, false);
    test([], false);
    test(123, false);
    test(true, false);
    test('foo', false);

    test('{}', true);
    test('[]', true);
    test('{ "foo": 123 }', true);
    test('[1, 2, 3]', true);

    test('  {}  ', true);
    test('  []  ', true);
  });

  describe('stringify', () => {
    it('stringify: {object}', () => {
      const obj = { foo: 123 };
      const res = Json.stringify(obj);
      expect(res).to.include('  "foo":');
      expect(res.includes('\n')).to.eql(true);
      expect(res[res.length - 2]).to.eql('}');
      expect(res[res.length - 1]).to.eql('\n');
    });

    describe('primitive values (single-line string)', () => {
      const test = (input: t.Json, expected: string) => {
        const res = Json.stringify(input);
        expect(res.includes('\n')).to.eql(false);
        expect(res).to.eql(expected);
        expect(JSON.parse(res)).to.eql(input);
      };

      it('write: null', () => test(null, 'null'));
      it('write: string', () => test('hello', '"hello"'));
      it('write: number', () => test(1234, '1234'));
      it('write: boolean', () => {
        test(true, 'true');
        test(false, 'false');
      });

      it('throw: [undefined]', () => {
        const fn = () => Json.stringify(undefined as any);
        expect(fn).to.throw(/\[undefined\] is not valid JSON input/);
      });
    });
  });
});
