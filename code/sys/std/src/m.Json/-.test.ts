import { describe, expect, it, type t } from '../-test.ts';
import { Json } from './mod.ts';

describe('Json', () => {
  const circular: any = { foo: 123 };
  circular.ref = circular;

  describe('Json.stringify', () => {
    describe('complex values (multi-line, double-spaces, trailing new-line char)', () => {
      it('{ object }', () => {
        const obj = { foo: 123 };
        const res = Json.stringify(obj);
        expect(res).to.include('  "foo":');
        expect(res.includes('\n')).to.eql(true);
        expect(res[res.length - 2]).to.eql('}');
        expect(res[res.length - 1]).to.eql('\n');
      });

      it('[ array ]', () => {
        const obj = ['foo', 123];
        const res = Json.stringify(obj);
        expect(res).to.include('  "foo",\n');
        expect(res[res.length - 2]).to.eql(']');
        expect(res[res.length - 1]).to.eql('\n');
      });

      it('change indent', () => {
        const obj = { foo: 123, list: [12, 3] };
        const a = Json.stringify(obj);
        const b = Json.stringify(obj, 2);
        const c = Json.stringify(obj, 0);
        expect(a).to.eql(b);
        expect(b).to.not.eql(c);
      });

      it('circular reference (safe)', () => {
        const res = Json.stringify(circular, 0);
        expect(res).to.eql('{"foo":123,"ref":"[Circular]"}');
      });
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

  describe('Json.parse', () => {
    it('parses simple values', () => {
      const test = (input: any) => {
        const text = Json.stringify(input);
        const res = Json.parse(text, input);
        expect(res).to.eql(input);
      };
      test(true);
      test('hello');
      test(123);
      test([123]);
      test({ msg: 123 });
      test(null);
    });

    it('param types (variants)', () => {
      type T = { foo: number };
      const obj: T = { foo: 123 };
      const text = Json.stringify(obj);

      const a = Json.parse<T>(text);
      const b = Json.parse<T>(text, { foo: 0 });

      expect(a?.foo).to.eql(123);
      expect(b.foo).to.eql(123);
    });

    it('undefined: returns default value', () => {
      const obj = { foo: 123 };
      const res1 = Json.parse(undefined, obj);
      const res2 = Json.parse(undefined, () => obj);
      expect(res1).to.equal(obj);
      expect(res2).to.equal(obj);
    });

    it('throws', () => {
      const fn = () => Json.parse(`$-FAIL`, {});
      expect(fn).to.throw(/Unexpected token/);
    });
  });

  describe('Json.safeParse', () => {
    it('parses simple values', () => {
      const test = (input: any) => {
        const text = Json.stringify(input);
        const res = Json.safeParse(text, input);
        expect(res.ok).to.eql(true);
        expect(res.data).to.eql(input);
        expect(res.error).to.eql(undefined);
      };
      test(true);
      test('hello');
      test(123);
      test([123]);
      test({ msg: 123 });
      test(null);
    });

    it('undefined: returns default value', () => {
      const obj = { foo: 123 };
      const res1 = Json.safeParse(undefined, obj);
      const res2 = Json.safeParse(undefined, () => obj);

      expect(res1.ok).to.equal(true);
      expect(res2.ok).to.equal(true);

      expect(res1.data).to.equal(obj);
      expect(res2.data).to.equal(obj);

      expect(res1.error).to.eql(undefined);
      expect(res2.error).to.eql(undefined);
    });

    it('param types (variants)', () => {
      type T = { foo: number };
      const obj: T = { foo: 123 };
      const text = Json.stringify(obj);

      const a = Json.safeParse<T>(text);
      const b = Json.safeParse<T>(text, { foo: 0 });

      expect(a.data?.foo).to.eql(123);
      expect(b.data.foo).to.eql(123);
    });

    it('returns error', () => {
      const res = Json.safeParse(`$-FAIL`, {});
      expect(res.ok).to.eql(false);
      expect(res.data).to.eql(undefined);
      expect(res.error?.message).to.include(`Unexpected token '$', "$-FAIL" is not valid JSON`);
      expect(res.error?.name).to.eql('SyntaxError');
    });
  });
});
