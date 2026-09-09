import { describe, expect, it } from '../../-test.ts';
import { deep as equals, unique, uniqueBy } from '../m.Eql.ts';

describe('Eql kernel and structural helpers', () => {
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

  it('compares object descriptors without invoking accessors', () => {
    let calls = 0;
    const getter = () => {
      calls += 1;
      return 1;
    };
    const otherGetter = () => {
      calls += 1;
      return 1;
    };
    const a = {};
    const b = {};
    const c = {};

    Object.defineProperty(a, 'value', { get: getter, enumerable: true, configurable: true });
    Object.defineProperty(b, 'value', { get: getter, enumerable: true, configurable: true });
    Object.defineProperty(c, 'value', {
      get: otherGetter,
      enumerable: true,
      configurable: true,
    });

    expect(equals(a, b)).to.eql(true);
    expect(equals(a, c)).to.eql(false);
    expect(calls).to.eql(0);
  });

  it('observes descriptor flags, extensibility, and prototype policy', () => {
    const writable = {};
    const readonly = {};
    Object.defineProperty(writable, 'value', { value: 1, writable: true });
    Object.defineProperty(readonly, 'value', { value: 1, writable: false });

    const extensible = { a: 1 };
    const nonExtensible = { a: 1 };
    Object.preventExtensions(nonExtensible);

    const customProto = { kind: 'custom' };
    const customA: Record<string, unknown> = Object.create(customProto);
    const customB: Record<string, unknown> = Object.create(customProto);
    customA.a = 1;
    customB.a = 1;

    const nullProtoA: Record<string, unknown> = Object.create(null);
    const nullProtoB: Record<string, unknown> = Object.create(null);
    nullProtoA.a = 1;
    nullProtoB.a = 1;

    expect(equals(writable, readonly)).to.eql(false);
    expect(equals(extensible, nonExtensible)).to.eql(false);
    expect(equals({ a: 1 }, nullProtoA)).to.eql(false);
    expect(equals(customA, customB)).to.eql(false);
    expect(equals(nullProtoA, nullProtoB)).to.eql(true);
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

  it('distinguishes array holes and compares extra array properties', () => {
    const sparse = new Array<undefined>(1);
    const explicit = [undefined];
    const sparsePeer = new Array<undefined>(1);
    const key = Symbol('extra');
    const a = [1];
    const b = [1];
    const c = [1];

    Object.defineProperty(a, key, { value: { id: 1 }, enumerable: false });
    Object.defineProperty(b, key, { value: { id: 1 }, enumerable: false });
    Object.defineProperty(c, key, { value: { id: 2 }, enumerable: false });

    expect(equals(sparse, explicit)).to.eql(false);
    expect(equals(sparse, sparsePeer)).to.eql(true);
    expect(equals(a, b)).to.eql(true);
    expect(equals(a, c)).to.eql(false);
  });

  it('compares Date and RegExp values by value and own state', () => {
    const regexA = /abc/g;
    const regexB = /abc/g;
    regexB.lastIndex = 1;

    expect(equals(new Date('2020-01-01'), new Date('2020-01-01'))).to.eql(true);
    expect(equals(new Date('2020-01-01'), new Date('2021-01-01'))).to.eql(false);
    expect(equals(new Date('invalid'), new Date('invalid'))).to.eql(true);

    expect(equals(/abc/gi, /abc/gi)).to.eql(true);
    expect(equals(/abc/g, /abc/i)).to.eql(false);
    expect(equals(regexA, regexB)).to.eql(false);
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

  it('does not invoke own accessors that shadow supported built-in operations', () => {
    let calls = 0;
    const poison = () => {
      calls += 1;
      throw new Error('shadow accessor invoked');
    };
    const shadow = (target: object, key: PropertyKey) => {
      Object.defineProperty(target, key, { get: poison, configurable: true });
    };

    const dateA = new Date('2020-01-01');
    const dateB = new Date('2020-01-01');
    shadow(dateA, 'getTime');
    shadow(dateB, 'getTime');

    const regexpA = /abc/g;
    const regexpB = /abc/g;
    shadow(regexpA, 'source');
    shadow(regexpB, 'source');
    shadow(regexpA, 'flags');
    shadow(regexpB, 'flags');

    const mapA = new Map([[{ id: 1 }, 'a']]);
    const mapB = new Map([[{ id: 1 }, 'a']]);
    shadow(mapA, 'size');
    shadow(mapB, 'size');
    shadow(mapA, 'entries');
    shadow(mapB, 'entries');

    const setA = new Set([{ id: 1 }]);
    const setB = new Set([{ id: 1 }]);
    shadow(setA, 'size');
    shadow(setB, 'size');
    shadow(setA, 'values');
    shadow(setB, 'values');

    const bytesA = new Uint8Array([1, 2, 3]);
    const bytesB = new Uint8Array([1, 2, 3]);
    shadow(bytesA, 'constructor');
    shadow(bytesB, 'constructor');

    expect(equals(dateA, dateB)).to.eql(true);
    expect(equals(regexpA, regexpB)).to.eql(true);
    expect(equals(mapA, mapB)).to.eql(true);
    expect(equals(setA, setB)).to.eql(true);
    expect(equals(bytesA, bytesB)).to.eql(true);
    expect(calls).to.eql(0);
  });

  it('treats unsupported opaque values as identity-only', () => {
    const promise = Promise.resolve(1);
    const weakMap = new WeakMap<object, unknown>();

    expect(
      equals(new URL('https://example.com/a'), new URL('https://example.com/a')),
    ).to.eql(false);
    expect(equals(Promise.resolve(1), Promise.resolve(1))).to.eql(false);
    expect(equals(promise, promise)).to.eql(true);
    expect(
      equals(new WeakMap<object, unknown>(), new WeakMap<object, unknown>()),
    ).to.eql(false);
    expect(equals(weakMap, weakMap)).to.eql(true);
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

  it('backtracks rejected map-entry candidates with shared-reference topology', () => {
    const leftShared = { id: 1 };
    const leftUnshared = { id: 1 };
    const rightUnshared = { id: 1 };
    const rightShared = { id: 1 };

    const a = new Map<unknown, unknown>([
      [leftShared, 'node'],
      [leftUnshared, 'node'],
      [{ ref: leftShared }, 'ref'],
    ]);
    const b = new Map<unknown, unknown>([
      [rightUnshared, 'node'],
      [rightShared, 'node'],
      [{ ref: rightShared }, 'ref'],
    ]);

    expect(equals(a, b)).to.eql(true);
  });

  it('compares sets by structural value equality without order dependence', () => {
    const a = new Set<unknown>([{ id: 1 }, { id: 2 }]);
    const b = new Set<unknown>([{ id: 2 }, { id: 1 }]);
    const c = new Set<unknown>([{ id: 1 }, { id: 3 }]);

    expect(equals(a, b)).to.eql(true);
    expect(equals(a, c)).to.eql(false);
  });

  it('treats undefined as a real set member', () => {
    expect(equals(new Set([undefined]), new Set([undefined]))).to.eql(true);
    expect(equals(new Set([undefined]), new Set([1]))).to.eql(false);
  });

  it('compares cyclic set members without insertion-order dependence', () => {
    type Node = { name: string; peers: Set<Node> };

    const a1: Node = { name: 'a', peers: new Set() };
    const a2: Node = { name: 'b', peers: new Set() };
    a1.peers.add(a2);
    a2.peers.add(a1);

    const b1: Node = { name: 'a', peers: new Set() };
    const b2: Node = { name: 'b', peers: new Set() };
    b1.peers.add(b2);
    b2.peers.add(b1);

    expect(equals(new Set([a1, a2]), new Set([b2, b1]))).to.eql(true);
  });

  it('backtracks rejected set-value candidates with shared-reference topology', () => {
    const leftShared = { id: 1 };
    const leftUnshared = { id: 1 };
    const rightUnshared = { id: 1 };
    const rightShared = { id: 1 };

    const a = new Set<unknown>([leftShared, leftUnshared, { ref: leftShared }]);
    const b = new Set<unknown>([rightUnshared, rightShared, { ref: rightShared }]);

    expect(equals(a, b)).to.eql(true);
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

  it('preserves graph topology for shared references and cycles', () => {
    type Link = { next?: Link };

    const sharedLeft = { id: 1 };
    const sharedRight = { id: 1 };
    const self: Link = {};
    const tail: Link = {};
    const lasso: Link = { next: tail };
    self.next = self;
    tail.next = tail;

    expect(
      equals({ x: sharedLeft, y: sharedLeft }, { x: sharedRight, y: sharedRight }),
    ).to.eql(true);
    expect(equals({ x: sharedLeft, y: sharedLeft }, { x: { id: 1 }, y: { id: 1 } })).to.eql(
      false,
    );
    expect(equals({ x: sharedLeft, y: { id: 1 } }, { x: sharedLeft, y: sharedLeft })).to.eql(
      false,
    );
    expect(equals(self, lasso)).to.eql(false);
  });

  it('dedupes by structural equality while preserving first occurrence', () => {
    const a = { id: 1 };
    const b = { id: 1 };
    const c = { id: 2 };
    const input = [a, b, c];

    const result = unique(input);

    expect(result).to.eql([a, c]);
    expect(result).not.equal(input);
    expect(input).to.eql([a, b, c]);
  });

  it('dedupes by structural keys while preserving first occurrence', () => {
    const a = { key: { id: 1 }, value: 'a' };
    const b = { key: { id: 1 }, value: 'b' };
    const c = { key: { id: 2 }, value: 'c' };
    const input = [a, b, c];

    const result = uniqueBy((item) => item.key, input);

    expect(result).to.eql([a, c]);
    expect(result).not.equal(input);
    expect(input).to.eql([a, b, c]);
  });
});
