import { describe, expect, it } from '../-test.ts';
import { isEmptyRecord, isObject, isPlainObject, isPlainRecord, isRecord } from './u.is.ts';

type O = Record<string, unknown>;
class MyClass {
  x = 1;
}

describe('u.is (primitive flag evaluators)', () => {
  describe('isObject', () => {
    it('returns true for any non-null object (arrays included)', () => {
      expect(isObject({})).to.eql(true);
      expect(isObject([])).to.eql(true);
      expect(isObject(new MyClass())).to.eql(true);
    });

    it('returns false for null and primitives', () => {
      expect(isObject(null)).to.eql(false);
      expect(isObject(undefined)).to.eql(false);
      expect(isObject(42)).to.eql(false);
      expect(isObject('abc')).to.eql(false);
      expect(isObject(true)).to.eql(false);
    });
  });

  describe('isRecord', () => {
    it('accepts plain objects and class instances', () => {
      expect(isRecord<O>({ foo: 1 })).to.eql(true);
      expect(isRecord<O>(new MyClass())).to.eql(true);
    });

    it('accepts objects with a null prototype', () => {
      const naked = Object.create(null);
      expect(isRecord<O>(naked)).to.eql(true);
    });

    it('rejects arrays', () => {
      expect(isRecord<O>([])).to.eql(false);
    });
  });

  describe('isEmptyRecord', () => {
    it('returns true for an empty plain object', () => {
      expect(isEmptyRecord<O>({})).to.eql(true);
    });

    it('returns false for non-empty objects', () => {
      expect(isEmptyRecord<O>({ x: 1 })).to.eql(false);
    });

    it('returns false for arrays, null, and primitives', () => {
      expect(isEmptyRecord<O>([])).to.eql(false);
      expect(isEmptyRecord<O>(null)).to.eql(false as unknown as boolean); // TS narrow-cast.
      expect(isEmptyRecord<O>('foo' as unknown)).to.eql(false);
    });
  });

  describe('isPlainObject', () => {
    it('accepts {} and object literals', () => {
      expect(isPlainObject({})).to.eql(true);
      expect(isPlainObject({ a: 1, b: 2 })).to.eql(true);
    });

    it('accepts Object.create(null)', () => {
      const obj = Object.create(null);
      obj.a = 1;
      expect(isPlainObject(obj)).to.eql(true);
    });

    it('rejects arrays', () => {
      expect(isPlainObject([])).to.eql(false);
      expect(isPlainObject([1, 2, 3])).to.eql(false);
    });

    it('rejects class instances', () => {
      class C {
        x = 1;
      }
      const inst = new C();
      expect(isPlainObject(inst)).to.eql(false);
    });

    it('rejects Date objects', () => {
      expect(isPlainObject(new Date())).to.eql(false);
    });

    it('rejects null and primitives', () => {
      expect(isPlainObject(null)).to.eql(false);
      expect(isPlainObject(42)).to.eql(false);
      expect(isPlainObject('foo')).to.eql(false);
      expect(isPlainObject(true)).to.eql(false);
    });
  });

  describe('isPlainRecord', () => {
    it('accepts only Object.create(null)', () => {
      const obj = Object.create(null);
      obj.a = 1;
      expect(isPlainRecord(obj)).to.eql(true);
    });

    it('rejects ordinary object literals', () => {
      expect(isPlainRecord({})).to.eql(false);
      expect(isPlainRecord({ a: 1 })).to.eql(false);
    });

    it('rejects arrays', () => {
      expect(isPlainRecord([])).to.eql(false);
    });

    it('rejects class instances', () => {
      class C {
        x = 1;
      }
      expect(isPlainRecord(new C())).to.eql(false);
    });

    it('rejects Date objects', () => {
      expect(isPlainRecord(new Date())).to.eql(false);
    });

    it('rejects null and primitives', () => {
      expect(isPlainRecord(null)).to.eql(false);
      expect(isPlainRecord(123)).to.eql(false);
      expect(isPlainRecord('abc')).to.eql(false);
    });
  });
});
