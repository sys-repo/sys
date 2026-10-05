import { describe, expect, it } from '../../../-test.ts';
import { Dispose, Is, Rx } from '../../-test/common.ts';
import { Snapshot } from '../mod.ts';

describe('Dispose.Snapshot.until', () => {
  const capture = (input?: unknown) => Snapshot.until(input);
  const rejects = (input: unknown) => {
    expect(() => capture(input)).to.throw(TypeError, /^Invalid UntilInput$/);
  };

  it('captures undefined, scalars, empty and nested containers', () => {
    const signal = new AbortController().signal;
    const leaf = Rx.subject();
    const life = Dispose.lifecycle();
    expect(capture()).to.equal(undefined);
    expect(capture(undefined)).to.equal(undefined);
    for (const value of [signal, leaf, life]) expect(capture(value)).to.equal(value);

    const child = [leaf, undefined, signal];
    const source = [life, child, [], leaf];
    const captured = capture(source);
    expect(captured).to.eql(source);
    expect(captured).not.to.equal(source);
    const result = captured as readonly unknown[];
    expect(result[0]).to.equal(life);
    expect(result[1]).not.to.equal(child);
    expect(result[3]).to.equal(leaf);
    expect(Object.isFrozen(result)).to.equal(true);
    expect(Object.isFrozen(result[1])).to.equal(true);
    expect(Object.isFrozen(result[2])).to.equal(true);
    expect(Object.isFrozen(child)).to.equal(false);
    expect(Object.isFrozen(leaf)).to.equal(false);
    expect(Object.isFrozen(life)).to.equal(false);
    child.splice(0, child.length);
    source.length = 0;
    expect(captured).to.eql([life, [leaf, undefined, signal], [], leaf]);
    expect(life.disposed).to.equal(false);
    life.dispose();
  });

  it('accepts exactly 256 nodes including containers and undefined placeholders', () => {
    const leaf = Rx.subject();
    for (const value of [undefined, leaf]) {
      const exact = Array(255).fill(value);
      expect(capture(exact)).to.eql(exact);
      rejects([...exact, value]);
      // Root + child + 254 placeholders/leaves = 256.
      expect(capture([exact.slice(1)])).to.eql([exact.slice(1)]);
      rejects([exact]);
    }
  });

  it('accepts 32 array levels but not 33', () => {
    let input: unknown = Rx.subject();
    for (let i = 0; i < 32; i++) input = [input];
    expect(capture(input)).to.eql(input);
    rejects([input]);
  });

  it('rejects cycles and acyclic shared containers but accepts repeated leaves', () => {
    const leaf = Rx.subject();
    expect(capture([leaf, [leaf]])).to.eql([leaf, [leaf]]);
    const child = [leaf];
    rejects([child, child]);
    const cycle: unknown[] = [];
    cycle.push(cycle);
    rejects(cycle);
    const indirect: unknown[] = [cycle];
    cycle[0] = indirect;
    rejects(indirect);
  });

  it('rejects nonnative, sparse, extra-key and accessor containers without executing them', () => {
    let calls = 0;
    const getter = () => {
      calls++;
      throw new Error('container executed');
    };
    const accessor = Object.defineProperty([undefined], '0', { get: getter });
    const iterator = Object.defineProperty([], Symbol.iterator, { get: getter });
    const hidden = Object.defineProperty([undefined], '0', { enumerable: false });
    const huge = new Array(2 ** 32 - 1);
    Object.defineProperty(huge, '0', { get: getter });
    const invalid = [
      null,
      false,
      1,
      '',
      {},
      () => undefined,
      new Array(1),
      accessor,
      iterator,
      hidden,
      huge,
      Object.assign([], { extra: true }),
      Object.assign([], { [Symbol('extra')]: true }),
      Object.assign([], { '01': undefined }),
      new (class extends Array {})(),
      Object.setPrototypeOf([], null),
    ];
    for (const input of invalid) rejects(input);
    expect(calls).to.equal(0);
  });

  it('rejects proxies and proxy prototypes without invoking traps, including revoked proxies', () => {
    let calls = 0;
    const trap = () => {
      calls++;
      throw new Error('proxy trap executed');
    };
    const handler = {
      get: trap,
      getPrototypeOf: trap,
      ownKeys: trap,
      getOwnPropertyDescriptor: trap,
      has: trap,
    };
    const revoked = Proxy.revocable([], handler);
    revoked.revoke();
    const proxy = new Proxy({}, handler);
    const invalid = [
      proxy,
      new Proxy([], handler),
      new Proxy(() => undefined, handler),
      revoked.proxy,
      Object.create(proxy),
      Object.create(Object.create(proxy)),
      Object.setPrototypeOf([], proxy),
      [proxy],
    ];
    for (const input of invalid) rejects(input);
    expect(calls).to.equal(0);
  });

  it('distinguishes admission refusal from opaque caller exceptions, including undefined', () => {
    const refused = rejection(null);
    expect(Object.hasOwn(refused, 'cause')).to.equal(false);
    const lookalike = new TypeError('Invalid UntilInput');
    for (const cause of [undefined, null, false, 0, '', Symbol('caller'), lookalike, refused]) {
      const error = rejection({
        get disposed() {
          throw cause;
        },
      });
      expect(error).not.to.equal(cause);
      expect(Object.hasOwn(error, 'cause')).to.equal(true);
      expect(Object.getOwnPropertyDescriptor(error, 'cause')?.value).to.equal(cause);
    }
  });

  it('retains hostile thrown values without inspecting or formatting them', () => {
    let calls = 0;
    const trap = () => {
      calls++;
      throw new Error('must not inspect caller exception');
    };
    const proxy = new Proxy({}, {
      get: trap,
      getPrototypeOf: trap,
      getOwnPropertyDescriptor: trap,
      ownKeys: trap,
      has: trap,
    });
    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    const hostile = Object.defineProperties({}, {
      name: { get: trap },
      message: { get: trap },
      cause: { get: trap },
      toString: { value: trap },
      [Symbol.toPrimitive]: { value: trap },
    });
    for (const cause of [proxy, revoked.proxy, hostile]) {
      const error = rejection({
        get disposed() {
          throw cause;
        },
      });
      expect(Object.getOwnPropertyDescriptor(error, 'cause')?.value === cause).to.equal(true);
    }
    expect(calls).to.equal(0);
  });

  it('preserves executable structural leaf getters and normalizes arbitrary capture failures', () => {
    const events = Rx.subject();
    let reads = 0;
    const leaf = {
      get disposed() {
        reads++;
        return false;
      },
      get dispose$() {
        reads++;
        return events;
      },
    };
    expect(capture(leaf)).to.equal(leaf);
    expect(reads).to.be.greaterThan(0);
    let coercions = 0;
    const thrown = {
      toString() {
        coercions++;
        throw new Error('must not stringify');
      },
    };
    rejects({
      get disposed() {
        throw thrown;
      },
      dispose$: events,
    });
    expect(coercions).to.equal(0);
  });
});

/** Observe the public rejection without inspecting its opaque cause. */
function rejection(input: unknown): object {
  let error: unknown;
  try {
    Snapshot.until(input);
  } catch (cause) {
    error = cause;
  }
  expect(error).to.be.instanceOf(TypeError);
  if (!Is.error(error)) throw new Error('Expected capture rejection.');
  expect(error.name).to.equal('TypeError');
  expect(error.message).to.equal('Invalid UntilInput');
  return error;
}
