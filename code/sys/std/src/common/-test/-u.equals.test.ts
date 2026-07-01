import { describe, expect, it } from '../../-test.ts';
import { equals } from '../u.equals.ts';

describe('u.equals', () => {
  it('compares primitives with Object.is semantics', () => {
    expect(equals(123, 123)).to.eql(true);
    expect(equals('foo', 'foo')).to.eql(true);
    expect(equals(true, true)).to.eql(true);
    expect(equals(null, null)).to.eql(true);
    expect(equals(undefined, undefined)).to.eql(true);
    expect(equals(NaN, NaN)).to.eql(true);
    expect(equals(0, -0)).to.eql(false);

    expect(equals(123, 456)).to.eql(false);
    expect(equals('foo', 'bar')).to.eql(false);
    expect(equals(true, false)).to.eql(false);
    expect(equals(null, undefined)).to.eql(false);
  });

  it('compares nested objects and arrays structurally', () => {
    const a = { a: 1, b: { c: [1, { d: 2 }] } };
    const b = { a: 1, b: { c: [1, { d: 2 }] } };
    const c = { a: 1, b: { c: [1, { d: 3 }] } };

    expect(equals(a, b)).to.eql(true);
    expect(equals(a, c)).to.eql(false);
  });

  it('includes symbol and non-enumerable own keys', () => {
    const key = Symbol('key');
    const a = { [key]: 1 };
    const b = { [key]: 1 };
    const c = { [key]: 2 };

    Object.defineProperty(a, 'hidden', { value: 'x', enumerable: false });
    Object.defineProperty(b, 'hidden', { value: 'x', enumerable: false });
    Object.defineProperty(c, 'hidden', { value: 'x', enumerable: false });

    expect(equals(a, b)).to.eql(true);
    expect(equals(a, c)).to.eql(false);
  });

  it('compares Date and RegExp values by value', () => {
    expect(equals(new Date('2020-01-01'), new Date('2020-01-01'))).to.eql(true);
    expect(equals(new Date('2020-01-01'), new Date('2021-01-01'))).to.eql(false);

    expect(equals(/abc/gi, /abc/gi)).to.eql(true);
    expect(equals(/abc/g, /abc/i)).to.eql(false);
  });

  it('compares ArrayBuffer and typed-array values by byte content', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3]);
    const c = new Uint8Array([1, 2, 4]);

    expect(equals(a, b)).to.eql(true);
    expect(equals(a, c)).to.eql(false);
    expect(equals(a.buffer, b.buffer)).to.eql(true);
    expect(equals(a.buffer, c.buffer)).to.eql(false);
  });

  it('compares maps by structural key/value equality without order dependence', () => {
    const a = new Map<unknown, unknown>([
      [{ id: 1 }, { value: 'a' }],
      [{ id: 2 }, { value: 'b' }],
    ]);
    const b = new Map<unknown, unknown>([
      [{ id: 2 }, { value: 'b' }],
      [{ id: 1 }, { value: 'a' }],
    ]);
    const c = new Map<unknown, unknown>([
      [{ id: 1 }, { value: 'a' }],
      [{ id: 2 }, { value: 'c' }],
    ]);

    expect(equals(a, b)).to.eql(true);
    expect(equals(a, c)).to.eql(false);
  });

  it('rolls back rejected map-entry candidates', () => {
    const rejectedChild = { n: 999 };
    const aKey = { x: { n: 1 }, y: 2 };
    const badFirst = { x: rejectedChild, y: 3 };
    const badSecond = { x: rejectedChild, y: 2 };

    const a = new Map<unknown, unknown>([[aKey, 'value']]);
    const b = new Map<unknown, unknown>([
      [badFirst, 'wrong'],
      [badSecond, 'value'],
    ]);

    expect(equals(a, b)).to.eql(false);
  });

  it('compares sets by structural value equality without order dependence', () => {
    const a = new Set<unknown>([{ id: 1 }, { id: 2 }]);
    const b = new Set<unknown>([{ id: 2 }, { id: 1 }]);
    const c = new Set<unknown>([{ id: 1 }, { id: 3 }]);

    expect(equals(a, b)).to.eql(true);
    expect(equals(a, c)).to.eql(false);
  });

  it('rolls back rejected set-value candidates', () => {
    const rejectedChild = { n: 999 };
    const a = new Set<unknown>([{ x: { n: 1 }, y: 2 }]);
    const b = new Set<unknown>([
      { x: rejectedChild, y: 3 },
      { x: rejectedChild, y: 2 },
    ]);

    expect(equals(a, b)).to.eql(false);
  });

  it('rolls back accepted nested candidate assumptions when the outer candidate fails', () => {
    type Child = { parent?: unknown };
    type Parent = { map: Map<Child, string>; ok: boolean };

    const aChild: Child = {};
    const a: Parent = { map: new Map([[aChild, 'child']]), ok: true };
    aChild.parent = a;

    const rejectedChild: Child = {};
    const rejected: Parent = { map: new Map([[rejectedChild, 'child']]), ok: false };
    rejectedChild.parent = rejected;

    const reused: Parent = { map: new Map([[rejectedChild, 'child']]), ok: true };

    expect(equals(new Set([a, rejected]), new Set([rejected, reused]))).to.eql(false);
  });

  it('handles equivalent cyclic structures safely', () => {
    const a: { name: string; self?: unknown } = { name: 'a' };
    const b: { name: string; self?: unknown } = { name: 'a' };
    a.self = a;
    b.self = b;

    expect(equals(a, b)).to.eql(true);
  });
});
