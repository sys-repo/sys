import { runInNewContext } from 'node:vm';
import { describe, expect, it, type t } from '../../-test.ts';
import { Is } from '../common.ts';
import { Obj } from '../mod.ts';

const EXPECTED_ERROR_MESSAGE =
  'Obj.deepFreeze expected primitive leaves in a data-property graph of plain objects and arrays.';

const freezeRuntime = (input: unknown): unknown =>
  Reflect.apply(Obj.deepFreeze, undefined, [input]);

const expectContractError = (invoke: () => unknown, label = 'contract rejection'): void => {
  let failure: unknown;
  try {
    invoke();
  } catch (error) {
    failure = error;
  }

  if (!Is.error(failure)) throw new Error(`Expected Obj.deepFreeze to reject: ${label}.`);
  expect(failure, label).to.be.instanceof(TypeError);
  expect(failure.message, label).to.eql(EXPECTED_ERROR_MESSAGE);
};

describe('Obj.deepFreeze', () => {
  it('preserves primitive roots exactly', () => {
    const values = [
      ['undefined', undefined],
      ['null', null],
      ['string', 'text'],
      ['number', 42],
      ['negative zero', -0],
      ['NaN', Number.NaN],
      ['positive infinity', Infinity],
      ['negative infinity', -Infinity],
      ['true', true],
      ['false', false],
    ] as const;

    for (const [label, value] of values) {
      expect(Object.is(Obj.deepFreeze(value), value), label).to.eql(true);
    }
  });

  it('admits cross-realm base arrays but rejects cross-realm plain objects', () => {
    const local = [1, 2];
    // `node:vm` returns `any`; each assertion names only the primitive fixture shape.
    const foreignArray = runInNewContext('[1, 2]') as number[];
    const foreignObject = runInNewContext('({ value: 1 })') as { value: number };

    const foreignArrayPrototype = Object.getPrototypeOf(foreignArray);
    const foreignObjectPrototype = Object.getPrototypeOf(foreignObject);
    expect(Is.array(foreignArray)).to.eql(true);
    expect(foreignArray instanceof Array).to.eql(false);
    expect(Is.array(foreignArrayPrototype)).to.eql(true);
    expect(foreignObjectPrototype).to.not.equal(Object.prototype);
    expect(foreignObjectPrototype).to.not.equal(null);
    expect(Object.getPrototypeOf(foreignObjectPrototype)).to.equal(null);

    const localResult = Obj.deepFreeze(local);
    const foreignResult = Obj.deepFreeze(foreignArray);

    expect(localResult).to.equal(local);
    expect(foreignResult).to.equal(foreignArray);
    expect(Object.isFrozen(localResult)).to.eql(true);
    expect(Object.isFrozen(foreignResult)).to.eql(true);

    expectContractError(() => Obj.deepFreeze(foreignObject), 'cross-realm plain object');
    expect(Object.isFrozen(foreignObject)).to.eql(false);
  });

  it('rejects array subclasses before freezing their containing graph', () => {
    class MutableArray extends Array<number> {
      #state = 0;

      bump() {
        this.#state++;
      }

      read() {
        return this.#state;
      }
    }

    const subclass = new MutableArray(1, 2);
    const valid = { nested: { value: 'valid' } };
    const root = { subclass, valid };

    expect(Is.array(subclass)).to.eql(true);
    expect(Is.array(Object.getPrototypeOf(subclass))).to.eql(false);
    expectContractError(() => Obj.deepFreeze(root), 'Array subclass');

    expect(subclass.read()).to.eql(0);
    expect(Object.isFrozen(root)).to.eql(false);
    expect(Object.isFrozen(subclass)).to.eql(false);
    expect(Object.isFrozen(valid)).to.eql(false);
    expect(Object.isFrozen(valid.nested)).to.eql(false);

    subclass.bump();
    expect(subclass.read()).to.eql(1);
  });

  it('returns the same root and freezes nested objects, arrays, and indexed positions', () => {
    const input = {
      title: 'before',
      nested: { count: 1 },
      list: [{ value: 'item' }],
      tuple: [1, { flag: true }],
    };

    const result = Obj.deepFreeze(input);

    expect(result).to.equal(input);
    expect(Object.isFrozen(result)).to.eql(true);
    expect(Object.isFrozen(result.nested)).to.eql(true);
    expect(Object.isFrozen(result.list)).to.eql(true);
    expect(Object.isFrozen(result.list[0])).to.eql(true);
    expect(Object.isFrozen(result.tuple)).to.eql(true);
    expect(Object.isFrozen(result.tuple[1])).to.eql(true);

    expect(Reflect.set(result, 'title', 'after')).to.eql(false);
    expect(Reflect.set(result.nested, 'count', 2)).to.eql(false);
    expect(Reflect.set(result.list, 1, { value: 'next' })).to.eql(false);
    expect(Reflect.set(result.tuple, 0, 2)).to.eql(false);
    expect(input.title).to.eql('before');
    expect(input.nested.count).to.eql(1);
  });

  it('freezes shared nodes while retaining their identity', () => {
    const shared = { nested: { value: 'shared' } };
    const root = { left: shared, right: shared };

    const result = Obj.deepFreeze(root);

    expect(result.left).to.equal(result.right);
    expect(result.left).to.equal(shared);
    expect(Object.isFrozen(shared)).to.eql(true);
    expect(Object.isFrozen(shared.nested)).to.eql(true);
  });

  it('terminates on object and array self-cycles', () => {
    type ObjectCycle = {
      label: string;
      self?: ObjectCycle;
      list: Array<number | ObjectCycle>;
    };
    const objectCycle: ObjectCycle = { label: 'root', list: [] };
    objectCycle.self = objectCycle;
    objectCycle.list.push(objectCycle);

    const frozenObjectCycle = Obj.deepFreeze(objectCycle);

    expect(frozenObjectCycle.self).to.equal(frozenObjectCycle);
    expect(frozenObjectCycle.list[0]).to.equal(frozenObjectCycle);
    expect(Object.isFrozen(frozenObjectCycle)).to.eql(true);
    expect(Object.isFrozen(frozenObjectCycle.list)).to.eql(true);

    type ArrayCycle = Array<number | ArrayCycle>;
    const arrayCycle: ArrayCycle = [1];
    arrayCycle.push(arrayCycle);

    const frozenArrayCycle = Obj.deepFreeze(arrayCycle);

    expect(frozenArrayCycle[1]).to.equal(frozenArrayCycle);
    expect(Object.isFrozen(frozenArrayCycle)).to.eql(true);
  });

  it('does not consume the call stack for a 20,000-node graph', () => {
    type Node = { index: number; next?: Node };

    const depth = 20_000;
    const root: Node = { index: 0 };
    let cursor = root;
    for (let index = 1; index <= depth; index++) {
      const next: Node = { index };
      cursor.next = next;
      cursor = next;
    }

    const result = Obj.deepFreeze(root);
    let current: t.DeepReadonly<Node> | undefined = result;
    let count = 0;
    let firstUnfrozenIndex: number | undefined;
    while (current) {
      if (!Object.isFrozen(current) && firstUnfrozenIndex === undefined) {
        firstUnfrozenIndex = current.index;
      }
      current = current.next;
      count++;
    }

    expect(count).to.eql(depth + 1);
    expect(firstUnfrozenIndex).to.eql(undefined);
  });

  it('preserves a null prototype while freezing owned descendants', () => {
    const dictionary = { child: { value: 'null-prototype' } };
    Object.setPrototypeOf(dictionary, null);

    const result = Obj.deepFreeze(dictionary);

    expect(result).to.equal(dictionary);
    expect(Object.getPrototypeOf(result)).to.equal(null);
    expect(Object.isFrozen(result)).to.eql(true);
    expect(Object.isFrozen(result.child)).to.eql(true);
  });

  it('preserves sparse-array holes while freezing present descendants', () => {
    const child = { value: 'present' };
    const sparse: Array<typeof child | undefined> = new Array(4);
    sparse[2] = child;

    const result = Obj.deepFreeze(sparse);

    expect(result).to.equal(sparse);
    expect(result.length).to.eql(4);
    expect(0 in result).to.eql(false);
    expect(1 in result).to.eql(false);
    expect(2 in result).to.eql(true);
    expect(3 in result).to.eql(false);
    expect(result[2]).to.equal(child);
    expect(Object.isFrozen(result)).to.eql(true);
    expect(Object.isFrozen(child)).to.eql(true);
  });

  it('traverses mutable descendants of frozen roots and is idempotent', () => {
    const child = { nested: { value: 1 } };
    const root = Object.freeze({ child });

    expect(Object.isFrozen(root)).to.eql(true);
    expect(Object.isFrozen(child)).to.eql(false);

    const first = Obj.deepFreeze(root);
    const second = Obj.deepFreeze(first);

    expect(first).to.equal(root);
    expect(second).to.equal(root);
    expect(Object.isFrozen(child)).to.eql(true);
    expect(Object.isFrozen(child.nested)).to.eql(true);
  });

  it('traverses non-enumerable data properties and array decorations', () => {
    const hiddenChild = { nested: { value: 'hidden' } };
    const root = {};
    Object.defineProperty(root, 'hidden', {
      value: hiddenChild,
      enumerable: false,
      configurable: true,
      writable: true,
    });

    const metadata = { nested: { value: 'metadata' } };
    const list = [1, 2];
    Object.defineProperty(list, 'metadata', {
      value: metadata,
      enumerable: false,
      configurable: true,
      writable: true,
    });

    Obj.deepFreeze({ root, list });

    expect(Object.isFrozen(root)).to.eql(true);
    expect(Object.isFrozen(hiddenChild)).to.eql(true);
    expect(Object.isFrozen(hiddenChild.nested)).to.eql(true);
    expect(Object.getOwnPropertyDescriptor(root, 'hidden')).to.eql({
      value: hiddenChild,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    expect(Object.isFrozen(list)).to.eql(true);
    expect(Object.isFrozen(metadata)).to.eql(true);
    expect(Object.isFrozen(metadata.nested)).to.eql(true);
    expect(Object.getOwnPropertyDescriptor(list, 'metadata')).to.eql({
      value: metadata,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    expect(list).to.eql([1, 2]);
  });

  it('rejects accessors without invoking them or freezing the ordinary graph', () => {
    let getterCalls = 0;
    let setterCalls = 0;
    const child = { value: 'mutable' };
    const root = { child };
    Object.defineProperty(root, 'computed', {
      enumerable: true,
      configurable: true,
      get() {
        getterCalls++;
        return child;
      },
      set(_value: unknown) {
        setterCalls++;
      },
    });

    expectContractError(() => Obj.deepFreeze(root));

    expect(getterCalls).to.eql(0);
    expect(setterCalls).to.eql(0);
    expect(Object.isFrozen(root)).to.eql(false);
    expect(Object.isFrozen(child)).to.eql(false);
  });

  it('rejects symbol keys without partially freezing the ordinary graph', () => {
    const child = { value: 'mutable' };
    const root = { child };
    Object.defineProperty(root, Symbol('metadata'), {
      value: 'unsupported',
      enumerable: false,
    });

    expectContractError(() => Obj.deepFreeze(root));

    expect(Object.isFrozen(root)).to.eql(false);
    expect(Object.isFrozen(child)).to.eql(false);
  });

  it('validates the complete ordinary graph before freezing any node', () => {
    // Valid sentinels straddle the failure so forward and reverse traversals are both falsified.
    const leading = { nested: { value: 'leading' } };
    const invalidContainer = { unsupported: new Date(0) };
    const trailing = { nested: { value: 'trailing' } };
    const root = { leading, invalid: invalidContainer, trailing };

    expectContractError(() => freezeRuntime(root), 'nested Date');

    expect(Object.isFrozen(root)).to.eql(false);
    expect(Object.isFrozen(leading)).to.eql(false);
    expect(Object.isFrozen(leading.nested)).to.eql(false);
    expect(Object.isFrozen(invalidContainer)).to.eql(false);
    expect(Object.isFrozen(invalidContainer.unsupported)).to.eql(false);
    expect(Object.isFrozen(trailing)).to.eql(false);
    expect(Object.isFrozen(trailing.nested)).to.eql(false);
  });

  it('rejects each unsupported leaf and object category with the contract error', () => {
    class Instance {}

    const unsupported: readonly (readonly [label: string, value: unknown])[] = [
      ['class instance', new Instance()],
      ['Date', new Date(0)],
      ['RegExp', /pattern/],
      ['Map', new Map()],
      ['Set', new Set()],
      ['WeakMap', new WeakMap()],
      ['WeakSet', new WeakSet()],
      ['Promise', Promise.resolve('value')],
      ['Error', new Error('failure')],
      ['typed array', new Uint8Array(1)],
      ['DataView', new DataView(new ArrayBuffer(1))],
      ['ArrayBuffer', new ArrayBuffer(1)],
      ['SharedArrayBuffer', new SharedArrayBuffer(1)],
      ['host object', new URL('https://example.com')],
      ['custom prototype', Object.create({ inherited: true })],
      ['function', () => undefined],
      ['bigint', 1n],
      ['symbol', Symbol('value')],
    ];

    for (const [label, value] of unsupported) {
      expectContractError(() => freezeRuntime(value), label);
    }
  });
});
